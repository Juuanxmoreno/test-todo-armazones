import { IDollar } from '@interfaces/dollar';
import { Schema, model, Document } from 'mongoose';

export interface IDollarDocument extends IDollar, Document {}

const dollarSchema = new Schema<IDollarDocument>(
  {
    value: { type: Number, required: true, default: 0 },
    addedValue: { type: Number, min: 0, required: true },
    isPercentage: { type: Boolean, required: true },
    latestAPIUpdate: { type: Date },
  },
  {
    timestamps: true,
  },
);

dollarSchema.index({}, { unique: true }); // Solo se permite un registro

const Dollar = model<IDollarDocument>('Dollar', dollarSchema);

export default Dollar;
