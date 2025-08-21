# Guía de Actualización de Items de Órdenes

Esta guía explica cómo usar las nuevas funcionalidades para actualizar completamente los items de una orden, incluyendo precios, costos y valores financieros.

## Nuevas Acciones Disponibles

### 1. `update_prices` - Actualización Solo de Precios

Actualiza únicamente los precios de un item existente. Los campos `subTotal` y `gainUSD` se recalculan automáticamente.

**Campos requeridos:**
- `productVariantId`: ID del ProductVariant a actualizar
- `action`: `"update_prices"`
- `costUSDAtPurchase` y/o `priceUSDAtPurchase`: Al menos uno debe estar presente

**Ejemplo:**
```json
{
  "items": [
    {
      "productVariantId": "6507f1f77bcf86cd799439011",
      "action": "update_prices",
      "costUSDAtPurchase": 15.50,
      "priceUSDAtPurchase": 25.00
    }
  ]
}
```

**Resultado:**
- `costUSDAtPurchase`: 15.50
- `priceUSDAtPurchase`: 25.00
- `subTotal`: Recalculado automáticamente (25.00 × cantidad actual)
- `gainUSD`: Recalculado automáticamente ((25.00 - 15.50) × cantidad actual)

### 2. `update_all` - Actualización Completa

Permite actualizar cualquier combinación de campos del item, incluyendo override manual de `subTotal` y `gainUSD`.

**Campos opcionales:**
- `productVariantId`: ID del ProductVariant a actualizar
- `action`: `"update_all"`
- `quantity`: Nueva cantidad (maneja stock automáticamente)
- `costUSDAtPurchase`: Nuevo costo
- `priceUSDAtPurchase`: Nuevo precio
- `subTotal`: Override manual del subtotal
- `gainUSD`: Override manual de la ganancia

**Ejemplo 1 - Actualización completa con recálculo automático:**
```json
{
  "items": [
    {
      "productVariantId": "6507f1f77bcf86cd799439011",
      "action": "update_all",
      "quantity": 5,
      "costUSDAtPurchase": 12.00,
      "priceUSDAtPurchase": 20.00
    }
  ]
}
```

**Resultado:**
- `quantity`: 5
- `costUSDAtPurchase`: 12.00
- `priceUSDAtPurchase`: 20.00
- `subTotal`: 100.00 (20.00 × 5)
- `gainUSD`: 40.00 ((20.00 - 12.00) × 5)

**Ejemplo 2 - Override manual de valores financieros:**
```json
{
  "items": [
    {
      "productVariantId": "6507f1f77bcf86cd799439011",
      "action": "update_all",
      "quantity": 3,
      "costUSDAtPurchase": 10.00,
      "priceUSDAtPurchase": 18.00,
      "subTotal": 50.00,
      "gainUSD": 20.00
    }
  ]
}
```

**Resultado:**
- `quantity`: 3
- `costUSDAtPurchase`: 10.00
- `priceUSDAtPurchase`: 18.00
- `subTotal`: 50.00 (valor manual, no 54.00)
- `gainUSD`: 20.00 (valor manual, no 24.00)

## Casos de Uso Comunes

### Caso 1: Aplicar Descuento Especial
```json
{
  "items": [
    {
      "productVariantId": "6507f1f77bcf86cd799439011",
      "action": "update_prices",
      "priceUSDAtPurchase": 18.00
    }
  ]
}
```

### Caso 2: Ajustar Costo por Cambio en Proveedor
```json
{
  "items": [
    {
      "productVariantId": "6507f1f77bcf86cd799439011",
      "action": "update_prices",
      "costUSDAtPurchase": 13.50
    }
  ]
}
```

### Caso 3: Promoción con Precio Fijo (sin importar cantidad)
```json
{
  "items": [
    {
      "productVariantId": "6507f1f77bcf86cd799439011",
      "action": "update_all",
      "subTotal": 25.00,
      "gainUSD": 10.00
    }
  ]
}
```

### Caso 4: Ajuste Completo con Nueva Cantidad
```json
{
  "items": [
    {
      "productVariantId": "6507f1f77bcf86cd799439011",
      "action": "update_all",
      "quantity": 4,
      "costUSDAtPurchase": 11.00,
      "priceUSDAtPurchase": 19.50
    }
  ]
}
```

## Gestión de Stock

### Para `update_prices`
- **No afecta el stock**: Solo actualiza precios, la cantidad permanece igual

### Para `update_all` con cambio de cantidad
- **Aumento de cantidad**: Verifica stock disponible antes de aplicar
- **Disminución de cantidad**: Devuelve stock automáticamente
- **Error si stock insuficiente**: La operación falla si no hay stock suficiente

## Validaciones

### Validaciones de Negocio
- El ProductVariant debe existir en la orden
- Para `update_prices`: Al menos `costUSDAtPurchase` o `priceUSDAtPurchase` requerido
- Para `update_all`: Al menos un campo debe estar presente
- Los valores numéricos deben ser >= 0 (excepto `gainUSD` que puede ser negativo)

### Validaciones de Stock
- Cantidad nueva no puede ser 0 o negativa
- Stock suficiente para aumentos de cantidad
- Transacciones atómicas para evitar inconsistencias

## Recálculo de Totales

Después de actualizar cualquier item, la orden recalcula automáticamente:
- `subTotal` de la orden
- `totalGainUSD` de la orden
- `totalAmount` considerando gastos bancarios

## Logging y Trazabilidad

Todas las operaciones quedan registradas con:
- ID de la orden y número de orden
- ProductVariant modificado
- Valores anteriores y nuevos
- Usuario que realizó el cambio
- Timestamp de la operación

## Endpoints de API

### 1. Actualización Completa de Órdenes
```
PATCH /api/orders/:orderId
Content-Type: application/json
Authorization: Bearer <token>

{
  "items": [
    {
      "productVariantId": "6507f1f77bcf86cd799439011",
      "action": "update_all",
      "quantity": 3,
      "costUSDAtPurchase": 12.00,
      "priceUSDAtPurchase": 22.00
    }
  ]
}
```

### 2. Actualización Rápida de Precios (Ruta de Conveniencia)
```
PATCH /api/orders/:orderId/update-prices
Content-Type: application/json
Authorization: Bearer <token>

{
  "items": [
    {
      "productVariantId": "6507f1f77bcf86cd799439011",
      "costUSDAtPurchase": 12.00,
      "priceUSDAtPurchase": 22.00
    }
  ]
}
```

La ruta de conveniencia `/update-prices` simplifica la actualización de precios ya que:
- No requiere especificar el campo `action`
- Automáticamente usa `update_prices` internamente
- Tiene validaciones específicas para casos de actualización de precios
- Permite actualizar hasta 50 items por vez

## Consideraciones de Rendimiento

- Las operaciones son transaccionales (MongoDB sessions)
- Validaciones de stock se realizan antes de aplicar cambios
- Logging asíncrono para no impactar performance
- Recálculos optimizados solo cuando hay cambios reales
