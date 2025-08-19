import { Currency, ExpenseType, IExpense } from '../../interfaces/expense';
import React from 'react';

interface ExpenseCardProps {
  expense: IExpense;
}

const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense }) => {
  const getTypeColor = (type: ExpenseType) => {
    switch (type) {
      case ExpenseType.MANUAL:
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case ExpenseType.STOCK_DAMAGE:
        return 'bg-orange-50 text-orange-700 border border-orange-200';
      case ExpenseType.STOCK_THEFT:
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getTypeLabel = (type: ExpenseType) => {
    switch (type) {
      case ExpenseType.MANUAL:
        return 'Manual';
      case ExpenseType.STOCK_DAMAGE:
        return 'Daño Stock';
      case ExpenseType.STOCK_THEFT:
        return 'Robo Stock';
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number, currency: Currency) => {
    if (currency === Currency.ARS) {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
      }).format(amount);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getTypeColor(expense.type)}`}>
              {getTypeLabel(expense.type)}
            </span>
            {expense.reference && (
              <span className="px-2 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded text-xs">
                {expense.reference}
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {expense.description}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Monto Original</p>
          <p className="text-lg font-semibold text-gray-800">
            {formatCurrency(
              expense.currency === Currency.USD ? expense.amountUSD : expense.amountARS,
              expense.currency
            )}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">
            {expense.currency === Currency.USD ? 'Equivalente ARS' : 'Equivalente USD'}
          </p>
          <p className="text-lg font-medium text-gray-700">
            {expense.currency === Currency.USD 
              ? formatCurrency(expense.amountARS, Currency.ARS)
              : formatCurrency(expense.amountUSD, Currency.USD)
            }
          </p>
        </div>
      </div>

      {expense.exchangeRate && (
        <div className="mb-4">
          <p className="text-sm text-gray-500">Tasa de Cambio</p>
          <p className="text-sm font-medium text-gray-700">
            1 USD = ${expense.exchangeRate.toLocaleString('es-AR')} ARS
          </p>
        </div>
      )}

      {expense.stockMovement && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Movimiento de Stock Relacionado</p>
          <p className="text-sm font-medium text-gray-700">
            {expense.stockMovement.type} - {expense.stockMovement.reason}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center text-sm text-gray-500">
        <div>
          {expense.createdBy && (
            <p>Creado por: {expense.createdBy.email}</p>
          )}
        </div>
        <div>
          <p>{formatDate(expense.createdAt)}</p>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCard;
