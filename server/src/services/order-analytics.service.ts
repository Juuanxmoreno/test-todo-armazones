import { BaseAnalyticsService } from './base-analytics.service';
import {
  IAnalyticsDateRange,
  IOrderAnalyticsMetrics,
  IOrderAggregationResult,
  IOrderBreakdownAggregationResult,
  IAnalyticsResult,
  IAnalyticsQuery,
} from '@interfaces/analytics';
import { AnalyticsTimeZone, AnalyticsPeriod, AnalyticsGranularity } from '@enums/analytics.enum';
import {
  OrderAnalyticsResponseDto,
  OrderAnalyticsMetricsDto,
  OrderAnalyticsBreakdownPointDto,
  AnalyticsPeriodDto,
  OrderAnalyticsCurrentDto,
  OrderAnalyticsPreviousDto,
  OrderAnalyticsComparisonDto,
} from '@dto/analytics.dto';
import Order from '@models/Order';
import { OrderStatus } from '@enums/order.enum';
import { PipelineStage } from 'mongoose';

/**
 * Servicio específico para analytics de órdenes
 * Extiende BaseAnalyticsService para reutilizar funcionalidad común
 */
export class OrderAnalyticsService extends BaseAnalyticsService<IOrderAnalyticsMetrics> {
  constructor(timezone: AnalyticsTimeZone = AnalyticsTimeZone.Argentina) {
    super(timezone);
  }

  /**
   * Implementación específica para calcular métricas totales de órdenes
   */
  protected async calculateTotalMetrics(dateRange: IAnalyticsDateRange): Promise<IOrderAnalyticsMetrics> {
    // Validar que el rango de fechas sea válido
    if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
      console.error('Invalid date range provided to calculateTotalMetrics:', dateRange);
      return this.createEmptyMetrics();
    }

    if (dateRange.startDate >= dateRange.endDate) {
      console.error('Start date must be before end date:', dateRange);
      return this.createEmptyMetrics();
    }

    const pipeline: PipelineStage[] = [
      // Filtrar por rango de fechas y estados válidos (excluir canceladas)
      {
        $match: {
          createdAt: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate,
          },
          orderStatus: { $nin: [OrderStatus.Cancelled, OrderStatus.Refunded] },
        },
      },
      // Usar facet para calcular métricas en paralelo sin duplicar totalAmount
      {
        $facet: {
          // Para obtener totalAmount y orderCount (sin unwind)
          orderMetrics: [
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$totalAmount' },
                orderCount: { $sum: 1 },
              },
            },
          ],
          // Para obtener totalCost e itemCount (con unwind)
          itemMetrics: [
            { $unwind: '$items' },
            {
              $group: {
                _id: null,
                totalCost: {
                  $sum: {
                    $multiply: ['$items.costUSDAtPurchase', '$items.quantity'],
                  },
                },
                itemCount: { $sum: '$items.quantity' },
              },
            },
          ],
        },
      },
      // Combinar los resultados
      {
        $project: {
          totalAmount: { $arrayElemAt: ['$orderMetrics.totalAmount', 0] },
          orderCount: { $arrayElemAt: ['$orderMetrics.orderCount', 0] },
          totalCost: { $arrayElemAt: ['$itemMetrics.totalCost', 0] },
          itemCount: { $arrayElemAt: ['$itemMetrics.itemCount', 0] },
        },
      },
    ];

    const results = await Order.aggregate<IOrderAggregationResult>(pipeline);
    const data = results[0];

    if (!data) {
      return this.createEmptyMetrics();
    }

    const gross = this.roundToTwoDecimals(data.totalAmount || 0);
    const totalCost = this.roundToTwoDecimals(data.totalCost || 0);
    const net = this.roundToTwoDecimals(gross - totalCost);
    const count = data.orderCount || 0;
    const items = data.itemCount || 0;

    // Calcular promedios diarios
    const averageGrossDaily = this.roundToTwoDecimals(this.calculateDailyAverages(gross, dateRange));
    const averageNetDaily = this.roundToTwoDecimals(this.calculateDailyAverages(net, dateRange));

    return {
      gross,
      net,
      count,
      items,
      averageGrossDaily,
      averageNetDaily,
    };
  }

  /**
   * Crea métricas vacías para cuando no hay datos
   */
  private createEmptyMetrics(): IOrderAnalyticsMetrics {
    return {
      gross: 0,
      net: 0,
      count: 0,
      items: 0,
      averageGrossDaily: 0,
      averageNetDaily: 0,
    };
  }

  /**
   * Método optimizado para calcular breakdown temporal con una sola consulta de agregación
   */
  protected async calculateBreakdown(
    dateRange: IAnalyticsDateRange,
    granularity: AnalyticsGranularity,
    timezone: AnalyticsTimeZone,
  ): Promise<Array<{ timestamp: Date; label: string; metrics: IOrderAnalyticsMetrics }>> {
    // Validar que el rango de fechas sea válido
    if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
      console.error('Invalid date range provided to calculateBreakdown:', dateRange);
      return [];
    }

    if (dateRange.startDate >= dateRange.endDate) {
      console.error('Start date must be before end date:', dateRange);
      return [];
    }

    // Determinar el formato de fecha según la granularidad
    const dateFormat = this.getDateFormatForGranularity(granularity);

    const pipeline: PipelineStage[] = [
      // Filtrar por rango de fechas y estados válidos
      {
        $match: {
          createdAt: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate,
          },
          orderStatus: { $nin: [OrderStatus.Cancelled, OrderStatus.Refunded] },
        },
      },
      // Usar facet para calcular métricas por intervalo en paralelo
      {
        $facet: {
          // Métricas de órdenes (sin unwind)
          orderMetrics: [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: dateFormat,
                    date: '$createdAt',
                    timezone: timezone,
                  },
                },
                totalAmount: { $sum: '$totalAmount' },
                orderCount: { $sum: 1 },
              },
            },
          ],
          // Métricas de items (con unwind)
          itemMetrics: [
            { $unwind: '$items' },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: dateFormat,
                    date: '$createdAt',
                    timezone: timezone,
                  },
                },
                totalCost: {
                  $sum: {
                    $multiply: ['$items.costUSDAtPurchase', '$items.quantity'],
                  },
                },
                itemCount: { $sum: '$items.quantity' },
              },
            },
          ],
        },
      },
      // Combinar resultados de facet
      {
        $project: {
          combined: {
            $map: {
              input: '$orderMetrics',
              as: 'order',
              in: {
                _id: '$$order._id',
                totalAmount: '$$order.totalAmount',
                orderCount: '$$order.orderCount',
                totalCost: {
                  $let: {
                    vars: {
                      itemMetric: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$itemMetrics',
                              cond: { $eq: ['$$this._id', '$$order._id'] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: { $ifNull: ['$$itemMetric.totalCost', 0] },
                  },
                },
                itemCount: {
                  $let: {
                    vars: {
                      itemMetric: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$itemMetrics',
                              cond: { $eq: ['$$this._id', '$$order._id'] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: { $ifNull: ['$$itemMetric.itemCount', 0] },
                  },
                },
              },
            },
          },
        },
      },
      // Descomponer array combined
      { $unwind: '$combined' },
      // Reemplazar documento raíz con combined
      { $replaceRoot: { newRoot: '$combined' } },
      // Ordenar por fecha
      { $sort: { _id: 1 } },
    ];

    const results = await Order.aggregate<IOrderBreakdownAggregationResult>(pipeline);

    // Validar que results no sea undefined o null
    if (!results || !Array.isArray(results)) {
      console.error('Analytics breakdown aggregation returned invalid results:', results);
      return [];
    }

    // Convertir resultados al formato esperado
    return results.map((result) => {
      const timestamp = this.parseTimestampFromGroupId(result._id, granularity);
      const label = this.generateLabelFromTimestamp(timestamp, granularity);

      const gross = this.roundToTwoDecimals(result.totalAmount || 0);
      const totalCost = this.roundToTwoDecimals(result.totalCost || 0);
      const net = this.roundToTwoDecimals(gross - totalCost);
      const count = result.orderCount || 0;
      const items = result.itemCount || 0;

      // Para breakdown, los promedios diarios no aplican (se calculan por intervalo)
      const metrics: IOrderAnalyticsMetrics = {
        gross,
        net,
        count,
        items,
        averageGrossDaily: 0,
        averageNetDaily: 0,
      };

      return {
        timestamp,
        label,
        metrics,
      };
    });
  }

  /**
   * Obtiene el formato de fecha para MongoDB según la granularidad
   */
  private getDateFormatForGranularity(granularity: AnalyticsGranularity): string {
    switch (granularity) {
      case AnalyticsGranularity.Hour:
        return '%Y-%m-%dT%H:00:00.000Z'; // "2025-08-07T14:00:00.000Z"
      case AnalyticsGranularity.Day:
        return '%Y-%m-%d'; // "2025-08-07"
      case AnalyticsGranularity.Week:
        return '%Y-W%U'; // "2025-W32" (semana del año)
      case AnalyticsGranularity.Month:
        return '%Y-%m'; // "2025-08"
      default:
        throw new Error(`Granularidad no soportada: ${granularity}`);
    }
  }

  /**
   * Convierte el _id agrupado de vuelta a timestamp en timezone de Argentina
   */
  private parseTimestampFromGroupId(groupId: string, granularity: AnalyticsGranularity): Date {
    switch (granularity) {
      case AnalyticsGranularity.Hour:
        // Para horas, el groupId ya viene en formato ISO completo
        return new Date(groupId);

      case AnalyticsGranularity.Day: {
        // Para días, el groupId es "2025-08-01" y representa ese día en Argentina
        // Necesitamos crear la fecha interpretándola como si fuera en timezone argentino
        const [year, month, day] = groupId.split('-').map(Number);
        const dateInArgentina = new Date(year, month - 1, day, 0, 0, 0, 0);
        // Esta fecha representa medianoche del día especificado en Argentina
        return dateInArgentina;
      }

      case AnalyticsGranularity.Week: {
        // Parsear formato "2025-W32"
        const [year, weekStr] = groupId.split('-W');
        const weekNum = parseInt(weekStr, 10);
        // Calcular fecha del lunes de esa semana en Argentina
        const dateInArgentina = new Date(parseInt(year, 10), 0, 1);
        const dayOfWeek = dateInArgentina.getDay();
        const daysToAdd = (weekNum - 1) * 7 - dayOfWeek + 1;
        dateInArgentina.setDate(dateInArgentina.getDate() + daysToAdd);
        return dateInArgentina;
      }

      case AnalyticsGranularity.Month: {
        // Para meses, el groupId es "2025-08" y representa ese mes en Argentina
        const [year, month] = groupId.split('-').map(Number);
        const dateInArgentina = new Date(year, month - 1, 1, 0, 0, 0, 0);
        return dateInArgentina;
      }

      default:
        throw new Error(`Granularidad no soportada: ${granularity}`);
    }
  }

  /**
   * Genera label legible para el timestamp en timezone de Argentina
   */
  private generateLabelFromTimestamp(timestamp: Date, granularity: AnalyticsGranularity): string {
    // El timestamp ya representa correctamente la fecha/hora en Argentina
    switch (granularity) {
      case AnalyticsGranularity.Hour:
        return timestamp.toLocaleString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      case AnalyticsGranularity.Day:
        return timestamp.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      case AnalyticsGranularity.Week:
        return `Semana del ${timestamp.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
        })}`;
      case AnalyticsGranularity.Month:
        return timestamp.toLocaleDateString('es-AR', {
          month: 'long',
          year: 'numeric',
        });
      default:
        return timestamp.toISOString();
    }
  }

  /**
   * Mapea IOrderAnalyticsMetrics a OrderAnalyticsMetricsDto
   */
  private mapMetricsToDto(metrics: IOrderAnalyticsMetrics): OrderAnalyticsMetricsDto {
    return {
      gross: metrics.gross,
      net: metrics.net,
      count: metrics.count,
      items: metrics.items,
      averageGrossDaily: metrics.averageGrossDaily,
      averageNetDaily: metrics.averageNetDaily,
    };
  }

  /**
   * Mapea IAnalyticsResult a OrderAnalyticsResponseDto
   */
  public mapToResponseDto(result: IAnalyticsResult<IOrderAnalyticsMetrics>): OrderAnalyticsResponseDto {
    const period: AnalyticsPeriodDto = {
      type: result.period.type,
      range: {
        startDate: result.period.range.startDate.toISOString(),
        endDate: result.period.range.endDate.toISOString(),
      },
      ...(result.period.granularity && { granularity: result.period.granularity }),
    };

    const current: OrderAnalyticsCurrentDto = {
      total: this.mapMetricsToDto(result.current.total),
      ...(result.current.breakdown && {
        breakdown: result.current.breakdown.map(
          (point): OrderAnalyticsBreakdownPointDto => ({
            timestamp: point.timestamp.toISOString(),
            label: point.label,
            metrics: this.mapMetricsToDto(point.metrics),
          }),
        ),
      }),
    };

    const response: OrderAnalyticsResponseDto = {
      period,
      current,
    };

    if (result.previous) {
      const comparison: OrderAnalyticsComparisonDto = {
        grossChange: result.previous.comparison.gross,
        netChange: result.previous.comparison.net,
        countChange: result.previous.comparison.count,
        itemsChange: result.previous.comparison.items,
        averageGrossDailyChange: result.previous.comparison.averageGrossDaily,
        averageNetDailyChange: result.previous.comparison.averageNetDaily,
      };

      const previous: OrderAnalyticsPreviousDto = {
        total: this.mapMetricsToDto(result.previous.total),
        comparison,
      };

      response.previous = previous;
    }

    return response;
  }

  /**
   * Método público para obtener analytics de órdenes
   * (wrapper que utiliza el método base getAnalytics)
   */
  public async getOrderAnalytics(
    period: string,
    granularity?: string,
    timezone: AnalyticsTimeZone = AnalyticsTimeZone.Argentina,
    customRange?: { startDate: string; endDate: string },
    compareWithPrevious: boolean = false,
  ): Promise<OrderAnalyticsResponseDto> {
    // Validaciones básicas
    if (!Object.values(AnalyticsPeriod).includes(period as AnalyticsPeriod)) {
      throw new Error(`Período inválido: ${period}`);
    }

    if (granularity && !Object.values(AnalyticsGranularity).includes(granularity as AnalyticsGranularity)) {
      throw new Error(`Granularidad inválida: ${granularity}`);
    }

    if (period === AnalyticsPeriod.Custom && (!customRange?.startDate || !customRange?.endDate)) {
      throw new Error('customRange es requerido para período Custom');
    }

    const query: IAnalyticsQuery = {
      period: period as AnalyticsPeriod,
      timezone,
      compareWithPrevious,
      ...(granularity && { granularity: granularity as AnalyticsGranularity }),
      ...(customRange && { customRange }),
    };

    const result = await this.getAnalytics(query);
    return this.mapToResponseDto(result);
  }
}
