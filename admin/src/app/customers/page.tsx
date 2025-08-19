"use client";
import { useEffect, useRef, useCallback } from "react";
import { useUsers } from "@/hooks/useUsers";
import { debounce } from "@/utils/debounce";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";

const SKELETON_COUNT = 10;

const CustomersPage = () => {
  const { users, nextCursor, loading, error, loadUsers } = useUsers();
  const observer = useRef<IntersectionObserver | null>(null);

  // Debounced loadUsers for infinite scroll
  const debouncedFetch = useRef(
    debounce((params: { cursor?: string }) => {
      loadUsers(10, params.cursor);
    }, 200)
  ).current;

  const lastUserRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new window.IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && nextCursor) {
          debouncedFetch({ cursor: nextCursor });
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, nextCursor, debouncedFetch]
  );

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Skeleton row for loading
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <th>
        <div className="h-4 w-4 bg-gray-200 rounded" />
      </th>
      <td>
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </td>
      <td>
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </td>
      <td>
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </td>
    </tr>
  );

  return (
    <div className="px-4 py-6">
      <h1 className="text-[#111111] font-bold text-2xl mb-4">
        Lista de clientes
      </h1>
      {/* Tabla DaisyUI para desktop */}
      <div className="hidden md:block">
        <table className="table">
          <thead className="text-[#222222]">
            <tr>
              <th>#</th>
              <th>Email</th>
              <th>Último acceso</th>
            </tr>
          </thead>
          <tbody className="text-[#222222]">
            {loading &&
              users.length === 0 &&
              Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
                <SkeletonRow key={idx} />
              ))}
            {error && (
              <tr>
                <td colSpan={5} className="text-center text-error">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && users.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-sm opacity-60">
                  No hay clientes
                </td>
              </tr>
            )}
            {users.map((user, idx) => {
              if (idx === users.length - 1) {
                return (
                  <tr ref={lastUserRef} key={user.id}>
                    <th>{idx + 1}</th>
                    <td>{user.email}</td>
                    <td>
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleString("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={user.id}>
                  <th>{idx + 1}</th>
                  <td>{user.email}</td>
                  <td>
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Tabla mobile: una "columna" por usuario */}
      <div className="block md:hidden">
        <div className="space-y-4">
          {loading &&
            users.length === 0 &&
            Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
              <div
                key={idx}
                className="p-4 border rounded animate-pulse space-y-2"
              >
                <div className="h-4 w-4 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
            ))}
          {error && (
            <div className="p-4 border rounded text-center text-error">
              {error}
            </div>
          )}
          {!loading && !error && users.length === 0 && (
            <div className="p-4 border rounded text-center text-sm opacity-60">
              No hay clientes
            </div>
          )}
          {users.map((user, idx) => (
            <div
              key={user.id}
              ref={idx === users.length - 1 ? lastUserRef : undefined}
              className="p-4 border rounded space-y-1 text-[#222222]"
            >
              <div className="font-bold text-xs">#{idx + 1}</div>
              <div>
                <span className="font-semibold">Email:</span> {user.email}
              </div>
              <div>
                <span className="font-semibold">Último acceso:</span>{" "}
                {user.lastLogin
                  ? new Date(user.lastLogin).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Mensajes de carga y fin de lista */}
      {loading && users.length > 0 && (
        <div className="flex justify-center py-4 text-[#666666]">
          <LoadingSpinner />
        </div>
      )}
      {!nextCursor && !loading && users.length > 0 && (
        <div className="p-4 text-center text-sm text-[#222222] opacity-60">
          No hay más clientes.
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
