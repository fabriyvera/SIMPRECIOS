'use client';

import { useState } from 'react';
import {
  calificarPuesto,
  verificarTransparencia,
  denunciarSobreprecio,
  agregarFavorito,
  eliminarFavorito,
  listarFavoritos,
  CalificarRequest,
  VerificarPrecioRequest,
  DenunciarRequest,
  FavoritoResponse,
  APIError,
} from '@/services/api/interaccion';

interface UseInteraccionOptions {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export function useCalificar(puestoId: string, options?: UseInteraccionOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calificar = async (data: CalificarRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await calificarPuesto(puestoId, data);
      options?.onSuccess?.(response.mensaje);
      return response;
    } catch (err) {
      const message = err instanceof APIError ? err.message : 'Error al calificar';
      setError(message);
      options?.onError?.(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { calificar, loading, error };
}

export function useDenunciar(puestoId: string, options?: UseInteraccionOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const denunciar = async (data: DenunciarRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await denunciarSobreprecio(puestoId, data);
      options?.onSuccess?.(response.mensaje);
      return response;
    } catch (err) {
      const message = err instanceof APIError ? err.message : 'Error al denunciar';
      setError(message);
      options?.onError?.(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { denunciar, loading, error };
}

export function useVerificarPrecio(puestoId: string, options?: UseInteraccionOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verificar = async (data: VerificarPrecioRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await verificarTransparencia(puestoId, data);
      options?.onSuccess?.('Precio verificado');
      return response;
    } catch (err) {
      const message = err instanceof APIError ? err.message : 'Error al verificar precio';
      setError(message);
      options?.onError?.(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { verificar, loading, error };
}

export function useFavoritos(usuarioId: string | null, options?: UseInteraccionOptions) {
  const [favoritos, setFavoritos] = useState<FavoritoResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarFavoritos = async () => {
    if (!usuarioId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listarFavoritos(usuarioId);
      setFavoritos(response.favoritos);
      return response.favoritos;
    } catch (err) {
      const message = err instanceof APIError ? err.message : 'Error al cargar favoritos';
      setError(message);
      options?.onError?.(message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { favoritos, cargarFavoritos, loading, error };
}

export function useAgregarFavorito(puestoId: string, options?: UseInteraccionOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agregarAlFavorito = async (usuarioId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await agregarFavorito(puestoId, usuarioId);
      options?.onSuccess?.(response.mensaje);
      return response;
    } catch (err) {
      const message = err instanceof APIError ? err.message : 'Error al agregar favorito';
      setError(message);
      options?.onError?.(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { agregarAlFavorito, loading, error };
}

export function useEliminarFavorito(puestoId: string, options?: UseInteraccionOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eliminarDelFavorito = async (usuarioId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await eliminarFavorito(puestoId, usuarioId);
      options?.onSuccess?.(response.mensaje);
      return response;
    } catch (err) {
      const message = err instanceof APIError ? err.message : 'Error al eliminar favorito';
      setError(message);
      options?.onError?.(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { eliminarDelFavorito, loading, error };
}
