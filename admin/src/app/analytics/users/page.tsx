"use client";

import React from "react";
import {
  ShoppingCart,
  Package,
  Users,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  AnalyticsTabNavigation,
  UsersAnalyticsTable,
} from "@/components/analytics";
import { useUsersAnalytics } from "@/hooks/useUsersAnalytics";

const UsersAnalyticsPage = () => {
  const {
    // Lista de usuarios
    usersList,
    usersListPagination,
    isLoadingUsersList,
    usersAnalyticsListError,
    loadUsersAnalyticsList,
    refreshUsersAnalyticsList,
    clearUsersListError,

    // Helpers
    formatCurrency,
    formatNumber,
    formatDate,
  } = useUsersAnalytics();

  const tabs = [
    {
      id: "orders",
      label: "Órdenes",
      icon: <ShoppingCart className="h-4 w-4" />,
      href: "/analytics/orders",
    },
    {
      id: "users",
      label: "Usuarios",
      icon: <Users className="h-4 w-4" />,
      href: "/analytics/users",
    },
    {
      id: "stock",
      label: "Stock",
      icon: <Package className="h-4 w-4" />,
      href: "/analytics/stock",
      description: "Analytics de inventario y valuación de stock",
    },
  ];

  const handleRefresh = async () => {
    await refreshUsersAnalyticsList();
  };

  const handleLoadMore = async () => {
    if (usersListPagination?.hasNextPage && usersListPagination.endCursor) {
      await loadUsersAnalyticsList(
        20,
        usersListPagination.endCursor,
        "forward"
      );
    }
  };

  const handleLoadPrevious = async () => {
    if (
      usersListPagination?.hasPreviousPage &&
      usersListPagination.startCursor
    ) {
      await loadUsersAnalyticsList(
        20,
        usersListPagination.startCursor,
        "backward"
      );
    }
  };

  if (usersAnalyticsListError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Error al cargar datos
            </h3>
            <p className="text-red-700 mb-4">{usersAnalyticsListError}</p>
            <button
              onClick={clearUsersListError}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Analytics de Usuarios
              </h1>
              <p className="text-gray-600 mt-2">
                Analiza el comportamiento y performance individual de cada
                usuario
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isLoadingUsersList}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isLoadingUsersList ? "animate-spin" : ""
                }`}
              />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8">
          <AnalyticsTabNavigation tabs={tabs} />
        </div>

        <div className="space-y-6">
          {/* Tabla de usuarios */}
          <UsersAnalyticsTable
            users={usersList}
            pagination={usersListPagination}
            isLoading={isLoadingUsersList}
            onLoadMore={handleLoadMore}
            onLoadPrevious={handleLoadPrevious}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
            formatDate={formatDate}
          />
        </div>
      </div>
    </div>
  );
};

export default UsersAnalyticsPage;
