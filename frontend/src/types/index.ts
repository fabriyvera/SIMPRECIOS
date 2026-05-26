export interface Product {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Market {
  id: string;
  name: string;
  category: string;
  isOpen: boolean;
  products: Product[];
  rating: number;
  reviews: Review[];
  image: string;
  description: string;
  hours: string;
  marketLocation: string;
  color: string;
  vendorId?: string;
  isFavorite?: boolean;
}

export interface PriceHistory {
  date: string;
  price: number;
}

export type AppView = "home" | "map" | "ai" | "vendor" | "login" | "registro" | "recuperar" | "verificar" | "perfil";

export interface CurrentUser {
  name: string;
  avatar: string;
  isVendor: boolean;
}

export interface MarketLocation {
  id: string;
  name: string;
  marketLocation: string;
  color: string;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  hours: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
}

// API Response Types for Interaccion Module
export interface CalificarResponse {
  mensaje: string;
  rating_id: string;
  nuevo_promedio: number;
  total_calificaciones: number;
}

export interface VerificarPrecioResponse {
  mensaje: string;
  precio_publicado: number;
  precio_pagado: number;
  diferencia_porcentaje: number;
  indicador_transparencia: number;
  es_sobreprecio: boolean;
}

export interface DenunciarResponse {
  mensaje: string;
  denuncia_id: string;
  diferencia_detectada: number;
  porcentaje_exceso: number;
  alerta_generada: boolean;
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

export interface SessionUser {
  id: string;
  email: string;
  rol?: 'Vendedora' | 'Comprador';
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}