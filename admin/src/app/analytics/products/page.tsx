"use client";

import React from "react";
import { Package, ArrowLeft, Settings, BarChart3, ShoppingCart, Users } from "lucide-react";
import Link from "next/link";
import { AnalyticsTabNavigation } from "@/components/analytics";

const ProductsAnalyticsPage = () => {
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
      id: "products",
      label: "Productos",
      icon: <Package className="h-4 w-4" />,
      href: "/analytics/products",
    },
  ];
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link
              href="/analytics"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <Package className="h-8 w-8 text-orange-600" />
                <span>Analytics de Productos</span>
              </h1>
              <p className="text-gray-600 mt-1">
                Próximamente - Analiza el performance de productos y inventario
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8">
          <AnalyticsTabNavigation tabs={tabs} />
        </div>

        {/* Coming Soon Content */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="mb-6">
              <div className="p-4 bg-orange-100 rounded-full inline-block mb-4">
                <BarChart3 className="h-16 w-16 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Próximamente
              </h2>
              <p className="text-gray-600 text-lg mb-6">
                Estamos trabajando en traerte analytics detalladas de productos. 
                Esta funcionalidad estará disponible en una futura actualización.
              </p>
            </div>

            {/* Features Preview */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Funcionalidades que incluirá:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Performance por producto</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Productos más vendidos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Análisis de inventario</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Tendencias de ventas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>ROI por producto</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span>Comparaciones temporales</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <Link
                href="/analytics"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver a Analytics</span>
              </Link>
              
              <div className="text-sm text-gray-500">
                <p>
                  Mientras tanto, puedes revisar las{" "}
                  <Link href="/analytics/orders" className="text-blue-600 hover:text-blue-700">
                    analytics de órdenes
                  </Link>{" "}
                  o{" "}
                  <Link href="/analytics/users" className="text-purple-600 hover:text-purple-700">
                    analytics de usuarios
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsAnalyticsPage;
