# Actualización Masiva de Precios - API Documentation

## Endpoint
`PATCH /api/products/bulk-update-prices`

## Descripción
Permite actualizar los precios de las variantes de productos de forma masiva filtrado por categorías y/o subcategorías.

## Autenticación
Requiere permisos de administrador.

## Tipos de Actualización

### 1. FIXED_AMOUNT
Aumenta o disminuye una cantidad fija en USD.
- Valor positivo: Aumenta el precio
- Valor negativo: Disminuye el precio

### 2. PERCENTAGE
Aumenta o disminuye por porcentaje.
- Valor positivo: Aumenta el precio (ej: 5 = +5%)
- Valor negativo: Disminuye el precio (ej: -10 = -10%)

### 3. SET_PRICE
Establece un precio fijo para todas las variantes.

## Parámetros de Request

```typescript
{
  categoryIds: string[],        // IDs de categorías (requerido, mínimo 1)
  subcategoryIds?: string[],    // IDs de subcategorías (opcional)
  updateType: "FIXED_AMOUNT" | "PERCENTAGE" | "SET_PRICE",
  value: number,                // Valor del cambio
  minPrice?: number,            // Precio mínimo permitido (opcional)
  maxPrice?: number             // Precio máximo permitido (opcional)
}
```

## Respuesta

```typescript
{
  status: "success",
  message: string,
  data: {
    totalVariantsFound: number,
    totalVariantsUpdated: number,
    totalVariantsSkipped: number,
    updatedVariants: [
      {
        id: string,
        productId: string,
        productModel: string,
        sku: string,
        color: { name: string, hex: string },
        oldPrice: number,
        newPrice: number,
        priceChange: number,
        priceChangePercentage: number
      }
    ],
    skippedVariants: [...],  // Variantes omitidas por límites de precio
    summary: {
      averagePriceIncrease: number,
      totalValueIncrease: number
    }
  }
}
```

## Ejemplos de Uso

### 1. Aumentar $2 USD a todos los productos de categoría "Hombres"
```json
{
  "categoryIds": ["64f123456789abcdef000001"],
  "updateType": "FIXED_AMOUNT",
  "value": 2
}
```

### 2. Aumentar 5% a productos de categoría "Hombres" y subcategoría "Armazón de receta"
```json
{
  "categoryIds": ["64f123456789abcdef000001"],
  "subcategoryIds": ["64f123456789abcdef000002"],
  "updateType": "PERCENTAGE",
  "value": 5
}
```

### 3. Disminuir 10% con precio mínimo de $15
```json
{
  "categoryIds": ["64f123456789abcdef000001"],
  "updateType": "PERCENTAGE",
  "value": -10,
  "minPrice": 15
}
```

### 4. Establecer precio fijo de $50 para todos los productos
```json
{
  "categoryIds": ["64f123456789abcdef000001", "64f123456789abcdef000002"],
  "updateType": "SET_PRICE",
  "value": 50
}
```

### 5. Aumentar $5 con límites de precio
```json
{
  "categoryIds": ["64f123456789abcdef000001"],
  "updateType": "FIXED_AMOUNT",
  "value": 5,
  "minPrice": 10,
  "maxPrice": 100
}
```

## Validaciones

- Al menos una categoría es requerida
- Para PERCENTAGE: el valor no puede ser <= -100%
- Para SET_PRICE: el valor no puede ser negativo
- minPrice y maxPrice no pueden ser negativos
- minPrice no puede ser mayor a maxPrice
- Las variantes que excedan los límites de precio serán omitidas

## Casos de Error

### 400 Bad Request
- Parámetros de entrada inválidos
- Validaciones de precio fallidas

### 404 Not Found
- No se encontraron productos con los criterios especificados
- No se encontraron variantes para actualizar

### 500 Internal Server Error
- Error interno del servidor

## Logs
La operación registra información detallada en los logs para auditoría:
- Parámetros de la operación
- Cantidad de variantes encontradas/actualizadas
- Errores durante la actualización
