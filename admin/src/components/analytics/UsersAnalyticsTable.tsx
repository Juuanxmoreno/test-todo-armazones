import React from 'react';
import Link from 'next/link';
import { 
  User, 
  Eye, 
  Calendar,
  Clock,
  Loader2,
  Users as UsersIcon,
} from 'lucide-react';
import { IndividualUserAnalyticsDto, PaginationInfoDto } from '@/interfaces/analytics';

interface UsersAnalyticsTableProps {
  users: IndividualUserAnalyticsDto[];
  pagination?: PaginationInfoDto;
  isLoading?: boolean;
  onLoadMore?: () => void;
  onLoadPrevious?: () => void;
  formatCurrency: (value: number) => string;
  formatNumber: (value: number) => string;
  formatDate: (date: string) => string;
}

const UsersAnalyticsTable: React.FC<UsersAnalyticsTableProps> = ({
  users,
  pagination,
  isLoading,
  onLoadMore,
  onLoadPrevious,
  formatCurrency,
  formatNumber,
  formatDate,
}) => {
  if (isLoading && users.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios disponibles</h3>
          <p className="text-gray-500">
            No se encontraron usuarios con analytics en el sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Analytics de Usuarios</h2>
            <p className="text-sm text-gray-600">
              Lista de usuarios con sus métricas de performance
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Total: {users.length} usuarios
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revenue Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Órdenes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Promedio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fechas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((userAnalytics) => {
              const { user, analytics } = userAnalytics;
              
              return (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  {/* Usuario */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-purple-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.displayName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                        {(user.firstName || user.lastName) && (
                          <div className="text-xs text-gray-400">
                            {user.firstName} {user.lastName}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Revenue Total */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(analytics.totalRevenue)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Revenue generado
                    </div>
                  </td>

                  {/* Total Órdenes */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatNumber(analytics.totalOrders)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Órdenes completadas
                    </div>
                  </td>

                  {/* Valor Promedio */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(analytics.averageOrderValue)}
                    </div>
                    <div className="text-xs text-gray-500">
                      AOV por orden
                    </div>
                  </td>

                  {/* Fechas */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs">
                          Registro: {formatDate(user.createdAt)}
                        </span>
                      </div>
                      {user.lastLogin && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">
                            Último: {formatDate(user.lastLogin)}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/analytics/users/${user.id}`}
                      className="inline-flex items-center space-x-1 text-purple-600 hover:text-purple-900 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver detalles</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (pagination.hasNextPage || pagination.hasPreviousPage) && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {pagination.hasPreviousPage && (
                <span>Página anterior disponible</span>
              )}
            </div>
            
            <div className="flex space-x-2">
              {pagination.hasPreviousPage && onLoadPrevious && (
                <button
                  onClick={onLoadPrevious}
                  disabled={isLoading}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>
              )}
              
              {pagination.hasNextPage && onLoadMore && (
                <button
                  onClick={onLoadMore}
                  disabled={isLoading}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      Cargando...
                    </>
                  ) : (
                    'Siguiente →'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAnalyticsTable;
