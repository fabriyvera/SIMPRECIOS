/**
 * Tipos de datos para el módulo de Puestos (Stalls),
 * alineados con la respuesta de la API del backend.
 */

export interface Market {
  nombre: string;
  lat: number;
  lng: number;
}

export interface Stall {
  id: number;
  nombre: string;
  rating_promedio: number | null;
  mercado: Market;
  distancia_km?: number | null; // Es opcional, solo viene si el usuario comparte su ubicación.
}