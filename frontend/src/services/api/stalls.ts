/**
 * Servicio para interactuar con el endpoint /stalls de la API.
 */
import { Stall } from '@/types/stalls'; // Asumiendo un alias de ruta para @/

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface GetStallsParams {
  lat?: number;
  lng?: number;
}

export const getStalls = async (params?: GetStallsParams): Promise<Stall[]> => {
  const url = new URL(`${API_BASE_URL}/stalls`);

  if (params?.lat && params?.lng) {
    url.searchParams.append('lat', params.lat.toString());
    url.searchParams.append('lng', params.lng.toString());
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('No se pudieron obtener los puestos de venta.');
  }

  return response.json();
};