# Integracion del Modulo de Interaccion Social - Frontend y Backend

## Descripcion General
Conexion del frontend con el backend para el modulo de interaccion social (HU-14, HU-15, HU-16, HU-17).
Solo se integrara el modulo de interaccion. Los demas modulos seran implementados posteriormente.

## Estructura del Modulo de Interaccion

HU-14: Calificar la atencion del puesto
HU-15: Verificar transparencia de precios
HU-16: Denunciar sobreprecio
HU-17: Agregar/eliminar favoritos

## Cambios Necesarios en Backend

### 1. Variables de Entorno
Archivo: backend/.env

Variables requeridas (ya existentes):
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_JWT_SECRET=
BACKEND_URL=http://localhost:8000 (para desarrollo)

Agregar:
CORS_ORIGINS=http://localhost:3000,https://tudominio.com

### 2. Configuracion de CORS en FastAPI
Archivo: backend/app/main.py

Importar middleware:
from fastapi.middleware.cors import CORSMiddleware

Agregar middleware CORS:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://tudominio.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

### 3. Validaciones de Autenticacion
Archivo: backend/app/middleware/auth.py

Las funciones del router interaccion requieren usuario_id en el request.
Se valida mediante JWT del header Authorization.

## Cambios Necesarios en Frontend

### 1. Nueva Carpeta de Servicios API
Crear: frontend/src/services/api/

Archivo: frontend/src/services/api/config.ts
- Configuracion de URL base del backend
- Instancia de cliente HTTP
- Manejo de errores globales

Archivo: frontend/src/services/api/interaccion.ts
- Funciones para interactuar con endpoints del backend
- POST /interaccion/puestos/{puesto_id}/calificar
- POST /interaccion/puestos/{puesto_id}/verificar-precio
- POST /interaccion/puestos/{puesto_id}/denunciar
- POST /interaccion/favoritos/{puesto_id}
- DELETE /interaccion/favoritos/{puesto_id}
- GET /interaccion/favoritos

### 2. Nuevos Tipos TypeScript
Archivo: frontend/src/types/index.ts

Agregar tipos:
- CalificarRequest
- CalificarResponse
- VerificarPrecioRequest
- VerificarPrecioResponse
- DenunciarRequest
- DenunciarResponse
- AgregarFavoritoResponse
- EliminarFavoritoResponse
- ListaFavoritosResponse
- FavoritoResponse

### 3. Hook Personalizado para Interaccion
Archivo: frontend/src/hooks/useInteraccion.ts

Funciones:
- useCalificar(puesto_id): para calificar puestos
- useDenunciar(puesto_id): para denunciar sobreprecio
- useVerificarPrecio(puesto_id): para verificar transparencia
- useFavoritos(): para gestionar favoritos del usuario
- useAgregarFavorito(puesto_id): para agregar favorito
- useEliminarFavorito(puesto_id): para eliminar favorito

Manejo de:
- Loading states
- Error handling
- Success callbacks
- Token de autenticacion (JWT)

### 4. Modificar MarketCard.tsx
Archivo: frontend/src/components/MarketCard.tsx

Cambios:
- Remover estado local de favoritos y usar hook useFavoritos
- Remover estado local de resenias y usar hook useCalificar
- Remover estado local de denuncias y usar hook useDenunciar
- Integrar verificacion de transparencia con backend
- Agregar loading states en botones
- Agregar manejo de errores con notificaciones

Nuevas props:
- userId: string (ID del usuario autenticado)
- userToken: string (JWT token para autenticacion)
- onFavoriteAdded: callback cuando se agrega favorito
- onFavoriteRemoved: callback cuando se elimina favorito

### 5. Obtener Usuario Autenticado
Archivo: frontend/src/components/HomeClient.tsx

Cambios:
- Obtener usuario autenticado de Supabase en useEffect
- Pasar userId y token a componentes que lo necesiten
- Almacenar en state para acceso global o usar Context API
- Manejar caso donde usuario no esta logueado

Usar createClient de supabase/ssr para obtener sesion:
const { data: { session } } = await supabase.auth.getSession()

### 6. Crear Componente de Notificaciones (Toast)
Archivo: frontend/src/components/Toast.tsx

Para mostrar mensajes de:
- Exito: "Calificacion registrada exitosamente"
- Error: "Error al registrar la calificacion"
- Info: "Verificando transparencia..."

Usar biblioteca: sonner o react-hot-toast

### 7. Actualizar Variables de Entorno Frontend
Archivo: frontend/.env.local

Agregar:
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_API_VERSION=v1

### 8. Flujo de Autenticacion
El usuario debe estar logueado para:
- Calificar un puesto
- Denunciar sobreprecio
- Agregar/eliminar favoritos
- Verificar transparencia

Si no esta logueado:
- Redirigir a LoginView
- O mostrar modal pidiendo autenticacion
- O desabilitar botones con tooltip explicativo

## Endpoints del Backend a Consumir

Todos requieren autenticacion (header Authorization con JWT):

CalificacionesCalificar puesto:
POST /interaccion/puestos/{puesto_id}/calificar
Body: { usuario_id, estrellas, comentario? }
Response: { mensaje, rating_id, nuevo_promedio, total_calificaciones }

Verificar Transparencia:
POST /interaccion/puestos/{puesto_id}/verificar-precio
Body: { usuario_id, producto_id, precio_pagado, es_correcto }
Response: { mensaje, precio_publicado, precio_pagado, diferencia_porcentaje, indicador_transparencia, es_sobreprecio }

Denunciar Sobreprecio:
POST /interaccion/puestos/{puesto_id}/denunciar
Body: { usuario_id, producto_id, precio_cobrado, motivo, url_evidencia? }
Response: { mensaje, denuncia_id, diferencia_detectada, porcentaje_exceso, alerta_generada }

Agregar Favorito:
POST /interaccion/favoritos/{puesto_id}
Body: { usuario_id }
Response: { mensaje, favorito_id }

Eliminar Favorito:
DELETE /interaccion/favoritos/{puesto_id}
Query: usuario_id
Response: { mensaje }

Listar Favoritos:
GET /interaccion/favoritos
Query: usuario_id
Response: { total, favoritos: [{ puesto_id, nombre_puesto, mercado, rating_promedio, es_favorito }] }

## Manejo de Errores

En backend se lanzan excepciones HTTP:
- 404: Recurso no encontrado (puesto, usuario, precio)
- 409: Conflicto (usuario ya califico este puesto)
- 500: Error interno del servidor

En frontend capturar con try-catch y mostrar mensajes amigables al usuario.

## Base de Datos - Datos de Prueba

Ya existen datos de prueba en Supabase:
- mercados (3 mercados)
- puestos_venta (puestos en los mercados)
- productos_mercado (productos disponibles)
- stock_vendedora (precios actuales)
- precios_referenciales (precios del gobierno)
- profiles (usuarios registrados)

Usar estos datos para pruebas del modulo.

## Flujo de Uso - Caso de Ejemplo

1. Usuario inicia sesion en frontend
2. Ve lista de puestos en pantalla principal
3. Hace click en un puesto (MarketCard)
4. Ve opciones de calificar, denunciar, agregar favorito
5. Hace click en "Calificar"
6. Se abre modal con formulario
7. Ingresa rating y comentario
8. Hace submit
9. Frontend envia POST a backend con userId y datos
10. Backend valida datos, guarda en BD, calcula promedio
11. Backend retorna respuesta con nuevo promedio
12. Frontend muestra notificacion de exito
13. Frontend actualiza la vista del puesto con nuevo promedio

## Testing

Datos de prueba sugeridos:
- Email: usuario@test.com (usuario que existe en BD)
- Puesto ID: 1 (puesto que existe en BD)
- Producto ID: 1 (producto que existe en BD)
- Rating: 5 estrellas
- Comentario: "Excelente atencion y precios justos"

## Consideraciones de Seguridad

1. Validar userId en frontend antes de enviar request
2. Backend valida nuevamente el usuario_id del JWT
3. No almacenar token en localStorage (usar httpOnly cookies)
4. Validar que producto_id existe antes de enviar request
5. Validar que precio_pagado sea un numero positivo
6. Rate limiting en backend para evitar spam

## Archivo de Configuracion Global de API

Crear: frontend/src/config/api.ts

Constantes:
- API_BASE_URL: URL del backend
- API_ENDPOINTS: objeto con todas las rutas
- TIMEOUT: tiempo maximo de espera para requests
- RETRY_COUNT: numero de reintentos en caso de fallo

Ejemplo:
export const API = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  ENDPOINTS: {
    CALIFICAR: '/interaccion/puestos/{puesto_id}/calificar',
    DENUNCIAR: '/interaccion/puestos/{puesto_id}/denunciar',
    VERIFICAR_PRECIO: '/interaccion/puestos/{puesto_id}/verificar-precio',
    AGREGAR_FAVORITO: '/interaccion/favoritos/{puesto_id}',
    ELIMINAR_FAVORITO: '/interaccion/favoritos/{puesto_id}',
    LISTAR_FAVORITOS: '/interaccion/favoritos',
  },
  TIMEOUT: 10000,
  RETRY_COUNT: 3,
}

## Proximos Pasos (Modulos Futuros)

Despues de terminar el modulo de interaccion, integrar:
- HU-01 a HU-13: Otros modulos del sistema
- Autenticacion: Integrar con Supabase Auth
- Geolocation: Calcular distancias a puestos
- Notificaciones: Push notifications para denuncias

## Resumen de Archivos a Crear/Modificar

Crear:
- frontend/src/services/api/config.ts
- frontend/src/services/api/interaccion.ts
- frontend/src/hooks/useInteraccion.ts
- frontend/src/config/api.ts
- frontend/src/components/Toast.tsx

Modificar:
- frontend/src/components/MarketCard.tsx
- frontend/src/components/HomeClient.tsx
- frontend/src/types/index.ts
- frontend/.env.local (agregar variables)
- backend/app/main.py (CORS)
- backend/.env (si es necesario)

