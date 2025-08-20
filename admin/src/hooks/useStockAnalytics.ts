import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchStockValuation,
  fetchProductStockAnalytics,
  fetchLowStockAlerts,
  fetchCategoryStockAnalytics,
  clearStockValuation,
  clearProductStockAnalytics,
  clearLowStockAlerts,
  clearCategoryStockAnalytics,
  clearAllStockAnalytics,
} from '@/redux/slices/analyticsSlice';

export const useStockAnalytics = () => {
  const dispatch = useAppDispatch();
  const hasInitializedRef = useRef(false);

  const { stockAnalytics } = useAppSelector((state) => state.analytics);

  // ============================================================================
  // STOCK VALUATION FUNCTIONS
  // ============================================================================

  // Función para cargar valuación total de stock
  const loadStockValuation = useCallback(async () => {
    await dispatch(fetchStockValuation());
  }, [dispatch]);

  // Función para limpiar datos de valuación
  const clearValuationData = useCallback(() => {
    dispatch(clearStockValuation());
  }, [dispatch]);

  // ============================================================================
  // PRODUCT ANALYTICS FUNCTIONS
  // ============================================================================

  // Función para cargar analytics por producto
  const loadProductAnalytics = useCallback(
    async (limit: number = 50, offset: number = 0) => {
      await dispatch(fetchProductStockAnalytics({ limit, offset }));
    },
    [dispatch]
  );

  // Función para refrescar analytics de productos
  const refreshProductAnalytics = useCallback(
    async (limit: number = 50) => {
      await dispatch(fetchProductStockAnalytics({ limit, offset: 0 }));
    },
    [dispatch]
  );

  // Función para limpiar datos de productos
  const clearProductData = useCallback(() => {
    dispatch(clearProductStockAnalytics());
  }, [dispatch]);

  // ============================================================================
  // LOW STOCK ALERTS FUNCTIONS
  // ============================================================================

  // Función para cargar alertas de stock bajo
  const loadLowStockAlerts = useCallback(
    async (threshold: number = 10, limit: number = 20) => {
      await dispatch(fetchLowStockAlerts({ threshold, limit }));
    },
    [dispatch]
  );

  // Función para refrescar alertas de stock bajo
  const refreshLowStockAlerts = useCallback(
    async (threshold: number = 10, limit: number = 20) => {
      await dispatch(fetchLowStockAlerts({ threshold, limit }));
    },
    [dispatch]
  );

  // Función para limpiar datos de alertas
  const clearAlertsData = useCallback(() => {
    dispatch(clearLowStockAlerts());
  }, [dispatch]);

  // ============================================================================
  // CATEGORY ANALYTICS FUNCTIONS
  // ============================================================================

  // Función para cargar analytics por categoría
  const loadCategoryAnalytics = useCallback(async () => {
    await dispatch(fetchCategoryStockAnalytics());
  }, [dispatch]);

  // Función para refrescar analytics de categorías
  const refreshCategoryAnalytics = useCallback(async () => {
    await dispatch(fetchCategoryStockAnalytics());
  }, [dispatch]);

  // Función para limpiar datos de categorías
  const clearCategoryData = useCallback(() => {
    dispatch(clearCategoryStockAnalytics());
  }, [dispatch]);

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  // Función para cargar todos los datos de stock
  const loadAllStockData = useCallback(
    async (options?: {
      productLimit?: number;
      productOffset?: number;
      alertThreshold?: number;
      alertLimit?: number;
    }) => {
      const {
        productLimit = 50,
        productOffset = 0,
        alertThreshold = 10,
        alertLimit = 20,
      } = options || {};

      await Promise.all([
        dispatch(fetchStockValuation()),
        dispatch(fetchProductStockAnalytics({ limit: productLimit, offset: productOffset })),
        dispatch(fetchLowStockAlerts({ threshold: alertThreshold, limit: alertLimit })),
        dispatch(fetchCategoryStockAnalytics()),
      ]);
    },
    [dispatch]
  );

  // Función para refrescar todos los datos
  const refreshAllStockData = useCallback(
    async (options?: {
      productLimit?: number;
      alertThreshold?: number;
      alertLimit?: number;
    }) => {
      const {
        productLimit = 50,
        alertThreshold = 10,
        alertLimit = 20,
      } = options || {};

      await Promise.all([
        dispatch(fetchStockValuation()),
        dispatch(fetchProductStockAnalytics({ limit: productLimit, offset: 0 })),
        dispatch(fetchLowStockAlerts({ threshold: alertThreshold, limit: alertLimit })),
        dispatch(fetchCategoryStockAnalytics()),
      ]);
    },
    [dispatch]
  );

  // Función para limpiar todos los datos de stock
  const clearAllStockData = useCallback(() => {
    dispatch(clearAllStockAnalytics());
  }, [dispatch]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // Datos de valuación
  const stockValuation = stockAnalytics.valuation;
  const productAnalytics = useMemo(() => stockAnalytics.productAnalytics || [], [stockAnalytics.productAnalytics]);
  const lowStockAlerts = stockAnalytics.lowStockAlerts || [];
  const categoryAnalytics = stockAnalytics.categoryAnalytics || [];

  // Estados de carga
  const isLoadingValuation = stockAnalytics.loading.valuation;
  const isLoadingProductAnalytics = stockAnalytics.loading.productAnalytics;
  const isLoadingLowStockAlerts = stockAnalytics.loading.lowStockAlerts;
  const isLoadingCategoryAnalytics = stockAnalytics.loading.categoryAnalytics;

  // Estados de error
  const valuationError = stockAnalytics.error.valuation;
  const productAnalyticsError = stockAnalytics.error.productAnalytics;
  const lowStockAlertsError = stockAnalytics.error.lowStockAlerts;
  const categoryAnalyticsError = stockAnalytics.error.categoryAnalytics;

  // Estado general de carga
  const isLoadingAny = isLoadingValuation || isLoadingProductAnalytics || isLoadingLowStockAlerts || isLoadingCategoryAnalytics;

  // Verificar si hay algún error
  const hasAnyError = Boolean(valuationError || productAnalyticsError || lowStockAlertsError || categoryAnalyticsError);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  // Formatear moneda USD
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, []);

  // Formatear porcentaje
  const formatPercentage = useCallback((value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }, []);

  // Formatear número
  const formatNumber = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  }, []);

  // Obtener color del badge de stock
  const getStockBadgeColor = useCallback((stock: number) => {
    if (stock === 0) return 'bg-red-100 text-red-800';
    if (stock <= 5) return 'bg-red-100 text-red-800';
    if (stock <= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }, []);

  // Obtener estado del stock
  const getStockStatus = useCallback((stock: number) => {
    if (stock === 0) return { status: 'Sin stock', severity: 'critical' };
    if (stock <= 5) return { status: 'Stock crítico', severity: 'critical' };
    if (stock <= 10) return { status: 'Stock bajo', severity: 'warning' };
    return { status: 'Stock normal', severity: 'normal' };
  }, []);

  // Formatear fecha
  const formatDate = useCallback((dateString: string) => {
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  }, []);

  // Calcular totales agregados
  const calculateTotals = useCallback(() => {
    if (!productAnalytics.length) {
      return {
        totalProducts: 0,
        totalVariants: 0,
        totalStock: 0,
        totalValuationAtCost: 0,
        totalValuationAtRetail: 0,
      };
    }

    return productAnalytics.reduce(
      (acc, product) => ({
        totalProducts: acc.totalProducts + 1,
        totalVariants: acc.totalVariants + product.variants.length,
        totalStock: acc.totalStock + product.totalStock,
        totalValuationAtCost: acc.totalValuationAtCost + product.totalValuationAtCost,
        totalValuationAtRetail: acc.totalValuationAtRetail + product.totalValuationAtRetail,
      }),
      {
        totalProducts: 0,
        totalVariants: 0,
        totalStock: 0,
        totalValuationAtCost: 0,
        totalValuationAtRetail: 0,
      }
    );
  }, [productAnalytics]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Cargar datos iniciales solo una vez
  useEffect(() => {
    if (!hasInitializedRef.current && !isLoadingAny && !stockValuation) {
      hasInitializedRef.current = true;
      loadAllStockData();
    }
  }, [loadAllStockData, stockValuation, isLoadingAny]);

  return {
    // Datos
    stockValuation,
    productAnalytics,
    lowStockAlerts,
    categoryAnalytics,

    // Estados de carga
    isLoadingValuation,
    isLoadingProductAnalytics,
    isLoadingLowStockAlerts,
    isLoadingCategoryAnalytics,
    isLoadingAny,

    // Estados de error
    valuationError,
    productAnalyticsError,
    lowStockAlertsError,
    categoryAnalyticsError,
    hasAnyError,

    // Funciones individuales
    loadStockValuation,
    loadProductAnalytics,
    loadLowStockAlerts,
    loadCategoryAnalytics,

    // Funciones de refresh
    refreshProductAnalytics,
    refreshLowStockAlerts,
    refreshCategoryAnalytics,

    // Funciones de limpieza
    clearValuationData,
    clearProductData,
    clearAlertsData,
    clearCategoryData,

    // Funciones bulk
    loadAllStockData,
    refreshAllStockData,
    clearAllStockData,

    // Helpers
    formatCurrency,
    formatPercentage,
    formatNumber,
    getStockBadgeColor,
    getStockStatus,
    formatDate,
    calculateTotals,
  };
};
