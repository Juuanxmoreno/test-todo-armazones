# Sistema de Actualización Masiva de Precios - Frontend

## Descripción General

El sistema de actualización masiva de precios permite a los administradores actualizar los precios de múltiples variantes de productos de forma eficiente, filtrado por categorías y subcategorías.

## Estructura de Archivos

```
admin/src/
├── interfaces/product.ts           # Tipos TypeScript para bulk updates
├── redux/slices/productSlice.ts   # Estado y acciones Redux
├── hooks/useProducts.ts           # Hook personalizado
├── app/products/
│   ├── page.tsx                   # Lista principal con botón de acceso
│   └── bulk-price-update/
│       ├── page.tsx               # Página principal de actualización
│       └── presets/
│           └── page.tsx           # Casos de uso predefinidos
└── components/
    └── BulkUpdateResultModal.tsx  # Modal de resultados (opcional)
```

## Funcionalidades Implementadas

### 1. **Página Principal de Actualización** (`/products/bulk-price-update`)
- Formulario completo para configurar actualizaciones
- Vista previa en tiempo real de la configuración
- Tres tipos de actualización: cantidad fija, porcentaje, precio fijo
- Límites de precio mínimo y máximo
- Resultados detallados con estadísticas

### 2. **Casos de Uso Predefinidos** (`/products/bulk-price-update/presets`)
- 6 casos de uso comunes preconfigurados
- Ejecución con un solo clic
- Confirmación antes de ejecutar
- Interfaz visual intuitiva

### 3. **Integración con Redux**
- Estado centralizado para bulk updates
- Manejo de loading y errores
- Acciones asíncronas con `createAsyncThunk`

## Tipos de Actualización

### 1. **FIXED_AMOUNT** - Cantidad Fija
```typescript
{
  updateType: PriceUpdateType.FIXED_AMOUNT,
  value: 2.50  // +$2.50 USD (positivo aumenta, negativo disminuye)
}
```

### 2. **PERCENTAGE** - Porcentaje
```typescript
{
  updateType: PriceUpdateType.PERCENTAGE,
  value: 5     // +5% (positivo aumenta, negativo disminuye)
}
```

### 3. **SET_PRICE** - Precio Fijo
```typescript
{
  updateType: PriceUpdateType.SET_PRICE,
  value: 50    // $50 USD fijo para todas las variantes
}
```

## Filtros Disponibles

### Por Categorías (Requerido)
```typescript
categoryIds: [
  "687817781dd5819a2483c7eb", // Hombres
  "6878179f1dd5819a2483c7ed", // Mujeres
  "687817d71dd5819a2483c7ef"  // Niños
]
```

### Por Subcategorías (Opcional)
```typescript
subcategoryIds: [
  "687819d2cdda2752c527177b", // Anteojos de sol
  "6878196acdda2752c5271779", // Armazón de receta
  "68781a06cdda2752c527177d"  // Clip on
]
```

## Casos de Uso Predefinidos

### 1. **Aumento Estacional +5%**
- Todas las categorías
- Aumento del 5%
- Sin límites

### 2. **Anteojos de Sol +$3 USD**
- Hombres y Mujeres
- Solo Anteojos de sol
- Aumento de $3 USD

### 3. **Descuento Armazones Hombres -10%**
- Solo Hombres
- Solo Armazón de receta
- Descuento del 10%
- Precio mínimo: $15

### 4. **Precio Estándar Niños $25**
- Solo Niños
- Precio fijo: $25 USD

### 5. **Ajuste Premium +$8 USD**
- Hombres y Mujeres
- Aumento de $8 USD
- Precio mínimo: $30, máximo: $150

### 6. **Impulso Clip On +15%**
- Hombres y Mujeres
- Solo Clip on
- Aumento del 15%

## Flujo de Usuario

### Opción 1: Actualización Personalizada
1. Ir a `/products`
2. Hacer clic en "Precios Masivos"
3. Seleccionar categorías (requerido)
4. Seleccionar subcategorías (opcional)
5. Elegir tipo de actualización
6. Ingresar valor y límites
7. Revisar vista previa
8. Ejecutar actualización
9. Ver resultados detallados

### Opción 2: Casos de Uso Predefinidos
1. Ir a `/products/bulk-price-update`
2. Hacer clic en "Ver Casos de Uso Predefinidos"
3. Seleccionar caso de uso deseado
4. Confirmar ejecución
5. Ver resultados

## Manejo de Estados

### Estados de Carga
```typescript
const { bulkUpdateLoading, bulkUpdateError } = useProducts();

// Mostrar loading
{bulkUpdateLoading && <LoadingSpinner />}

// Mostrar error
{bulkUpdateError && <ErrorMessage error={bulkUpdateError} />}
```

### Respuesta del Servidor
```typescript
interface BulkPriceUpdateResponse {
  totalVariantsFound: number;      // Total encontradas
  totalVariantsUpdated: number;    // Total actualizadas
  totalVariantsSkipped: number;    // Total omitidas por límites
  updatedVariants: Array<...>;     // Detalles de actualizadas
  skippedVariants: Array<...>;     // Detalles de omitidas
  summary: {
    averagePriceIncrease: number;  // Incremento promedio
    totalValueIncrease: number;    // Incremento total
  };
}
```

## Validaciones del Frontend

### Validaciones de Formulario
- Al menos una categoría debe estar seleccionada
- El valor debe ser un número válido
- Para porcentajes, no permitir descuentos mayores al 100%
- Para precios fijos, no permitir valores negativos
- El precio mínimo no puede ser mayor al máximo

### Confirmaciones
- Advertencia antes de ejecutar operaciones masivas
- Mensaje claro sobre la irreversibilidad de la acción
- Resumen de la configuración antes de confirmar

## Accesibilidad y UX

### Diseño Responsivo
- Funciona en desktop, tablet y móvil
- Grid adaptativo para diferentes pantallas
- Formularios optimizados para touch

### Feedback Visual
- Estados de loading con spinners
- Mensajes de error claros y útiles
- Resultados con códigos de color (verde: éxito, amarillo: advertencia, rojo: error)
- Iconos intuitivos para cada tipo de actualización

### Navegación
- Breadcrumbs y botones de "volver"
- Enlaces directos entre funcionalidades relacionadas
- Shortcuts para casos de uso comunes

## Consideraciones de Seguridad

### Permisos
- Solo usuarios administradores pueden acceder
- Validación en el backend antes de ejecutar

### Confirmaciones
- Doble confirmación para operaciones irreversibles
- Vista previa antes de ejecutar
- Registro de todas las operaciones en logs

## Extensibilidad

### Agregar Nuevos Casos de Uso
1. Definir payload en `presets/page.tsx`
2. Agregar al array `useCases`
3. Configurar título, descripción e icono
4. Listo para usar

### Agregar Nuevos Filtros
1. Extender interfaces en `product.ts`
2. Actualizar formulario en `bulk-price-update/page.tsx`
3. Implementar lógica en el backend
4. Actualizar validaciones

## Testing

### Tests Unitarios Recomendados
- Validación de formularios
- Cálculos de vista previa
- Manejo de estados de error
- Transformación de datos

### Tests de Integración
- Flujo completo de actualización
- Navegación entre páginas
- Persistencia de estado

### Tests E2E
- Casos de uso completos desde login hasta resultados
- Diferentes tipos de actualización
- Manejo de errores del servidor
