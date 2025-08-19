import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchUsers, resetUsers, fetchUserByEmail } from "@/redux/slices/userSlice";

export const useUsers = () => {
  const dispatch = useAppDispatch();
  const {
    users,
    nextCursor,
    loading,
    error,
    userByEmail,
    loadingUserByEmail,
    errorUserByEmail,
  } = useAppSelector((state) => state.users);
  const findUserByEmail = useCallback(
    (email: string) => {
      dispatch(fetchUserByEmail(email));
    },
    [dispatch]
  );

  const loadUsers = useCallback(
    (limit?: number, cursor?: string) => {
      dispatch(fetchUsers({ limit, cursor }));
    },
    [dispatch]
  );

  const clearUsers = useCallback(() => {
    dispatch(resetUsers());
  }, [dispatch]);

  return {
    users,
    nextCursor,
    loading,
    error,
    loadUsers,
    clearUsers,
    userByEmail,
    loadingUserByEmail,
    errorUserByEmail,
    findUserByEmail,
  };
};
