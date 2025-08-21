import { Router } from 'express';
import { OrderController } from '@controllers/order.controller';
import { validateRequest } from '@middlewares/validate-request';
import { checkAdmin } from '@middlewares/authMiddleware';
import {
  createOrderBodySchema,
  createOrderAdminBodySchema,
  getAllOrdersParamsSchema,
  updateOrderParamsSchema,
  updateOrderBodySchema,
  bulkUpdateOrderStatusBodySchema,
  checkStockAvailabilityParamsSchema,
  updateOrderStatusWithConflictsBodySchema,
} from 'schemas/order.schema';
import { updateItemPricesBodySchema } from 'schemas/updateItemPrices.schema';

const router: Router = Router();

const orderController: OrderController = new OrderController();

router.post('/', validateRequest({ body: createOrderBodySchema }), orderController.createOrder);
router.post(
  '/admin',
  checkAdmin,
  validateRequest({ body: createOrderAdminBodySchema }),
  orderController.createOrderAsAdmin,
);
router.get('/', orderController.getOrdersByUserId);
router.get(
  '/all',
  validateRequest({
    params: getAllOrdersParamsSchema,
  }),
  orderController.getAllOrders,
);

router.patch(
  '/bulk-status',
  checkAdmin,
  validateRequest({ body: bulkUpdateOrderStatusBodySchema }),
  orderController.bulkUpdateOrderStatus,
);

router.get('/:orderId', orderController.getOrderById);

router.patch(
  '/:orderId',
  validateRequest({
    params: updateOrderParamsSchema,
    body: updateOrderBodySchema,
  }),
  orderController.updateOrder,
);

// Ruta de conveniencia para actualizar solo precios
router.patch(
  '/:orderId/update-prices',
  validateRequest({
    params: updateOrderParamsSchema,
    body: updateItemPricesBodySchema,
  }),
  orderController.updateItemPrices,
);

router.get('/:orderId/pdf', orderController.getOrderPDF);

// Rutas para verificación de stock
router.get(
  '/:orderId/stock-availability',
  validateRequest({
    params: checkStockAvailabilityParamsSchema,
  }),
  orderController.checkOrderStockAvailability,
);
router.patch(
  '/:orderId/status-with-conflicts',
  validateRequest({
    params: updateOrderParamsSchema,
    body: updateOrderStatusWithConflictsBodySchema,
  }),
  orderController.updateOrderStatusWithConflictHandling,
);

export default router;
