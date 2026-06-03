import { API, buildUrl } from '@/config/api';

export const interaccionAPI = {
  getCalificaciones: async (headers?: HeadersInit) => {
    const url = buildUrl(API.ENDPOINTS.GET_CALIFICACIONES);
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Error al obtener calificaciones');
    return response.json();
  },
  
  listarFavoritos: async (headers?: HeadersInit) => {
    const url = buildUrl(API.ENDPOINTS.LISTAR_FAVORITOS);
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Error al listar favoritos');
    return response.json();
  },
  
  agregarFavorito: async (puestoId: string, headers?: HeadersInit) => {
    const url = buildUrl(API.ENDPOINTS.AGREGAR_FAVORITO, { puesto_id: puestoId });
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
    });
    return response.json();
  },
  
  eliminarFavorito: async (puestoId: string, headers?: HeadersInit) => {
    const url = buildUrl(API.ENDPOINTS.ELIMINAR_FAVORITO, { puesto_id: puestoId });
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...headers },
    });
    return response.json();
  },
};
