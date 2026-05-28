import { apiClient } from './config';
import { API } from '@/config/api';

export interface CalificarRequest {
  usuario_id: string;
  estrellas: number;
  comentario?: string;
}

export interface CalificarResponse {
  mensaje: string;
  rating_id: string;
  nuevo_promedio: number;
  total_calificaciones: number;
}

export interface VerificarPrecioRequest {
  usuario_id: string;
  producto_id: number;
  precio_pagado: number;
  es_correcto: boolean;
}

export interface VerificarPrecioResponse {
  mensaje: string;
  precio_publicado: number;
  precio_pagado: number;
  diferencia_porcentaje: number;
  indicador_transparencia: number;
  es_sobreprecio: boolean;
}

export interface DenunciarRequest {
  usuario_id: string;
  producto_id: number;
  precio_cobrado: number;
  motivo: string;
  url_evidencia?: string;
}

export interface DenunciarResponse {
  mensaje: string;
  denuncia_id: string;
  diferencia_detectada: number;
  porcentaje_exceso: number;
  alerta_generada: boolean;
}

export interface AgregarFavoritoResponse {
  mensaje: string;
  favorito_id: string;
}

export interface EliminarFavoritoResponse {
  mensaje: string;
}

export interface FavoritoResponse {
  puesto_id: string;
  nombre_puesto: string;
  mercado: string;
  rating_promedio: number;
  es_favorito: boolean;
}

export interface ListaFavoritosResponse {
  total: number;
  favoritos: FavoritoResponse[];
}

export interface InteraccionResponse {
  tipo: string; // 'calificacion' o 'denuncia'
  interaccion_id: number;
  puesto_id: number;
  usuario_id: string;
  puntuacion?: number; // Solo para calificaciones
  texto: string; // comentario para calificaciones, motivo para denuncias
  fecha: string;
  precio_detectado?: number; // Solo para denuncias
  estado?: string; // Solo para denuncias
}

export interface ListaInteraccionesResponse {
  total: number;
  interacciones: InteraccionResponse[];
}

// Calificaciones
export async function calificarPuesto(
  puestoId: string,
  data: CalificarRequest
): Promise<CalificarResponse> {
  return apiClient.post<CalificarResponse>(
    API.ENDPOINTS.CALIFICAR.replace('{puesto_id}', puestoId),
    data
  );
}

// Verificar Transparencia
export async function verificarTransparencia(
  puestoId: string,
  data: VerificarPrecioRequest
): Promise<VerificarPrecioResponse> {
  return apiClient.post<VerificarPrecioResponse>(
    API.ENDPOINTS.VERIFICAR_PRECIO.replace('{puesto_id}', puestoId),
    data
  );
}

// Denunciar Sobreprecio
export async function denunciarSobreprecio(
  puestoId: string,
  data: DenunciarRequest
): Promise<DenunciarResponse> {
  return apiClient.post<DenunciarResponse>(
    API.ENDPOINTS.DENUNCIAR.replace('{puesto_id}', puestoId),
    data
  );
}

// Favoritos
export async function agregarFavorito(
  puestoId: string,
  usuarioId: string
): Promise<AgregarFavoritoResponse> {
  return apiClient.post<AgregarFavoritoResponse>(
    API.ENDPOINTS.AGREGAR_FAVORITO.replace('{puesto_id}', puestoId),
    { usuario_id: usuarioId }
  );
}

export async function eliminarFavorito(
  puestoId: string,
  usuarioId: string
): Promise<EliminarFavoritoResponse> {
  return apiClient.delete<EliminarFavoritoResponse>(
    API.ENDPOINTS.ELIMINAR_FAVORITO.replace('{puesto_id}', puestoId),
    {
      params: { usuario_id: usuarioId }
    }
  );
}

export async function listarFavoritos(
  usuarioId: string
): Promise<ListaFavoritosResponse> {
  return apiClient.get<ListaFavoritosResponse>(
    API.ENDPOINTS.LISTAR_FAVORITOS,
    {
      params: { usuario_id: usuarioId }
    }
  );
}

// Interacciones
export async function obtenerInteraccionesPuesto(
  puestoId: string
): Promise<ListaInteraccionesResponse> {
  return apiClient.get<ListaInteraccionesResponse>(
    API.ENDPOINTS.OBTENER_INTERACCIONES_PUESTO.replace('{puesto_id}', puestoId)
  );
}

export async function obtenerInteraccionesUsuario(
  usuarioId: string
): Promise<ListaInteraccionesResponse> {
  return apiClient.get<ListaInteraccionesResponse>(
    API.ENDPOINTS.OBTENER_INTERACCIONES_USUARIO,
    {
      params: { usuario_id: usuarioId }
    }
  );
}

export class APIError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}