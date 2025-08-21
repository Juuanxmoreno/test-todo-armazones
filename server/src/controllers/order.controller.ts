import { Request, Response, NextFunction } from 'express';
import {
  CreateOrderDto,
  CreateOrderAdminDto,
  UpdateOrderDto,
  UpdateOrderItemDto,
  BulkUpdateOrderStatusDto,
} from '@dto/order.dto';
import { OrderService } from '@services/order.service';
import { getSessionUserId } from '@utils/sessionUtils';
import logger from '@config/logger';
import { AppError } from '@utils/AppError';
import { Types } from 'mongoose';
import { OrderStatus } from '@enums/order.enum';
import { getAllOrdersParamsSchema } from 'schemas/order.schema';
import { ApiResponse } from '../types/response';

export class OrderController {
  private orderService: OrderService = new OrderService();

  public createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getSessionUserId(req.session);
      const orderData: CreateOrderDto = req.body;

      const newOrder = await this.orderService.createOrder(userId, orderData);

      logger.info('Orden creada exitosamente', {
        orderId: newOrder.id,
        userId: userId.toString(),
      });

      const response: ApiResponse<typeof newOrder> = {
        status: 'success',
        message: 'Orden creada exitosamente',
        data: newOrder,
      };
      res.status(201).json(response);
    } catch (error) {
      logger.error('Error al crear la orden', {
        error,
        userId: req.session?.user?._id,
        body: req.body,
      });

      // Manejo especial para error de carrito actualizado por falta de stock
      if (error instanceof CartSyncError) {
        res.status(409).json({
          status: 'fail',
          message: error.message,
          changes: error.changes,
          cart: error.cart,
        });
      }

      // Envolver errores desconocidos en AppError para mantener consistencia
      if (!(error instanceof AppError)) {
        return next(
          new AppError('Error inesperado al crear la orden', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          }),
        );
      }

      return next(error); // Propaga a errorHandler
    }
  };

  public createOrderAsAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = getSessionUserId(req.session);
      const orderData: CreateOrderAdminDto = req.body;

      // Convertir userId string a ObjectId
      const processedOrderData = {
        ...orderData,
        userId: new Types.ObjectId(orderData.userId),
        items: orderData.items.map((item) => ({
          ...item,
          productVariantId: new Types.ObjectId(item.productVariantId),
        })),
        ...(orderData.createdAt && {
          createdAt: new Date(orderData.createdAt),
        }),
      };

      const newOrder = await this.orderService.createOrderAsAdmin(processedOrderData, adminUserId);

      logger.info('Orden creada exitosamente por administrador', {
        orderId: newOrder.id,
        targetUserId: processedOrderData.userId.toString(),
        adminUserId: adminUserId.toString(),
        itemsCount: processedOrderData.items.length,
      });

      const response: ApiResponse<typeof newOrder> = {
        status: 'success',
        message: 'Orden creada exitosamente por administrador',
        data: newOrder,
      };
      res.status(201).json(response);
    } catch (error) {
      logger.error('Error al crear la orden como administrador', {
        error,
        adminUserId: req.session?.user?._id,
        body: req.body,
      });

      // Envolver errores desconocidos en AppError para mantener consistencia
      if (!(error instanceof AppError)) {
        return next(
          new AppError('Error inesperado al crear la orden como administrador', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          }),
        );
      }

      return next(error); // Propaga a errorHandler
    }
  };

  public getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId } = req.params;
      if (!orderId) throw new AppError('Falta orderId', 400, 'fail');

      const order = await this.orderService.getOrderById(new Types.ObjectId(orderId));

      const response: ApiResponse<typeof order> = {
        status: 'success',
        message: 'Orden obtenida exitosamente',
        data: order,
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Error al obtener la orden por ID', {
        error,
        orderId: req.params?.orderId,
      });

      if (!(error instanceof AppError)) {
        return next(
          new AppError('Error inesperado al obtener la orden', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          }),
        );
      }

      return next(error);
    }
  };

  public getOrdersByUserId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getSessionUserId(req.session);
      // Parsear query params para paginación y filtro
      const { cursor, limit, status } = getAllOrdersParamsSchema.parse(req.query);
      const orders = await this.orderService.getOrdersByUserId(userId, cursor ?? null, limit ?? 10, status);

      const response: ApiResponse<typeof orders> = {
        status: 'success',
        message: 'Órdenes obtenidas exitosamente',
        data: orders,
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Error al obtener las órdenes del usuario', {
        error,
        userId: req.session?.user?._id,
      });

      if (!(error instanceof AppError)) {
        return next(
          new AppError('Error inesperado al obtener las órdenes', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          }),
        );
      }

      return next(error);
    }
  };

  public getAllOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { cursor, limit, status } = getAllOrdersParamsSchema.parse(req.query);

      const orders = await this.orderService.getAllOrders(cursor ?? null, limit ?? 10, status);

      const response: ApiResponse<typeof orders> = {
        status: 'success',
        message: 'Órdenes obtenidas exitosamente (admin)',
        data: orders,
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Error al obtener todas las órdenes (admin)', {
        error,
        query: req.query,
      });

      if (!(error instanceof AppError)) {
        return next(
          new AppError('Error inesperado al obtener las órdenes', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          }),
        );
      }

      return next(error);
    }
  };

  public updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { orderStatus } = req.body;

      if (!orderId || !orderStatus) {
        throw new AppError('Faltan datos requeridos: orderId o orderStatus.', 400, 'fail');
      }

      // Obtener el userId de la sesión para trazabilidad
      const userId = getSessionUserId(req.session);

      // Usar updateOrder con solo el campo orderStatus
      const updateData: UpdateOrderDto = {
        orderStatus: orderStatus as OrderStatus,
      };

      const updatedOrder = await this.orderService.updateOrder(new Types.ObjectId(orderId), updateData, userId);

      logger.info('Estado de orden actualizado exitosamente', {
        orderId,
        newStatus: orderStatus,
        updatedBy: userId.toString(),
      });

      const response: ApiResponse<typeof updatedOrder> = {
        status: 'success',
        message: 'Estado de orden actualizado exitosamente',
        data: updatedOrder,
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Error al actualizar el estado de la orden', {
        error,
        orderId: req.params?.orderId,
        body: req.body,
      });

      if (!(error instanceof AppError)) {
        return next(
          new AppError('Error inesperado al actualizar el estado de la orden', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          }),
        );
      }

      return next(error);
    }
  };

  public updateOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId } = req.params;
      const updateData = req.body;

      if (!orderId) {
        throw new AppError('Falta orderId', 400, 'fail');
      }

      // Obtener el userId de la sesión para trazabilidad
      const userId = getSessionUserId(req.session);

      // Convertir string dates a Date objects y ObjectIds
      const processedUpdateData = {
        ...updateData,
        ...(updateData.createdAt && {
          createdAt: new Date(updateData.createdAt),
        }),
        ...(updateData.items && {
          items: updateData.items.map((item: UpdateOrderItemDto) => ({
            ...item,
            productVariantId: new Types.ObjectId(item.productVariantId),
          })),
        }),
      };

      const updatedOrder = await this.orderService.updateOrder(
        new Types.ObjectId(orderId),
        processedUpdateData,
        userId,
      );

      logger.info('Orden actualizada exitosamente', {
        orderId,
        updatedBy: userId.toString(),
        changes: updateData,
      });

      const response: ApiResponse<typeof updatedOrder> = {
        status: 'success',
        message: 'Orden actualizada exitosamente',
        data: updatedOrder,
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Error al actualizar la orden', {
        error,
        orderId: req.params?.orderId,
        body: req.body,
      });

      if (!(error instanceof AppError)) {
        return next(
          new AppError('Error inesperado al actualizar la orden', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          }),
        );
      }

      return next(error);
    }
  };

  /**
   * Método de conveniencia para actualizar solo precios de items
   * Simplifica el proceso para casos comunes
   */
  public updateItemPrices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { items } = req.body;

      if (!orderId) {
        throw new AppError('Falta orderId', 400, 'fail');
      }

      const userId = getSessionUserId(req.session);

      // Convertir a formato UpdateOrderDto con action update_prices
      const updateData = {
        items: items.map(
          (item: { productVariantId: string; costUSDAtPurchase: number; priceUSDAtPurchase: number }) => ({
            ...item,
            action: 'update_prices' as const,
            productVariantId: new Types.ObjectId(item.productVariantId),
          }),
        ),
      };

      const updatedOrder = await this.orderService.updateOrder(new Types.ObjectId(orderId), updateData, userId);

      logger.info('Precios de items actualizados exitosamente', {
        orderId,
        updatedBy: userId.toString(),
        itemsCount: items.length,
      });

      const response: ApiResponse<typeof updatedOrder> = {
        status: 'success',
        message: 'Precios de items actualizados exitosamente',
        data: updatedOrder,
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Error al actualizar precios de items', {
        error,
        orderId: req.params?.orderId,
        body: req.body,
      });

      if (!(error instanceof AppError)) {
        return next(
          new AppError('Error inesperado al actualizar precios de items', 500, 'error', false, {
            cause: error instanceof Error ? error.message : String(error),
          }),
        );
      }

      return next(error);
    }
  };

  public bulkUpdateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = getSessionUserId(req.session);
      const { orderIds, newStatus }: BulkUpdateOrderStatusDto = req.body;

      // Convertir strings a ObjectIds
      const objectIds = orderIds.map((id) => new Types.ObjectId(id));

      const result = await this.orderService.bulkUpdateOrderStatus(objectIds, newStatus, userId);

      logger.info('Actualización masiva de estados completada', {
        totalRequested: result.totalRequested,
        totalSuccessful: result.totalSuccessful,
        totalFailed: result.totalFailed,
        newStatus,
        updatedBy: userId.toString(),
      });

      const response: ApiResponse<typeof result> = {
        status: 'success',
        message: `Actualización masiva completada. ${result.totalSuccessful} órdenes actualizadas, ${result.totalFailed} fallaron.`,
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Error en actualización masiva de estados de órdenes', {
        error,
        body: req.body,
        userId: req.session?.user?._id,
      });

      if (!(error instanceof AppError)) {
        const wrappedError = new AppError('Error inesperado en actualización masiva', 500, 'error', false, {
          cause: error instanceof Error ? error.message : String(error),
        });
        return next(wrappedError);
      }

      return next(error);
    }
  };

  public getOrderPDF = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId } = req.params;
      if (!orderId) throw new AppError('Falta orderId', 400, 'fail');
      const { buffer, orderNumber } = await this.orderService.generateOrderPDF(new Types.ObjectId(orderId));
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Orden-${orderNumber}.pdf`,
      });
      res.send(buffer);
    } catch (error) {
      logger.error('Error al generar PDF de la orden', {
        error,
        orderId: req.params?.orderId,
      });
      return next(
        error instanceof AppError
          ? error
          : new AppError('Error inesperado al generar PDF', 500, 'error', false, {
              cause: error instanceof Error ? error.message : String(error),
            }),
      );
    }
  };

  public checkOrderStockAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId } = req.params;
      if (!orderId) throw new AppError('Falta orderId', 400, 'fail');

      const stockCheck = await this.orderService.checkOrderStockAvailability(new Types.ObjectId(orderId));

      logger.info('Verificación de stock de orden completada', {
        orderId,
        hasConflicts: stockCheck.hasConflicts,
        conflictsCount: stockCheck.conflicts.length,
      });

      const response: ApiResponse<typeof stockCheck> = {
        status: 'success',
        message: stockCheck.hasConflicts
          ? `Se encontraron ${stockCheck.conflicts.length} conflictos de stock`
          : 'Stock disponible para todos los productos',
        data: stockCheck,
      };
      res.status(200).json(response);
    } catch (error) {
      logger.error('Error al verificar disponibilidad de stock de la orden', {
        error,
        orderId: req.params?.orderId,
      });

      if (!(error instanceof AppError)) {
        const wrappedError = new AppError('Error inesperado al verificar stock', 500, 'error', false, {
          cause: error instanceof Error ? error.message : String(error),
        });
        return next(wrappedError);
      }

      return next(error);
    }
  };

  public updateOrderStatusWithConflictHandling = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { orderStatus } = req.body;

      if (!orderId || !orderStatus) {
        throw new AppError('Faltan parámetros requeridos: orderId y orderStatus', 400, 'fail');
      }

      // Obtener el userId de la sesión para trazabilidad
      const userId = getSessionUserId(req.session);

      const result = await this.orderService.updateOrderStatusWithConflictHandling(
        new Types.ObjectId(orderId),
        orderStatus as OrderStatus,
        userId,
      );

      logger.info('Actualización de estado con manejo de conflictos completada', {
        orderId,
        newStatus: orderStatus,
        success: result.success,
        hasConflicts: result.stockConflicts ? result.stockConflicts.length > 0 : false,
        updatedBy: userId.toString(),
      });

      const response: ApiResponse<typeof result> = {
        status: result.success ? 'success' : 'fail',
        message: result.message,
        data: result,
      };

      // Si hay conflictos de stock, enviar status 409 (Conflict)
      const statusCode = result.success ? 200 : result.stockConflicts ? 409 : 400;
      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Error al actualizar estado de orden con manejo de conflictos', {
        error,
        orderId: req.params?.orderId,
        body: req.body,
      });

      if (!(error instanceof AppError)) {
        const wrappedError = new AppError('Error inesperado al actualizar estado de orden', 500, 'error', false, {
          cause: error instanceof Error ? error.message : String(error),
        });
        return next(wrappedError);
      }

      return next(error);
    }
  };
}

// Tipo para los cambios del carrito
export interface CartSyncChange {
  productVariant: {
    id: string;
    color: { name: string; hex: string };
    images: string[];
    priceUSD: number;
    product: {
      id: string;
      slug: string;
      thumbnail: string;
      productModel: string;
      sku: string;
      size?: string | undefined;
    };
  } | null;
  oldQuantity: number;
  newQuantity: number;
  removed: boolean;
  stock: number;
}

// Error especializado para carrito desincronizado con stock
export class CartSyncError extends AppError {
  public readonly changes: CartSyncChange[];
  public readonly cart: Record<string, unknown>;
  constructor(message: string, changes: CartSyncChange[], cart: Record<string, unknown>) {
    super(message, 409, 'fail', true);
    this.changes = changes;
    this.cart = cart;
  }
}
