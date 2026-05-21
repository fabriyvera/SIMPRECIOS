export const API = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  VERSION: 'v1',
  TIMEOUT: 10000,
  RETRY_COUNT: 3,
  ENDPOINTS: {
    CALIFICAR: '/interaccion/puestos/{puesto_id}/calificar',
    DENUNCIAR: '/interaccion/puestos/{puesto_id}/denunciar',
    VERIFICAR_PRECIO: '/interaccion/puestos/{puesto_id}/verificar-precio',
    AGREGAR_FAVORITO: '/interaccion/favoritos/{puesto_id}',
    ELIMINAR_FAVORITO: '/interaccion/favoritos/{puesto_id}',
    LISTAR_FAVORITOS: '/interaccion/favoritos',
  },
};

export const buildUrl = (endpoint: string, params?: Record<string, string | number>): string => {
  let url = endpoint;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, String(value));
    });
  }
  return `${API.BASE_URL}${url}`;
};
