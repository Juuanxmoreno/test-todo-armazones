import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import {
  OrderAnalyticsResponseDto,
  OrderAnalyticsQueryDto,
  UserAnalyticsResponseDto,
  UsersAnalyticsListResponseDto,
  UserDetailedAnalyticsResponseDto,
  AnalyticsFilters,
  StockAnalyticsMetricsDto,
  ProductStockAnalyticsDto,
  LowStockAlertDto,
  CategoryStockAnalyticsDto,
  StockValuationResponseDto,
  ProductStockAnalyticsResponseDto,
  LowStockAlertsResponseDto,
  CategoryStockAnalyticsResponseDto,
} from "@/interfaces/analytics";

import { ApiResponse, getErrorMessage } from "@/types/api";
import { AnalyticsGranularity, AnalyticsPeriod, AnalyticsTimeZone } from "@/enums/analytics.enum";

// Thunk para obtener analytics de órdenes
export const fetchOrderAnalytics = createAsyncThunk<
  OrderAnalyticsResponseDto,
  OrderAnalyticsQueryDto,
  { rejectValue: string }
>("analytics/fetchOrderAnalytics", async (params, { rejectWithValue }) => {
  try {
    // Construir query params
    const queryParams = new URLSearchParams();
    queryParams.append("period", params.period);

    if (params.granularity) {
      queryParams.append("granularity", params.granularity);
    }

    if (params.timezone) {
      queryParams.append("timezone", params.timezone);
    }

    if (params.customRange) {
      queryParams.append("startDate", params.customRange.startDate);
      queryParams.append("endDate", params.customRange.endDate);
    }

    if (params.compareWithPrevious !== undefined) {
      queryParams.append(
        "compareWithPrevious",
        params.compareWithPrevious.toString()
      );
    }

    const response = await axiosInstance.get<
      ApiResponse<OrderAnalyticsResponseDto>
    >(`/analytics/orders?${queryParams.toString()}`);

    if (response.data.status === "success" && response.data.data) {
      return response.data.data;
    } else {
      return rejectWithValue(
        response.data.message || "Error al obtener analytics"
      );
    }
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// Thunk para obtener lista de usuarios con analytics
export const fetchUsersAnalyticsList = createAsyncThunk<
  UsersAnalyticsListResponseDto,
  { limit?: number; cursor?: string; direction?: 'forward' | 'backward' },
  { rejectValue: string }
>("analytics/fetchUsersAnalyticsList", async (params, { rejectWithValue }) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.limit) {
      queryParams.append("limit", params.limit.toString());
    }

    if (params.cursor) {
      queryParams.append("cursor", params.cursor);
    }

    if (params.direction) {
      queryParams.append("direction", params.direction);
    }

    const response = await axiosInstance.get<
      ApiResponse<UsersAnalyticsListResponseDto>
    >(`/analytics/users-list?${queryParams.toString()}`);

    if (response.data.status === "success" && response.data.data) {
      return response.data.data;
    } else {
      return rejectWithValue(
        response.data.message || "Error al obtener lista de usuarios con analytics"
      );
    }
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// Thunk para obtener valuación total de stock
export const fetchStockValuation = createAsyncThunk<
  StockAnalyticsMetricsDto,
  void,
  { rejectValue: string }
>("analytics/fetchStockValuation", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get<StockValuationResponseDto>(
      "/analytics/stock/valuation"
    );

    if (response.data.status === "success" && response.data.data) {
      // Extraer solo las métricas, sin la metadata
      const { ...metrics } = response.data.data;
      return metrics;
    } else {
      return rejectWithValue(
        "Error al obtener valuación de stock"
      );
    }
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// Thunk para obtener analytics por producto
export const fetchProductStockAnalytics = createAsyncThunk<
  ProductStockAnalyticsDto[],
  { limit?: number; offset?: number },
  { rejectValue: string }
>("analytics/fetchProductStockAnalytics", async (params, { rejectWithValue }) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.limit) {
      queryParams.append("limit", params.limit.toString());
    }

    if (params.offset) {
      queryParams.append("offset", params.offset.toString());
    }

    const response = await axiosInstance.get<ProductStockAnalyticsResponseDto>(
      `/analytics/stock/by-product?${queryParams.toString()}`
    );

    if (response.data.status === "success" && response.data.data) {
      return response.data.data;
    } else {
      return rejectWithValue(
        "Error al obtener analytics por producto"
      );
    }
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// Thunk para obtener alertas de stock bajo
export const fetchLowStockAlerts = createAsyncThunk<
  LowStockAlertDto[],
  { threshold?: number; limit?: number },
  { rejectValue: string }
>("analytics/fetchLowStockAlerts", async (params, { rejectWithValue }) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.threshold) {
      queryParams.append("threshold", params.threshold.toString());
    }

    if (params.limit) {
      queryParams.append("limit", params.limit.toString());
    }

    const response = await axiosInstance.get<LowStockAlertsResponseDto>(
      `/analytics/stock/low-stock-alerts?${queryParams.toString()}`
    );

    if (response.data.status === "success" && response.data.data) {
      return response.data.data;
    } else {
      return rejectWithValue(
        "Error al obtener alertas de stock bajo"
      );
    }
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// Thunk para obtener analytics por categoría
export const fetchCategoryStockAnalytics = createAsyncThunk<
  CategoryStockAnalyticsDto[],
  void,
  { rejectValue: string }
>("analytics/fetchCategoryStockAnalytics", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get<CategoryStockAnalyticsResponseDto>(
      "/analytics/stock/by-category"
    );

    if (response.data.status === "success" && response.data.data) {
      return response.data.data;
    } else {
      return rejectWithValue(
        "Error al obtener analytics por categoría"
      );
    }
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// Thunk para obtener analytics detalladas de un usuario específico
export const fetchUserDetailedAnalytics = createAsyncThunk<
  UserDetailedAnalyticsResponseDto,
  {
    userId: string;
    period?: string;
    granularity?: string;
    timezone?: AnalyticsTimeZone;
    customRange?: { startDate: string; endDate: string };
    compareWithPrevious?: boolean;
  },
  { rejectValue: string }
>("analytics/fetchUserDetailedAnalytics", async (params, { rejectWithValue }) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.period) {
      queryParams.append("period", params.period);
    }

    if (params.granularity) {
      queryParams.append("granularity", params.granularity);
    }

    if (params.timezone) {
      queryParams.append("timezone", params.timezone);
    }

    if (params.customRange) {
      queryParams.append("startDate", params.customRange.startDate);
      queryParams.append("endDate", params.customRange.endDate);
    }

    if (params.compareWithPrevious !== undefined) {
      queryParams.append("compareWithPrevious", params.compareWithPrevious.toString());
    }

    const response = await axiosInstance.get<
      ApiResponse<UserDetailedAnalyticsResponseDto>
    >(`/analytics/users/${params.userId}/detailed?${queryParams.toString()}`);

    if (response.data.status === "success" && response.data.data) {
      return response.data.data;
    } else {
      return rejectWithValue(
        response.data.message || "Error al obtener analytics detalladas del usuario"
      );
    }
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// ============================================================================
// INITIAL STATE
// ============================================================================

interface AnalyticsState {
  // Datos de analytics
  orderAnalytics: OrderAnalyticsResponseDto | null;
  usersAnalyticsList: UsersAnalyticsListResponseDto | null;
  userDetailedAnalytics: UserDetailedAnalyticsResponseDto | null;

  // Stock analytics
  stockAnalytics: {
    valuation: StockAnalyticsMetricsDto | null;
    productAnalytics: ProductStockAnalyticsDto[] | null;
    lowStockAlerts: LowStockAlertDto[] | null;
    categoryAnalytics: CategoryStockAnalyticsDto[] | null;
    loading: {
      valuation: boolean;
      productAnalytics: boolean;
      lowStockAlerts: boolean;
      categoryAnalytics: boolean;
    };
    error: {
      valuation: string | null;
      productAnalytics: string | null;
      lowStockAlerts: string | null;
      categoryAnalytics: string | null;
    };
  };

  // Estados de carga
  loading: {
    isLoading: boolean;
    isLoadingBreakdown: boolean;
    isLoadingComparison: boolean;
    isLoadingUserAnalytics: boolean;
    isLoadingUsersAnalyticsList: boolean;
    isLoadingUserDetailedAnalytics: boolean;
  };

  // Filtros actuales
  filters: AnalyticsFilters;

  // Errores
  error: string | null;
  usersAnalyticsListError: string | null;
  userDetailedAnalyticsError: string | null;

  // Metadata
  lastUpdated: string | null;

  // UI state
  selectedMetric: keyof OrderAnalyticsResponseDto["current"]["total"];
  selectedUserMetric: keyof UserAnalyticsResponseDto["current"]["total"];
  chartTimeRange: {
    start: Date | null;
    end: Date | null;
  };
}

const initialFilters: AnalyticsFilters = {
  period: AnalyticsPeriod.ThisMonth,
  granularity: AnalyticsGranularity.Day,
  compareWithPrevious: true,
};

const initialState: AnalyticsState = {
  orderAnalytics: null,
  usersAnalyticsList: null,
  userDetailedAnalytics: null,
  stockAnalytics: {
    valuation: null,
    productAnalytics: null,
    lowStockAlerts: null,
    categoryAnalytics: null,
    loading: {
      valuation: false,
      productAnalytics: false,
      lowStockAlerts: false,
      categoryAnalytics: false,
    },
    error: {
      valuation: null,
      productAnalytics: null,
      lowStockAlerts: null,
      categoryAnalytics: null,
    },
  },
  loading: {
    isLoading: false,
    isLoadingBreakdown: false,
    isLoadingComparison: false,
    isLoadingUserAnalytics: false,
    isLoadingUsersAnalyticsList: false,
    isLoadingUserDetailedAnalytics: false,
  },
  filters: initialFilters,
  error: null,
  usersAnalyticsListError: null,
  userDetailedAnalyticsError: null,
  lastUpdated: null,
  selectedMetric: "gross",
  selectedUserMetric: "totalRevenue",
  chartTimeRange: {
    start: null,
    end: null,
  },
};

// ============================================================================
// SLICE
// ============================================================================

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    // Actualizar filtros
    setFilters: (state, action: PayloadAction<Partial<AnalyticsFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Resetear filtros a valores por defecto
    resetFilters: (state) => {
      state.filters = initialFilters;
    },

    // Establecer período
    setPeriod: (state, action: PayloadAction<AnalyticsPeriod>) => {
      state.filters.period = action.payload;

      // Si el período no es custom, limpiar el rango personalizado
      if (action.payload !== AnalyticsPeriod.Custom) {
        state.filters.customRange = undefined;
      }

      // Ajustar granularidad según el período
      if (action.payload === AnalyticsPeriod.Today) {
        state.filters.granularity = AnalyticsGranularity.Hour;
      } else if (action.payload === AnalyticsPeriod.ThisWeek) {
        state.filters.granularity = AnalyticsGranularity.Day;
      } else if (action.payload === AnalyticsPeriod.ThisMonth) {
        state.filters.granularity = AnalyticsGranularity.Day;
      } else if (action.payload === AnalyticsPeriod.ThisYear) {
        state.filters.granularity = AnalyticsGranularity.Month;
      }
    },

    // Establecer granularidad
    setGranularity: (state, action: PayloadAction<AnalyticsGranularity>) => {
      state.filters.granularity = action.payload;
    },

    // Establecer rango personalizado
    setCustomRange: (
      state,
      action: PayloadAction<{ startDate: string; endDate: string }>
    ) => {
      state.filters.customRange = action.payload;
      state.filters.period = AnalyticsPeriod.Custom;
    },

    // Toggle comparación con período anterior
    toggleComparison: (state) => {
      state.filters.compareWithPrevious = !state.filters.compareWithPrevious;
    },

    // Establecer métrica seleccionada para el chart
    setSelectedMetric: (
      state,
      action: PayloadAction<keyof OrderAnalyticsResponseDto["current"]["total"]>
    ) => {
      state.selectedMetric = action.payload;
    },

    // Establecer métrica seleccionada para el chart de usuarios
    setSelectedUserMetric: (
      state,
      action: PayloadAction<keyof UserAnalyticsResponseDto["current"]["total"]>
    ) => {
      state.selectedUserMetric = action.payload;
    },

    // Establecer rango de tiempo del chart
    setChartTimeRange: (
      state,
      action: PayloadAction<{ start: Date | null; end: Date | null }>
    ) => {
      state.chartTimeRange = action.payload;
    },

    // Limpiar errores
    clearError: (state) => {
      state.error = null;
    },

    // Limpiar errores de users analytics list
    clearUsersAnalyticsListError: (state) => {
      state.usersAnalyticsListError = null;
    },

    // Limpiar errores de user detailed analytics
    clearUserDetailedAnalyticsError: (state) => {
      state.userDetailedAnalyticsError = null;
    },

    // Limpiar datos
    clearData: (state) => {
      state.orderAnalytics = null;
      state.lastUpdated = null;
    },

    // Limpiar datos de users analytics list
    clearUsersAnalyticsListData: (state) => {
      state.usersAnalyticsList = null;
    },

    // Limpiar datos de user detailed analytics
    clearUserDetailedAnalyticsData: (state) => {
      state.userDetailedAnalytics = null;
    },

    // Stock analytics actions
    clearStockValuation: (state) => {
      state.stockAnalytics.valuation = null;
      state.stockAnalytics.error.valuation = null;
    },

    clearProductStockAnalytics: (state) => {
      state.stockAnalytics.productAnalytics = null;
      state.stockAnalytics.error.productAnalytics = null;
    },

    clearLowStockAlerts: (state) => {
      state.stockAnalytics.lowStockAlerts = null;
      state.stockAnalytics.error.lowStockAlerts = null;
    },

    clearCategoryStockAnalytics: (state) => {
      state.stockAnalytics.categoryAnalytics = null;
      state.stockAnalytics.error.categoryAnalytics = null;
    },

    clearAllStockAnalytics: (state) => {
      state.stockAnalytics.valuation = null;
      state.stockAnalytics.productAnalytics = null;
      state.stockAnalytics.lowStockAlerts = null;
      state.stockAnalytics.categoryAnalytics = null;
      state.stockAnalytics.error = {
        valuation: null,
        productAnalytics: null,
        lowStockAlerts: null,
        categoryAnalytics: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchOrderAnalytics
      .addCase(fetchOrderAnalytics.pending, (state) => {
        state.loading.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderAnalytics.fulfilled, (state, action) => {
        state.loading.isLoading = false;
        state.orderAnalytics = action.payload;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchOrderAnalytics.rejected, (state, action) => {
        state.loading.isLoading = false;
        state.error = action.payload || "Error al cargar analytics";
      })

      // fetchUsersAnalyticsList
      .addCase(fetchUsersAnalyticsList.pending, (state) => {
        state.loading.isLoadingUsersAnalyticsList = true;
        state.usersAnalyticsListError = null;
      })
      .addCase(fetchUsersAnalyticsList.fulfilled, (state, action) => {
        state.loading.isLoadingUsersAnalyticsList = false;
        state.usersAnalyticsList = action.payload;
        state.usersAnalyticsListError = null;
      })
      .addCase(fetchUsersAnalyticsList.rejected, (state, action) => {
        state.loading.isLoadingUsersAnalyticsList = false;
        state.usersAnalyticsListError = action.payload || "Error al cargar lista de usuarios con analytics";
      })

      // fetchUserDetailedAnalytics
      .addCase(fetchUserDetailedAnalytics.pending, (state) => {
        state.loading.isLoadingUserDetailedAnalytics = true;
        state.userDetailedAnalyticsError = null;
      })
      .addCase(fetchUserDetailedAnalytics.fulfilled, (state, action) => {
        state.loading.isLoadingUserDetailedAnalytics = false;
        state.userDetailedAnalytics = action.payload;
        state.userDetailedAnalyticsError = null;
      })
      .addCase(fetchUserDetailedAnalytics.rejected, (state, action) => {
        state.loading.isLoadingUserDetailedAnalytics = false;
        state.userDetailedAnalyticsError = action.payload || "Error al cargar analytics detalladas del usuario";
      })

      // fetchStockValuation
      .addCase(fetchStockValuation.pending, (state) => {
        state.stockAnalytics.loading.valuation = true;
        state.stockAnalytics.error.valuation = null;
      })
      .addCase(fetchStockValuation.fulfilled, (state, action) => {
        state.stockAnalytics.loading.valuation = false;
        state.stockAnalytics.valuation = action.payload;
        state.stockAnalytics.error.valuation = null;
      })
      .addCase(fetchStockValuation.rejected, (state, action) => {
        state.stockAnalytics.loading.valuation = false;
        state.stockAnalytics.error.valuation = action.payload || "Error al cargar valuación de stock";
      })

      // fetchProductStockAnalytics
      .addCase(fetchProductStockAnalytics.pending, (state) => {
        state.stockAnalytics.loading.productAnalytics = true;
        state.stockAnalytics.error.productAnalytics = null;
      })
      .addCase(fetchProductStockAnalytics.fulfilled, (state, action) => {
        state.stockAnalytics.loading.productAnalytics = false;
        state.stockAnalytics.productAnalytics = action.payload;
        state.stockAnalytics.error.productAnalytics = null;
      })
      .addCase(fetchProductStockAnalytics.rejected, (state, action) => {
        state.stockAnalytics.loading.productAnalytics = false;
        state.stockAnalytics.error.productAnalytics = action.payload || "Error al cargar analytics por producto";
      })

      // fetchLowStockAlerts
      .addCase(fetchLowStockAlerts.pending, (state) => {
        state.stockAnalytics.loading.lowStockAlerts = true;
        state.stockAnalytics.error.lowStockAlerts = null;
      })
      .addCase(fetchLowStockAlerts.fulfilled, (state, action) => {
        state.stockAnalytics.loading.lowStockAlerts = false;
        state.stockAnalytics.lowStockAlerts = action.payload;
        state.stockAnalytics.error.lowStockAlerts = null;
      })
      .addCase(fetchLowStockAlerts.rejected, (state, action) => {
        state.stockAnalytics.loading.lowStockAlerts = false;
        state.stockAnalytics.error.lowStockAlerts = action.payload || "Error al cargar alertas de stock bajo";
      })

      // fetchCategoryStockAnalytics
      .addCase(fetchCategoryStockAnalytics.pending, (state) => {
        state.stockAnalytics.loading.categoryAnalytics = true;
        state.stockAnalytics.error.categoryAnalytics = null;
      })
      .addCase(fetchCategoryStockAnalytics.fulfilled, (state, action) => {
        state.stockAnalytics.loading.categoryAnalytics = false;
        state.stockAnalytics.categoryAnalytics = action.payload;
        state.stockAnalytics.error.categoryAnalytics = null;
      })
      .addCase(fetchCategoryStockAnalytics.rejected, (state, action) => {
        state.stockAnalytics.loading.categoryAnalytics = false;
        state.stockAnalytics.error.categoryAnalytics = action.payload || "Error al cargar analytics por categoría";
      })
  },
});

export const {
  setFilters,
  resetFilters,
  setPeriod,
  setGranularity,
  setCustomRange,
  toggleComparison,
  setSelectedMetric,
  setSelectedUserMetric,
  setChartTimeRange,
  clearError,
  clearUsersAnalyticsListError,
  clearUserDetailedAnalyticsError,
  clearData,
  clearUsersAnalyticsListData,
  clearUserDetailedAnalyticsData,
  clearStockValuation,
  clearProductStockAnalytics,
  clearLowStockAlerts,
  clearCategoryStockAnalytics,
  clearAllStockAnalytics,
} = analyticsSlice.actions;

export default analyticsSlice.reducer;
