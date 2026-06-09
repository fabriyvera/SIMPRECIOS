import { API, buildUrl } from '@/config/api';

export const pricesAPI = {
  getVendorPuestos: async (userId: string, headers?: HeadersInit) => {
    const response = await fetch(buildUrl(API.ENDPOINTS.GET_VENDOR_PUESTOS, { userId }), {
      headers,  // 👈 agregar
    });
    if (!response.ok) throw new Error('Error al obtener puestos');
    return response.json();
  },

  updatePrice: async (data: any, headers?: HeadersInit) => {
    const response = await fetch(buildUrl(API.ENDPOINTS.UPDATE_PRICE), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const mensajeError = typeof errorData.detail === 'object'
        ? JSON.stringify(errorData.detail)
        : errorData.detail;
      throw new Error(mensajeError || 'Error de validación en FastAPI');
    }
    return response.json();
  },

  getPrice: async (marketId: string, productId: string, headers?: HeadersInit) => {
    const response = await fetch(
      buildUrl(API.ENDPOINTS.GET_PRICE, { marketId, productId }),
      { headers }
    );
    if (!response.ok) throw new Error('Error al obtener precio');
    return response.json();
  },

  deletePrice: async (marketId: string, productId: string, headers?: HeadersInit) => {
    const response = await fetch(
      buildUrl(API.ENDPOINTS.DELETE_PRICE, { marketId, productId }),
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...headers },
      }
    );
    if (!response.ok) throw new Error('Error al eliminar producto');
    return response.json();
  },
};