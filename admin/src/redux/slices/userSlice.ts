import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/utils/axiosInstance";
import { ApiResponse, getErrorMessage } from "@/types/api";
import { IGetUsersPaginatedResponse, IUser } from "@/interfaces/user";


interface UserState {
  users: IUser[];
  nextCursor: string | null;
  loading: boolean;
  error: string | null;
  userByEmail: IUser | null;
  loadingUserByEmail: boolean;
  errorUserByEmail: string | null;
}

const initialState: UserState = {
  users: [],
  nextCursor: null,
  loading: false,
  error: null,
  userByEmail: null,
  loadingUserByEmail: false,
  errorUserByEmail: null,
};

export const fetchUsers = createAsyncThunk<
  IGetUsersPaginatedResponse,
  { limit?: number; cursor?: string },
  { rejectValue: string }
>("users/fetchUsers", async ({ limit = 10, cursor }, { rejectWithValue }) => {
  try {
    const params: { limit: number; cursor?: string } = { limit };
    if (cursor) params.cursor = cursor;
    const res = await axiosInstance.get<
      ApiResponse<IGetUsersPaginatedResponse>
    >("/users", { params });
    if (res.data.status !== "success" || !res.data.data) {
      return rejectWithValue(res.data.message || "Error al obtener usuarios");
    }
    return res.data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const fetchUserByEmail = createAsyncThunk<
  IUser,
  string,
  { rejectValue: string }
>("users/fetchUserByEmail", async (email, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get<ApiResponse<IUser>>("/users/by-email", {
      params: { email },
    });
    if (res.data.status !== "success" || !res.data.data) {
      return rejectWithValue(res.data.message || "No se encontró el usuario");
    }
    return res.data.data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    resetUsers: (state) => {
      state.users = [];
      state.nextCursor = null;
      state.error = null;
      state.loading = false;
      state.userByEmail = null;
      state.loadingUserByEmail = false;
      state.errorUserByEmail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Si es la primera página (sin cursor), reemplaza. Si no, acumula.
        if (action.meta.arg && action.meta.arg.cursor) {
          state.users = [...state.users, ...action.payload.users];
        } else {
          state.users = action.payload.users;
        }
        state.nextCursor = action.payload.nextCursor;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error al obtener usuarios";
      })
      // fetchUserByEmail
      .addCase(fetchUserByEmail.pending, (state) => {
        state.loadingUserByEmail = true;
        state.errorUserByEmail = null;
        state.userByEmail = null;
      })
      .addCase(fetchUserByEmail.fulfilled, (state, action) => {
        state.loadingUserByEmail = false;
        state.errorUserByEmail = null;
        // Mapear _id a id si es necesario
        const user = action.payload as any;
        if (user && user._id && !user.id) {
          user.id = user._id;
        }
        state.userByEmail = user;
      })
      .addCase(fetchUserByEmail.rejected, (state, action) => {
        state.loadingUserByEmail = false;
        state.errorUserByEmail = action.payload || "No se encontró el usuario";
        state.userByEmail = null;
      });
  },
});

export const { resetUsers } = userSlice.actions;
export default userSlice.reducer;
