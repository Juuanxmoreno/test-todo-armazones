import Expense, { IExpenseDocument } from '@models/Expense';
import {
  CreateExpenseRequestDto,
  ExpenseResponseDto,
  ExpenseListResponseDto,
  MonthlyExpenseFilters,
  BluelyticsApiResponse,
} from '@dto/expense.dto';
import { ExpenseType, Currency } from '@interfaces/expense';
import { StockMovementReason, StockMovementType } from '@interfaces/stockMovement';
import { AppError } from '@utils/AppError';
import logger from '@config/logger';
import { Types, FilterQuery } from 'mongoose';

// Interfaces para documentos populados
interface PopulatedStockMovement {
  _id?: Types.ObjectId;
  type: StockMovementType;
  reason: StockMovementReason;
}

interface PopulatedUser {
  _id?: Types.ObjectId;
  displayName: string;
  email: string;
}

interface PopulatedExpenseDocument extends Omit<IExpenseDocument, 'stockMovement' | 'createdBy'> {
  stockMovement?: PopulatedStockMovement | Types.ObjectId;
  createdBy?: PopulatedUser | Types.ObjectId;
}

export class ExpenseService {
  /**
   * Obtiene la tasa de cambio blue del dólar desde la API de Bluelytics
   */
  private async getBlueExchangeRate(): Promise<number> {
    try {
      const response = await fetch('https://api.bluelytics.com.ar/v2/latest');

      if (!response.ok) {
        throw new AppError('Error al obtener la cotización del dólar', 500);
      }

      const data = (await response.json()) as BluelyticsApiResponse;

      if (!data.blue?.value_sell) {
        throw new AppError('Cotización del dólar no disponible', 500);
      }

      return data.blue.value_sell;
    } catch (error: unknown) {
      logger.error('Error fetching blue exchange rate', { error });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Error al obtener la cotización del dólar', 500, 'error', false, {
        cause: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Convierte montos entre ARS y USD
   */
  private async convertCurrency(
    amount: number,
    fromCurrency: Currency,
    exchangeRate?: number,
  ): Promise<{ amountARS: number; amountUSD: number; exchangeRate: number }> {
    if (fromCurrency === Currency.USD) {
      // Si es USD, obtener tasa de cambio y convertir a ARS
      const rate = exchangeRate || (await this.getBlueExchangeRate());
      return {
        amountARS: amount * rate,
        amountUSD: amount,
        exchangeRate: rate,
      };
    } else {
      // Si es ARS, obtener tasa de cambio y convertir a USD
      const rate = exchangeRate || (await this.getBlueExchangeRate());
      return {
        amountARS: amount,
        amountUSD: amount / rate,
        exchangeRate: rate,
      };
    }
  }

  /**
   * Crea un gasto manual
   */
  public async createManualExpense(
    dto: CreateExpenseRequestDto,
    createdBy?: Types.ObjectId,
  ): Promise<ExpenseResponseDto> {
    try {
      const { amountARS, amountUSD, exchangeRate } = await this.convertCurrency(dto.amount, dto.currency);

      const expense = new Expense({
        type: ExpenseType.MANUAL,
        description: dto.description,
        amountARS,
        amountUSD,
        currency: dto.currency,
        exchangeRate: dto.currency === Currency.ARS ? exchangeRate : undefined,
        reference: dto.reference,
        createdBy,
      });

      await expense.save();

      return this.mapExpenseToResponseDto(expense);
    } catch (error: unknown) {
      logger.error('Error creating manual expense', { error, dto });

      throw error instanceof AppError
        ? error
        : new AppError('Error al crear gasto manual.', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          });
    }
  }

  /**
   * Crea un gasto automático por movimiento de stock (DAMAGE o THEFT)
   */
  public async createStockExpense(
    stockMovementId: Types.ObjectId,
    reason: StockMovementReason,
    amountUSD: number,
    description: string,
    createdBy?: Types.ObjectId,
  ): Promise<ExpenseResponseDto> {
    try {
      const { amountARS, exchangeRate } = await this.convertCurrency(amountUSD, Currency.USD);

      const expenseType = reason === StockMovementReason.DAMAGE ? ExpenseType.STOCK_DAMAGE : ExpenseType.STOCK_THEFT;

      const expense = new Expense({
        type: expenseType,
        description,
        amountARS,
        amountUSD,
        currency: Currency.USD, // Los costos de stock están en USD
        exchangeRate,
        stockMovement: stockMovementId,
        createdBy,
      });

      await expense.save();

      return this.mapExpenseToResponseDto(expense);
    } catch (error: unknown) {
      logger.error('Error creating stock expense', {
        error,
        stockMovementId,
        reason,
        amountUSD,
      });

      throw error instanceof AppError
        ? error
        : new AppError('Error al crear gasto por movimiento de stock.', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          });
    }
  }

  /**
   * Obtiene gastos por mes
   */
  public async getMonthlyExpenses(
    filters: MonthlyExpenseFilters,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ExpenseListResponseDto> {
    try {
      // Crear rango de fechas para el mes especificado
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);

      // Construir query de filtros
      const query: FilterQuery<IExpenseDocument> = {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };

      if (filters.type) {
        query.type = filters.type;
      }

      if (filters.currency) {
        query.currency = filters.currency;
      }

      // Obtener gastos
      const expenses = await Expense.find(query)
        .populate({
          path: 'stockMovement',
          select: 'type reason',
        })
        .populate({
          path: 'createdBy',
          select: 'displayName email',
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      // Contar total de gastos
      const totalExpenses = await Expense.countDocuments(query);

      // Calcular totales
      const totals = await Expense.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalAmountARS: { $sum: '$amountARS' },
            totalAmountUSD: { $sum: '$amountUSD' },
          },
        },
      ]);

      const totalAmountARS = totals[0]?.totalAmountARS || 0;
      const totalAmountUSD = totals[0]?.totalAmountUSD || 0;

      // Mapear resultados
      const mappedExpenses: ExpenseResponseDto[] = expenses.map((expense: PopulatedExpenseDocument) =>
        this.mapExpenseToResponseDto(expense),
      );

      return {
        expenses: mappedExpenses,
        totalExpenses,
        totalAmountARS,
        totalAmountUSD,
      };
    } catch (error: unknown) {
      logger.error('Error getting monthly expenses', { error, filters });

      throw error instanceof AppError
        ? error
        : new AppError('Error al obtener gastos mensuales.', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          });
    }
  }

  /**
   * Mapea un documento de gasto a DTO de respuesta
   */
  private mapExpenseToResponseDto(expense: PopulatedExpenseDocument): ExpenseResponseDto {
    const result: ExpenseResponseDto = {
      id: expense._id.toString(),
      type: expense.type,
      description: expense.description,
      amountARS: expense.amountARS,
      amountUSD: expense.amountUSD,
      currency: expense.currency,
      createdAt: expense.createdAt,
    };

    // Asignar propiedades opcionales solo si existen
    if (expense.exchangeRate !== undefined) {
      result.exchangeRate = expense.exchangeRate;
    }

    if (expense.reference !== undefined) {
      result.reference = expense.reference;
    }

    if (expense.stockMovement) {
      // Verificar si stockMovement está populado (tiene propiedades type y reason)
      const isPopulated =
        expense.stockMovement && typeof expense.stockMovement === 'object' && 'type' in expense.stockMovement;

      if (isPopulated) {
        const stockMovement = expense.stockMovement as PopulatedStockMovement;
        result.stockMovement = {
          id: stockMovement._id?.toString() || '',
          type: stockMovement.type || '',
          reason: stockMovement.reason || '',
        };
      } else {
        // Si no está populado, solo tenemos el ObjectId
        result.stockMovement = {
          id: (expense.stockMovement as Types.ObjectId).toString(),
          type: '',
          reason: '',
        };
      }
    }

    if (expense.createdBy) {
      // Verificar si createdBy está populado (tiene propiedades displayName y email)
      const isPopulated =
        expense.createdBy && typeof expense.createdBy === 'object' && 'displayName' in expense.createdBy;

      if (isPopulated) {
        const createdBy = expense.createdBy as PopulatedUser;
        result.createdBy = {
          id: createdBy._id?.toString() || '',
          displayName: createdBy.displayName || '',
          email: createdBy.email || '',
        };
      } else {
        // Si no está populado, solo tenemos el ObjectId
        result.createdBy = {
          id: (expense.createdBy as Types.ObjectId).toString(),
          displayName: '',
          email: '',
        };
      }
    }

    return result;
  }
}
