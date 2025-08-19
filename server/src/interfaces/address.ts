import { Types } from 'mongoose';

export interface IAddress {
  userId: Types.ObjectId;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  phoneNumber: string;
  dni: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  shippingCompany?: string;
  declaredShippingAmount?: string;
  deliveryWindow?: string;
}
