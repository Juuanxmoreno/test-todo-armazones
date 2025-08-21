# Guía de Uso - Edición de Precios en Frontend (Admin)

Esta guía explica cómo usar la nueva funcionalidad de edición de precios en el panel de administración.

## Nuevas Funcionalidades Implementadas

### 1. **Modal de Edición de Precios**
- Accesible desde el botón azul (icono de edición) en cada item de la orden
- Permite editar precios y valores financieros sin afectar stock
- Dos modos de edición: "Solo Precios" y "Manual Completo"

### 2. **Modo: Solo Precios (Auto-cálculo)**
- Edita únicamente `costUSDAtPurchase` y `priceUSDAtPurchase`
- El backend recalcula automáticamente `subTotal` y `gainUSD`
- Ideal para ajustes de precios simples

### 3. **Modo: Manual Completo**
- Control total sobre todos los campos financieros
- Permite override manual de `subTotal` y `gainUSD`
- También permite cambiar cantidad (con manejo de stock)
- Útil para casos especiales y promociones

## Cómo Usar

### Paso 1: Acceder al Modal
1. Ve a la página de edición de una orden (`/orders/edit/[id]`)
2. En la tabla de items, busca la columna "Acciones"
3. Haz clic en el botón azul con icono de edición (📝)

### Paso 2: Seleccionar Modo de Edición
**Solo Precios:**
- Selecciona "Solo Precios (Auto-cálculo)"
- Edita costo y/o precio
- Los valores se actualizan automáticamente en tiempo real

**Manual Completo:**
- Selecciona "Manual Completo"
- Edita cualquier campo que necesites
- Ten control total sobre los valores

### Paso 3: Vista Previa y Guardado
- Revisa la vista previa antes de guardar
- Usa "Resetear" para volver a los valores originales
- Haz clic en "Guardar" para aplicar los cambios

## Ejemplos de Uso

### Ejemplo 1: Aplicar Descuento del 10%
1. Abrir modal de edición
2. Seleccionar "Solo Precios"
3. Cambiar precio de $25.00 a $22.50
4. Guardar (subTotal y gainUSD se recalculan automáticamente)

### Ejemplo 2: Promoción con Precio Fijo
1. Abrir modal de edición
2. Seleccionar "Manual Completo"
3. Establecer `subTotal` fijo en $30.00 independientemente de la cantidad
4. Guardar

### Ejemplo 3: Ajustar Costos por Nuevo Proveedor
1. Abrir modal de edición
2. Seleccionar "Solo Precios"
3. Cambiar `costUSDAtPurchase` de $12.00 a $13.50
4. Guardar (ganancias se recalculan automáticamente)

## Características Técnicas

### **Estado y Persistencia**
- Los cambios se guardan inmediatamente en el backend
- El estado local se actualiza con la respuesta del servidor
- Manejo de errores con mensajes informativos

### **Validaciones**
- Precios deben ser ≥ 0
- Cantidades deben ser ≥ 1
- Al menos un campo debe ser modificado
- Validaciones tanto en frontend como backend

### **UX/UI**
- Modal responsive con scroll para pantallas pequeñas
- Loading states durante guardado
- Vista previa en tiempo real de los cambios
- Cálculo automático de margen de ganancia

### **Consistencia de Datos**
- Transacciones atómicas en el backend
- Estado consistente entre tabla principal y modal
- Recálculo automático de totales de la orden

## Flujo de Datos

1. **Usuario abre modal** → Se carga con valores actuales del item
2. **Usuario modifica campos** → Vista previa se actualiza en tiempo real
3. **Usuario guarda** → Request al backend con nueva acción
4. **Backend procesa** → Valida, actualiza BD y recalcula totales
5. **Frontend actualiza** → Estado local se sincroniza con respuesta

## Endpoints Utilizados

### Actualización Completa
```
PATCH /api/orders/:orderId
{
  "items": [{
    "productVariantId": "...",
    "action": "update_prices" | "update_all",
    "costUSDAtPurchase": 15.50,
    "priceUSDAtPurchase": 25.00,
    // ... otros campos según acción
  }]
}
```

### Actualización Rápida de Precios
```
PATCH /api/orders/:orderId/update-prices
{
  "items": [{
    "productVariantId": "...",
    "costUSDAtPurchase": 15.50,
    "priceUSDAtPurchase": 25.00
  }]
}
```

## Beneficios

1. **Flexibilidad Total**: Control granular sobre precios y valores financieros
2. **Fácil de Usar**: Interface intuitiva con dos modos claramente diferenciados
3. **Consistencia**: Datos siempre sincronizados entre frontend y backend
4. **Performance**: Operaciones optimizadas con manejo de estado eficiente
5. **Confiabilidad**: Validaciones robustas y manejo de errores

La nueva funcionalidad está completamente integrada y lista para usar en producción.
