/**
 * Hook personalizado para obtener la lista de puestos,
 * manejando la lógica de geolocalización del usuario.
 */
import { useState, useEffect, useCallback } from 'react';
import { Stall } from '@/types/stalls';
import { getStalls } from '@/services/api/stalls';

export const useStalls = () => {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStalls = useCallback(async (coords?: { lat: number; lng: number }) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStalls(coords);
      setStalls(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Éxito: Llama a la API con las coordenadas del usuario.
          fetchStalls({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (geoError) => {
          // Error (ej. permiso denegado): Llama a la API sin coordenadas.
          console.warn(`Error de geolocalización: ${geoError.message}. Obteniendo puestos sin ordenar por distancia.`);
          fetchStalls();
        }
      );
    } else {
      // El navegador no soporta geolocalización.
      console.log('El navegador no soporta geolocalización. Obteniendo puestos sin ordenar.');
      fetchStalls();
    }
  }, [fetchStalls]);

  return { stalls, isLoading, error };
};