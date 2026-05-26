import { apiClient } from './config';

export interface UserProfile {
  id: string;
  nombre_completo: string;
  rol: 'Vendedora' | 'Comprador';
  es_verificado: boolean;
}

/**
 * Obtiene el perfil del usuario autenticado del backend
 * @param token JWT token del usuario
 * @returns Perfil del usuario con rol
 */
export async function getUserProfile(token: string): Promise<UserProfile> {
  try {
    const response = await fetch('http://localhost:8000/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    throw error;
  }
}

/**
 * Crea un perfil por defecto para un usuario nuevo
 * @param token JWT token del usuario
 * @returns Perfil creado
 */
export async function createUserProfile(token: string): Promise<UserProfile> {
  try {
    const response = await fetch('http://localhost:8000/api/auth/profile/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creando perfil:', error);
    throw error;
  }
}
