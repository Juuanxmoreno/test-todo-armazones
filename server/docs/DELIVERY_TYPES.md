# Tipos de Entrega - Sistema de Órdenes

## Resumen

El sistema de órdenes ahora soporta dos tipos de entrega cuando el método de envío es `PARCEL_COMPANY`:

1. **HOME_DELIVERY** (Entrega a domicilio) - Por defecto
2. **PICKUP_POINT** (Punto de retiro)

## Configuración

### Enum DeliveryType

```typescript
enum DeliveryType {
  HomeDelivery = 'HOME_DELIVERY',
  PickupPoint = 'PICKUP_POINT',
}
```

### Campos en la Dirección

- `deliveryType?: DeliveryType` - Tipo de entrega (opcional, por defecto HOME_DELIVERY)
- `streetAddress?: string` - Dirección del domicilio (requerido solo para HOME_DELIVERY)
- `pickupPointAddress?: string` - Dirección del punto de retiro (requerido solo para PICKUP_POINT)

## Validaciones

### Reglas de Negocio

1. **Para HOME_DELIVERY (o cuando no se especifica deliveryType):**
   - `streetAddress` es **obligatorio**
   - `pickupPointAddress` es **opcional**

2. **Para PICKUP_POINT:**
   - `streetAddress` es **opcional**
   - `pickupPointAddress` es **obligatorio**

### Validaciones en el Backend

#### Mongoose Schema (Address.ts)
```typescript
addressSchema.pre('validate', function(next) {
  if (this.deliveryType === DeliveryType.HomeDelivery && !this.streetAddress) {
    this.invalidate('streetAddress', 'streetAddress es requerido cuando el tipo de entrega es a domicilio');
  }
  
  if (this.deliveryType === DeliveryType.PickupPoint && !this.pickupPointAddress) {
    this.invalidate('pickupPointAddress', 'pickupPointAddress es requerido cuando el tipo de entrega es punto de retiro');
  }
  
  next();
});
```

#### Zod Schema (order.schema.ts)
```typescript
const addressSchema = baseAddressSchema.refine(
  (data) => {
    if (!data.deliveryType || data.deliveryType === DeliveryType.HomeDelivery) {
      return !!data.streetAddress;
    }
    return true;
  },
  {
    message: 'La dirección es obligatoria cuando el tipo de entrega es a domicilio',
    path: ['streetAddress'],
  }
).refine(
  (data) => {
    if (data.deliveryType === DeliveryType.PickupPoint) {
      return !!data.pickupPointAddress;
    }
    return true;
  },
  {
    message: 'La dirección del punto de retiro es obligatoria cuando el tipo de entrega es punto de retiro',
    path: ['pickupPointAddress'],
  }
);
```

## Ejemplos de Uso

### Entrega a Domicilio (por defecto)

```json
{
  "shippingMethod": "PARCEL_COMPANY",
  "shippingAddress": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@email.com",
    "phoneNumber": "123456789",
    "dni": "12345678",
    "streetAddress": "Av. Principal 123, Apt 4B",
    "city": "Buenos Aires",
    "state": "CABA",
    "postalCode": "1000",
    "deliveryType": "HOME_DELIVERY"
  },
  "paymentMethod": "CASH_ON_DELIVERY"
}
```

### Entrega a Punto de Retiro

```json
{
  "shippingMethod": "PARCEL_COMPANY",
  "shippingAddress": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@email.com",
    "phoneNumber": "123456789",
    "dni": "12345678",
    "city": "Buenos Aires",
    "state": "CABA",
    "postalCode": "1000",
    "deliveryType": "PICKUP_POINT",
    "pickupPointAddress": "Sucursal Correo Argentino - Av. Corrientes 500"
  },
  "paymentMethod": "CASH_ON_DELIVERY"
}
```

## Compatibilidad hacia Atrás

- Las órdenes existentes sin `deliveryType` se consideran automáticamente como `HOME_DELIVERY`
- El campo `streetAddress` sigue siendo requerido para órdenes existentes
- Los DTOs de respuesta incluyen ambos campos (`streetAddress` y `pickupPointAddress`) como opcionales

## Notas Técnicas

- Solo aplica cuando `shippingMethod` es `PARCEL_COMPANY`
- Para `shippingMethod` igual a `MOTORCYCLE`, siempre se requiere `streetAddress` (entrega a domicilio)
- Los campos adicionales se manejan de forma retrocompatible en las respuestas API
