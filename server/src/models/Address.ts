import { IAddress } from '@interfaces/address';
import { Schema, model, Document, Types } from 'mongoose';

// Interfaz que extiende Document para incluir las propiedades de IAddress
export interface IAddressDocument extends IAddress, Document {
  _id: Types.ObjectId; // Asegúrate de que el ID sea de tipo ObjectId
}

// Definición del esquema de Mongoose correspondiente a IAddress
const addressSchema = new Schema<IAddressDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    companyName: { type: String, required: false },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    dni: { type: String, required: true },
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    shippingCompany: { type: String, required: false },
    declaredShippingAmount: { type: String, required: false },
    deliveryWindow: { type: String, required: false },
  },
  {
    timestamps: true, // Agrega campos createdAt y updatedAt automáticamente
  },
);

// Creación del modelo de Mongoose
const Address = model<IAddressDocument>('Address', addressSchema);

export default Address;
