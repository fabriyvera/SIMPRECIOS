# Plan de Migración: Frontend → Backend en AWS Producción

**Fecha**: Junio 2, 2026  
**URL Backend Producción**: `http://3.141.164.208:8000`

---

## 📋 Diagnóstico del Estado Actual

### ❌ Problemas Identificados

1. **URLs Hardcodeadas**: El frontend tiene múltiples llamadas con URLs hardcodeadas a `http://localhost:8000`
   - `HomeClient.tsx` (6+ llamadas directas)
   - `VendorDashboard.tsx` (2+ llamadas directas)
   - `MarketCard.tsx` y otros componentes

2. **Configuración Desaprovechada**: Existe `src/config/api.ts` con configuración centralizada, pero **NO se está usando** en la mayoría del código

3. **Sin Variables de Entorno**: No hay archivo `.env.local` o `.env.production` configurado

### Archivos Afectados

```
frontend/src/
├── components/
│   ├── HomeClient.tsx        ❌ 8+ URLs hardcodeadas
│   ├── VendorDashboard.tsx   ❌ 2+ URLs hardcodeadas
│   ├── MarketCard.tsx        ❌ 1+ URLs hardcodeadas
│   └── ... (posibles otros)
├── config/
│   └── api.ts                ✅ Existe, NO se usa
└── services/
    └── api/                  🔶 Parcialmente usado
```

---

## 🎯 Solución Propuesta

### Estrategia de Migración en 4 Pasos

#### **PASO 1: Configurar Variables de Entorno**
- Crear archivo `.env.local` (desarrollo)
- Crear archivo `.env.production` (producción)
- Asegurar que `NEXT_PUBLIC_API_URL` esté disponible en build

#### **PASO 2: Centralizar Todas las Llamadas API**
- Reemplazar todos los `fetch()` directos con llamadas a través de `api.ts`
- Crear helpers/servicios para cada módulo (auth, markets, prices, interaccion, stock)
- Usar la función `buildUrl()` existente

#### **PASO 3: Reemplazar URLs Hardcodeadas**
- `HomeClient.tsx`: 8 llamadas a reemplazar
- `VendorDashboard.tsx`: 2 llamadas a reemplazar
- `MarketCard.tsx` y otros componentes: identificar y reemplazar
- `useInteraccion.ts` hook: centralizar

#### **PASO 4: Validar y Desplegar**
- Probar con variables locales apuntando al backend local
- Cambiar a URL de producción
- Realizar testing de endpoints críticos
- Desplegar frontend

---

## 📝 Implementación Detallada

### PASO 1️⃣ Crear Archivo de Configuración de Entorno

**Crear**: `frontend/.env.local` (para desarrollo)
```env
# Backend Development
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Crear**: `frontend/.env.production` (para producción)
```env
# Backend Production
NEXT_PUBLIC_API_URL=http://3.141.164.208:8000
```

**Actualizar**: `frontend/.env.example` (para documentación)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

---

### PASO 2️⃣ Mejorar `src/config/api.ts`

**Estado Actual**: Tiene estructura básica pero le faltan helpers

**Mejora**:
```typescript
// src/config/api.ts

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
    
    // Interacción
    CALIFICAR: '/api/interaccion/puestos/{puesto_id}/calificar',
    DENUNCIAR: '/api/interaccion/puestos/{puesto_id}/denunciar',
    VERIFICAR_PRECIO: '/api/interaccion/puestos/{puesto_id}/verificar-precio',
    GET_CALIFICACIONES: '/api/interaccion/calificaciones',
    
    // Favoritos
    AGREGAR_FAVORITO: '/api/interaccion/favoritos/{puesto_id}',
    ELIMINAR_FAVORITO: '/api/interaccion/favoritos/{puesto_id}',
    LISTAR_FAVORITOS: '/api/interaccion/favoritos',
    
    // Usuario
    GET_USER_INTERACCIONES: '/api/interaccion/usuario/interacciones',
    GET_PUESTO_INTERACCIONES: '/api/interaccion/puestos/{puesto_id}/interacciones',
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

// Helpers para llamadas comunes
export const fetchWithConfig = async (
  endpoint: string,
  options?: RequestInit & { params?: Record<string, string | number> }
) => {
  const { params, ...fetchOptions } = options || {};
  const url = buildUrl(endpoint, params);
  const response = await fetch(url, {
    timeout: API.TIMEOUT,
    ...fetchOptions,
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};
```

---

### PASO 3️⃣ Crear Servicios API por Módulo

**Crear**: `frontend/src/services/api/markets.ts`
```typescript
import { API, buildUrl } from '@/config/api';

export const marketsAPI = {
  getMarkets: async () => {
    const response = await fetch(buildUrl(API.ENDPOINTS.GET_MARKETS));
    if (!response.ok) throw new Error('Error al consultar mercados');
    return response.json();
  },
};
```

**Crear**: `frontend/src/services/api/prices.ts`
```typescript
import { API, buildUrl } from '@/config/api';

export const pricesAPI = {
  getVendorPuestos: async (userId: string) => {
    const response = await fetch(buildUrl(API.ENDPOINTS.GET_VENDOR_PUESTOS, { userId }));
    if (!response.ok) throw new Error('Error al obtener puestos');
    return response.json();
  },
  
  updatePrice: async (data: any, headers?: HeadersInit) => {
    const response = await fetch(buildUrl(API.ENDPOINTS.UPDATE_PRICE), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error en backend');
    return response.json();
  },
  
  getPrice: async (marketId: string, productId: string, headers?: HeadersInit) => {
    const response = await fetch(
      buildUrl(API.ENDPOINTS.GET_PRICE, { marketId, productId }),
      { headers }
    );
    if (!response.ok) throw new Error('Error al obtener precio');
    return response.json();
  },
};
```

**Crear**: `frontend/src/services/api/interaccion.ts`
```typescript
import { API, buildUrl } from '@/config/api';

export const interaccionAPI = {
  calificar: async (puestoId: string, data: any, headers?: HeadersInit) => {
    const response = await fetch(
      buildUrl(API.ENDPOINTS.CALIFICAR, { puesto_id: puestoId }),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(data),
      }
    );
    return response.json();
  },
  
  getCalificaciones: async (headers?: HeadersInit) => {
    const response = await fetch(
      buildUrl(API.ENDPOINTS.GET_CALIFICACIONES),
      { headers }
    );
    if (!response.ok) throw new Error('Error al obtener calificaciones');
    return response.json();
  },
  
  agregarFavorito: async (puestoId: string, headers?: HeadersInit) => {
    const response = await fetch(
      buildUrl(API.ENDPOINTS.AGREGAR_FAVORITO, { puesto_id: puestoId }),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
      }
    );
    return response.json();
  },
  
  eliminarFavorito: async (puestoId: string, headers?: HeadersInit) => {
    const response = await fetch(
      buildUrl(API.ENDPOINTS.ELIMINAR_FAVORITO, { puesto_id: puestoId }),
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...headers },
      }
    );
    return response.json();
  },
  
  listarFavoritos: async (headers?: HeadersInit) => {
    const response = await fetch(
      buildUrl(API.ENDPOINTS.LISTAR_FAVORITOS),
      { headers }
    );
    if (!response.ok) throw new Error('Error al listar favoritos');
    return response.json();
  },
};
```

---

### PASO 4️⃣ Reemplazar Llamadas en Componentes

#### **HomeClient.tsx** (Prioridad: 🔴 ALTA)
Reemplazar estas llamadas:
- ✏️ Línea ~101: `http://localhost:8000/api/prices/vendor-puestos/${userId}`
- ✏️ Línea ~168: `http://localhost:8000/api/stock/markets`
- ✏️ Línea ~243: `http://localhost:8000/interaccion/calificaciones`
- ✏️ Línea ~252: `http://localhost:8000/interaccion/favoritos`
- ✏️ Otras líneas similares

**Cambiar a**:
```typescript
import { marketsAPI } from '@/services/api/markets';
import { pricesAPI } from '@/services/api/prices';
import { interaccionAPI } from '@/services/api/interaccion';

// En lugar de:
// const res = await fetch(`http://localhost:8000/api/prices/vendor-puestos/${userId}`);

// Usar:
const res = await pricesAPI.getVendorPuestos(userId);
```

#### **VendorDashboard.tsx** (Prioridad: 🔴 ALTA)
Reemplazar:
- ✏️ Línea ~74: `http://localhost:8000/api/prices/update`
- ✏️ Línea ~122: `http://localhost:8000/api/prices/{market.id}/{productId}`

**Cambiar a**:
```typescript
import { pricesAPI } from '@/services/api/prices';

await pricesAPI.updatePrice(updateData, headers);
await pricesAPI.getPrice(market.id, productId, headers);
```

#### **Otros Componentes**
- `MarketCard.tsx`
- Otros que tengan URLs hardcodeadas

---

## ✅ Checklist de Implementación

### Fase 1: Preparación (30 min)
- [ ] Crear `.env.local` con URL local
- [ ] Crear `.env.production` con URL AWS
- [ ] Actualizar `api.ts` con mejoras
- [ ] Crear servicios API (markets.ts, prices.ts, interaccion.ts)

### Fase 2: Refactorización (1-2 horas)
- [ ] Actualizar `HomeClient.tsx`
- [ ] Actualizar `VendorDashboard.tsx`
- [ ] Actualizar `MarketCard.tsx` y otros
- [ ] Buscar y reemplazar URLs restantes

### Fase 3: Testing (30 min - 1 hora)
- [ ] Probar con `NEXT_PUBLIC_API_URL=http://localhost:8000` (dev)
- [ ] Verificar que endpoints siguen funcionando
- [ ] Revisar Network tab en DevTools

### Fase 4: Deployment (30 min)
- [ ] Cambiar `NEXT_PUBLIC_API_URL=http://3.141.164.208:8000` en AWS
- [ ] Hacer build: `npm run build`
- [ ] Desplegar nueva versión
- [ ] Testing en producción

---

## 🚀 Comandos Útiles

### Buscar todas las URLs hardcodeadas
```bash
grep -r "http://localhost:8000" frontend/src/
```

### Build local con variables personalizadas
```bash
NEXT_PUBLIC_API_URL=http://3.141.164.208:8000 npm run build
```

### Testing de endpoints
```bash
curl http://3.141.164.208:8000/api/stock/markets
```

---

## 📌 Variables de Entorno por Entorno

| Entorno | Base URL | Archivo |
|---------|----------|---------|
| Desarrollo Local | `http://localhost:8000` | `.env.local` |
| Staging | `http://3.141.164.208:8000` (temporal) | `.env.staging` |
| Producción | `http://3.141.164.208:8000` | `.env.production` |

---

## ⚠️ Consideraciones Importantes

1. **CORS**: Asegurar que el backend en AWS tenga CORS configurado para aceptar requests desde el frontend
   ```python
   # En backend/app/main.py
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://tudominio.com", "http://3.141.164.208:3000"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **Timeouts**: La variable `API.TIMEOUT` podría necesitar ajuste si el servidor AWS tiene latencia mayor

3. **Error Handling**: Revisar que los handlers de error en componentes funcionen correctamente con la nueva URL

4. **Monitoreo**: Después del deploy, monitorear Network tab y Console para errores

---

## 📊 Impacto de Cambios

| Componente | Cambios | Complejidad |
|-----------|---------|------------|
| `api.ts` | Mejorar helpers | 🟢 Baja |
| `HomeClient.tsx` | 8 URLs a servicios | 🟡 Media |
| `VendorDashboard.tsx` | 2 URLs a servicios | 🟢 Baja |
| Otros componentes | Identificar y reemplazar | 🟡 Media |
| Variables de entorno | Crear archivos .env | 🟢 Baja |

**Tiempo Total Estimado**: 2-3 horas

---

## 🔗 Referencias Útiles

- Backend AWS: `http://3.141.164.208:8000`
- Endpoint ejemplo: `http://3.141.164.208:8000/api/stock/markets`
- Next.js Env Vars: https://nextjs.org/docs/basic-features/environment-variables
- CORS en FastAPI: https://fastapi.tiangolo.com/tutorial/cors/
