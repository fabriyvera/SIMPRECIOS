export const API = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  VERSION: 'v1',
  TIMEOUT: 10000,
  RETRY_COUNT: 3,
  ENDPOINTS: {
    // Authentication
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    
    // Stock & Markets
    GET_MARKETS: '/api/stock/markets',
    GET_VENDOR_PUESTOS: '/api/prices/vendor-puestos/{userId}',
    UPDATE_PRICE: '/api/prices/update',
    GET_PRICE: '/api/prices/{marketId}/{productId}',
    DELETE_PRICE: '/api/prices/{marketId}/{productId}',
    
    // Interacción
    CALIFICAR: '/api/interaccion/puestos/{puesto_id}/calificar',
    DENUNCIAR: '/api/interaccion/puestos/{puesto_id}/denunciar',
    VERIFICAR_PRECIO: '/api/interaccion/puestos/{puesto_id}/verificar-precio',
    GET_CALIFICACIONES: '/interaccion/calificaciones',
    
    // Favoritos
    AGREGAR_FAVORITO: '/interaccion/favoritos/{puesto_id}',
    ELIMINAR_FAVORITO: '/interaccion/favoritos/{puesto_id}',
    LISTAR_FAVORITOS: '/interaccion/favoritos',
    
    // Usuario
    OBTENER_INTERACCIONES_USUARIO: '/api/interaccion/usuario/interacciones',
    OBTENER_INTERACCIONES_PUESTO: '/api/interaccion/puestos/{puesto_id}/interacciones',
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
