# Gestión de Stock en Estados de Órdenes

## Descripción General

La implementación incluye una lógica especial para el manejo de stock cuando las órdenes cambian entre los estados `PENDING_PAYMENT` y `ON_HOLD`.

## Flujo de Estados y Stock

### 1. Estado PENDING_PAYMENT
Cuando una orden cambia a `PENDING_PAYMENT`:
- **Se libera todo el stock** de los productos de la orden
- Los productos vuelven al inventario disponible
- Se registran movimientos de stock tipo `ENTRY` con razón `RETURN`
- Referencia: `Orden-{orderNumber}` con nota explicativa

### 2. Estado ON_HOLD (desde PENDING_PAYMENT)
Cuando una orden cambia de `PENDING_PAYMENT` a `ON_HOLD`:
- **Se verifica la disponibilidad** de stock para todos los productos
- Si hay **conflictos de stock**, la operación falla con detalles específicos
- Si no hay conflictos, **se reserva nuevamente** el stock
- Se registran movimientos de stock tipo `EXIT` con razón `SALE`

## Métodos Disponibles

### 1. `updateOrderStatusWithConflictHandling`
```typescript
public async updateOrderStatusWithConflictHandling(
  orderId: Types.ObjectId,
  newStatus: OrderStatus,
  userId?: Types.ObjectId,
): Promise<OrderStatusUpdateResultDto>
```

**Retorna información detallada sobre el resultado:**
- `success`: boolean - Si la operación fue exitosa
- `order`: OrderResponseDto | undefined - La orden actualizada (si fue exitosa)
- `stockConflicts`: StockConflictItem[] | undefined - Detalles de conflictos de stock
- `message`: string - Mensaje descriptivo del resultado

### 2. `updateOrderStatusSafe`
```typescript
public async updateOrderStatusSafe(
  orderId: Types.ObjectId,
  newStatus: OrderStatus,
  userId?: Types.ObjectId,
): Promise<OrderResponseDto>
```

**Comportamiento tradicional con errores:**
- Retorna la orden actualizada si es exitoso
- Lanza `AppError` con detalles si hay conflictos o errores

### 3. `checkOrderStockAvailability`
```typescript
public async checkOrderStockAvailability(
  orderId: Types.ObjectId,
): Promise<{ hasConflicts: boolean; conflicts: StockConflictItem[] }>
```

**Para verificar disponibilidad sin hacer cambios:**
- Útil para validaciones previas
- No modifica el estado de la orden

## Tipos de Conflictos de Stock

### StockConflictItem
```typescript
interface StockConflictItem {
  productVariantId: string;
  requiredQuantity: number;
  availableStock: number;
  productInfo: {
    productModel: string;
    sku: string;
    color: { name: string; hex: string };
  };
}
```

## Ejemplos de Uso

### Ejemplo 1: Verificación antes de cambiar estado
```typescript
// Verificar si hay conflictos antes de cambiar estado
const stockCheck = await orderService.checkOrderStockAvailability(orderId);

if (stockCheck.hasConflicts) {
  console.log('Conflictos encontrados:', stockCheck.conflicts);
  // Mostrar detalles al usuario
} else {
  // Proceder con el cambio de estado
  const updatedOrder = await orderService.updateOrderStatusSafe(orderId, OrderStatus.OnHold, userId);
}
```

### Ejemplo 2: Manejo completo con información detallada
```typescript
const result = await orderService.updateOrderStatusWithConflictHandling(
  orderId, 
  OrderStatus.OnHold, 
  userId
);

if (result.success) {
  console.log('Orden actualizada exitosamente:', result.order);
} else {
  console.log('Error:', result.message);
  
  if (result.stockConflicts) {
    console.log('Conflictos de stock:');
    result.stockConflicts.forEach(conflict => {
      console.log(`- ${conflict.productInfo.productModel} (${conflict.productInfo.color.name}): `
        + `necesita ${conflict.requiredQuantity}, disponible ${conflict.availableStock}`);
    });
  }
}
```

### Ejemplo 3: Uso simple con manejo de errores
```typescript
try {
  const updatedOrder = await orderService.updateOrderStatusSafe(orderId, OrderStatus.OnHold, userId);
  console.log('Orden actualizada:', updatedOrder);
} catch (error) {
  if (error instanceof AppError) {
    console.log('Error controlado:', error.message);
  } else {
    console.log('Error inesperado:', error);
  }
}
```

## Transiciones de Estado Válidas

| Estado Origen | Estados Destino Válidos |
|---------------|-------------------------|
| PROCESSING | PENDING_PAYMENT, ON_HOLD, COMPLETED, CANCELLED |
| PENDING_PAYMENT | ON_HOLD, COMPLETED, CANCELLED |
| ON_HOLD | PENDING_PAYMENT, COMPLETED, CANCELLED |
| COMPLETED | REFUNDED |
| CANCELLED | *(ninguno)* |
| REFUNDED | *(ninguno)* |

## Movimientos de Stock Registrados

### Al cambiar a PENDING_PAYMENT:
- **Tipo**: `ENTRY` (Entrada)
- **Razón**: `RETURN` (Devolución)
- **Referencia**: `Orden-{orderNumber}`
- **Notas**: "Liberación de stock - cambio a PENDING_PAYMENT"

### Al cambiar a ON_HOLD (desde PENDING_PAYMENT):
- **Tipo**: `EXIT` (Salida)
- **Razón**: `SALE` (Venta)
- **Referencia**: `Orden-{orderNumber}`
- **Notas**: "Reserva de stock - reactivación desde PENDING_PAYMENT"

## Consideraciones Importantes

1. **Transacciones**: Todas las operaciones se ejecutan dentro de transacciones MongoDB para garantizar consistencia
2. **Logging**: Se registra información detallada de todos los movimientos de stock
3. **Validaciones**: Se valida la existencia de productos antes de realizar movimientos
4. **Rollback**: Si cualquier operación falla, toda la transacción se revierte
5. **Trazabilidad**: Cada movimiento de stock incluye referencia a la orden y usuario que ejecutó la acción
