import { ExpenseType, Currency } from '@interfaces/expense';

export interface CreateExpenseRequestDto {
  description: string;
  amount: number;
  currency: Currency;
  reference?: string;
}

export interface ExpenseResponseDto {
  id: string;
  type: ExpenseType;
  description: string;
  amountARS: number;
  amountUSD: number;
  currency: Currency;
  exchangeRate?: number;
  reference?: string;
  stockMovement?: {
    id: string;
    type: string;
    reason: string;
  };
  createdBy?: {
    id: string;
    displayName: string;
    email: string;
  };
  createdAt: Date;
}

export interface ExpenseListResponseDto {
  expenses: ExpenseResponseDto[];
  totalExpenses: number;
  totalAmountARS: number;
  totalAmountUSD: number;
}

export interface MonthlyExpenseFilters {
  year: number;
  month: number; // 1-12
  type?: ExpenseType;
  currency?: Currency;
}

// Respuesta de la API de Blue Dollar
export interface BluelyticsApiResponse {
  oficial: {
    value_avg: number;
    value_sell: number;
    value_buy: number;
  };
  blue: {
    value_avg: number;
    value_sell: number;
    value_buy: number;
  };
  oficial_euro: {
    value_avg: number;
    value_sell: number;
    value_buy: number;
  };
  blue_euro: {
    value_avg: number;
    value_sell: number;
    value_buy: number;
  };
  last_update: string;
}
