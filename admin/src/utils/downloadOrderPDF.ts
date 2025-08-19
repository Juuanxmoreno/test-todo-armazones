import axiosInstance from "@/utils/axiosInstance";
import { getErrorMessage } from "@/types/api";

/**
 * Descarga el PDF de una orden y dispara la descarga en el navegador.
 * @param orderId ID de la orden
 * @param fileName Nombre del archivo a descargar (opcional)
 */
export async function downloadOrderPDF(orderId: string, fileName?: string) {
  try {
    const response = await axiosInstance.get(`/orders/${orderId}/pdf`, {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || `Orden-${orderId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
