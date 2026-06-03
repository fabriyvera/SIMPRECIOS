# Plan de Implementación: Vista Interacciones Unificadas

## 🎯 Objetivo
Integrar la vista `vista_interacciones` para mostrar de forma unificada calificaciones (HU-14) y denuncias de sobreprecio (HU-16) en una sección de comentarios de cada puesto.

## 📋 Contexto
- **Vista creada**: `public.vista_interacciones`
- **Tablas unificadas**: `calificaciones` + `denuncias_sobreprecio`
- **Campo de tipo**: Distingue entre "calificacion" y "denuncia"
- **Security**: Usa `security_invoker = on` para respecto RLS

---

## 🗂️ Estructura de la Vista

```sql
CREATE VIEW public.vista_interacciones (
  tipo,                    -- 'calificacion' | 'denuncia'
  interaccion_id,          -- ID de la calificación o denuncia
  puesto_id,               -- ID del puesto
  usuario_id,              -- ID del usuario
  puntuacion,              -- Estrellas (solo calificaciones)
  texto,                   -- Comentario o descripción
  fecha,                   -- Fecha de registro
  precio_detectado,        -- Precio reportado (solo denuncias)
  estado                   -- Estado de la denuncia (solo denuncias)
)
```

---

## 🏗️ FASE 1: Backend - API REST

### 1.1 Modelos Pydantic (`app/models/interaccion.py`)

**Agregar al final del archivo:**

```python
# ─────────────────────────────────────────────
# Interacciones Unificadas (Calificaciones + Denuncias)
# ─────────────────────────────────────────────

class InteraccionUnificadaCalificacion(BaseModel):
    """Representación de una calificación en las interacciones"""
    tipo: str = "calificacion"
    interaccion_id: int
    puesto_id: int
    usuario_id: str
    puntuacion: int  # 1-5 estrellas
    texto: Optional[str]  # comentario
    fecha: datetime
    precio_detectado: Optional[float] = None
    estado: Optional[str] = None


class InteraccionUnificadaDenuncia(BaseModel):
    """Representación de una denuncia en las interacciones"""
    tipo: str = "denuncia"
    interaccion_id: int
    puesto_id: int
    usuario_id: Optional[str]
    puntuacion: Optional[int] = None
    texto: Optional[str]  # comentario
    fecha: datetime
    precio_detectado: float
    estado: str  # 'Pendiente', 'Revisado', 'Desestimado'


class InteraccionUnificada(BaseModel):
    """Unión discriminada de interacciones (calificaciones + denuncias)"""
    tipo: str  # 'calificacion' | 'denuncia'
    interaccion_id: int
    puesto_id: int
    usuario_id: Optional[str]
    puntuacion: Optional[int] = None
    texto: Optional[str]
    fecha: datetime
    precio_detectado: Optional[float] = None
    estado: Optional[str] = None


class ListaInteraccionesPuestoResponse(BaseModel):
    """Respuesta con todas las interacciones de un puesto"""
    puesto_id: int
    total_calificaciones: int
    promedio_estrellas: float
    total_denuncias: int
    denuncias_pendientes: int
    interacciones: List[InteraccionUnificada]
```

### 1.2 Función en Servicio (`app/services/interaccion_service.py`)

**Agregar nueva función:**

```python
async def obtener_interacciones_puesto(
    puesto_id: int,
    supabase: Client,
    limite: int = 50,
    offset: int = 0,
    tipo_filtro: Optional[str] = None,  # 'calificacion', 'denuncia', o None para todas
) -> ListaInteraccionesPuestoResponse:
    """
    Obtiene todas las interacciones (calificaciones + denuncias) de un puesto
    desde la vista unificada vista_interacciones.
    
    Args:
        puesto_id: ID del puesto
        supabase: Cliente de Supabase
        limite: Número máximo de interacciones a retornar
        offset: Para paginación
        tipo_filtro: Filtrar solo por tipo (opcional)
    
    Returns:
        ListaInteraccionesPuestoResponse con todas las interacciones
    
    Raises:
        HTTPException: Si el puesto no existe
    """
    # Verificar que el puesto existe
    puesto = (
        supabase.table("puestos_venta")
        .select("id, calificacion_promedio")
        .eq("id", puesto_id)
        .maybe_single()
        .execute()
    )
    if not puesto.data:
        raise HTTPException(status_code=404, detail="Puesto no encontrado")
    
    # Obtener todas las interacciones desde la vista
    query = supabase.table("vista_interacciones").select(
        "tipo, interaccion_id, puesto_id, usuario_id, puntuacion, "
        "texto, fecha, precio_detectado, estado"
    ).eq("puesto_id", puesto_id)
    
    # Aplicar filtro de tipo si se proporciona
    if tipo_filtro:
        query = query.eq("tipo", tipo_filtro)
    
    # Ordenar por fecha descendente y aplicar paginación
    resultado = (
        query
        .order("fecha", desc=True)
        .range(offset, offset + limite - 1)
        .execute()
    )
    
    interacciones_data: List[Dict[str, Any]] = cast(
        List[Dict[str, Any]], resultado.data
    ) if resultado.data else []
    
    # Convertir a modelos Pydantic
    interacciones = [InteraccionUnificada(**row) for row in interacciones_data]
    
    # Contar estadísticas
    total_calificaciones = sum(1 for i in interacciones if i.tipo == "calificacion")
    total_denuncias = sum(1 for i in interacciones if i.tipo == "denuncia")
    denuncias_pendientes = sum(
        1 for i in interacciones 
        if i.tipo == "denuncia" and i.estado == "Pendiente"
    )
    
    # Promedio de estrellas
    promedio_estrellas = cast(
        float,
        puesto.data.get("calificacion_promedio", 0.0)
    ) if puesto.data else 0.0
    
    return ListaInteraccionesPuestoResponse(
        puesto_id=puesto_id,
        total_calificaciones=total_calificaciones,
        promedio_estrellas=promedio_estrellas,
        total_denuncias=total_denuncias,
        denuncias_pendientes=denuncias_pendientes,
        interacciones=interacciones,
    )
```

### 1.3 Endpoint en Router (`app/routers/interaccion.py`)

**Agregar nuevo endpoint:**

```python
@router.get(
    "/interacciones/puesto/{puesto_id}",
    response_model=ListaInteraccionesPuestoResponse,
    tags=["Interacciones"],
    summary="Obtener todas las interacciones de un puesto",
    description="Retorna calificaciones y denuncias unificadas"
)
async def listar_interacciones_puesto(
    puesto_id: int,
    limite: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    tipo: Optional[str] = Query(None, regex="^(calificacion|denuncia)$"),
    supabase: Client = Depends(get_supabase_client),
):
    """
    Endpoint para obtener todas las interacciones (calificaciones + denuncias)
    de un puesto específico.
    
    **Parámetros de query:**
    - `limite`: Número de registros por página (default: 50, máx: 100)
    - `offset`: Para paginación (default: 0)
    - `tipo`: Filtrar por tipo de interacción ('calificacion' o 'denuncia')
    
    **Respuesta:**
    - `puesto_id`: ID del puesto
    - `total_calificaciones`: Cantidad total de calificaciones
    - `promedio_estrellas`: Promedio de calificación
    - `total_denuncias`: Cantidad total de denuncias
    - `denuncias_pendientes`: Denuncias aún no revisadas
    - `interacciones`: Array con todas las interacciones (calificaciones + denuncias)
    
    **Ejemplo:**
    ```
    GET /interaccion/interacciones/puesto/123?limite=20&tipo=denuncia
    ```
    """
    return await interaccion_service.obtener_interacciones_puesto(
        puesto_id=puesto_id,
        supabase=supabase,
        limite=limite,
        offset=offset,
        tipo_filtro=tipo,
    )
```

---

## 🎨 FASE 2: Frontend - UI Components

### 2.1 Crear Componente: `CommentsSection.tsx`

**Ubicación**: `frontend/src/components/CommentsSection.tsx`

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, AlertTriangle, Star, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface InteraccionUnificada {
  tipo: 'calificacion' | 'denuncia';
  interaccion_id: number;
  puesto_id: number;
  usuario_id: string | null;
  puntuacion: number | null;
  texto: string | null;
  fecha: string;
  precio_detectado: number | null;
  estado: string | null;
}

interface ListaInteraccionesPuestoResponse {
  puesto_id: number;
  total_calificaciones: number;
  promedio_estrellas: number;
  total_denuncias: number;
  denuncias_pendientes: number;
  interacciones: InteraccionUnificada[];
}

interface CommentsSectionProps {
  puestoId: number;
  className?: string;
}

export function CommentsSection({ puestoId, className = '' }: CommentsSectionProps) {
  const [interacciones, setInteracciones] = useState<ListaInteraccionesPuestoResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'calificacion' | 'denuncia'>('todas');

  useEffect(() => {
    cargarInteracciones();
  }, [puestoId, filtroTipo]);

  const cargarInteracciones = async () => {
    try {
      setCargando(true);
      const params = new URLSearchParams();
      if (filtroTipo !== 'todas') {
        params.append('tipo', filtroTipo);
      }
      
      const response = await fetch(
        `/api/interaccion/interacciones/puesto/${puestoId}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al cargar interacciones');
      }
      
      const data = await response.json();
      setInteracciones(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className={`${className} flex justify-center items-center py-8`}>
        <p className="text-gray-500">Cargando comentarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex justify-center items-center py-8`}>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!interacciones || interacciones.interacciones.length === 0) {
    return (
      <div className={`${className} flex justify-center items-center py-8`}>
        <p className="text-gray-500">No hay comentarios aún</p>
      </div>
    );
  }

  const filtroInteracciones = interacciones.interacciones.filter((i) => {
    if (filtroTipo === 'todas') return true;
    return i.tipo === filtroTipo;
  });

  return (
    <div className={className}>
      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Card className="p-3 bg-blue-50">
          <p className="text-xs text-gray-600">Calificaciones</p>
          <p className="text-lg font-bold text-blue-600">
            {interacciones.total_calificaciones}
          </p>
          {interacciones.promedio_estrellas > 0 && (
            <p className="text-xs text-yellow-600">
              ⭐ {interacciones.promedio_estrellas.toFixed(1)}
            </p>
          )}
        </Card>
        
        <Card className="p-3 bg-red-50">
          <p className="text-xs text-gray-600">Denuncias</p>
          <p className="text-lg font-bold text-red-600">
            {interacciones.total_denuncias}
          </p>
          {interacciones.denuncias_pendientes > 0 && (
            <p className="text-xs text-orange-600">
              ⚠️ {interacciones.denuncias_pendientes} pendientes
            </p>
          )}
        </Card>

        <Card className="p-3 bg-purple-50">
          <p className="text-xs text-gray-600">Total</p>
          <p className="text-lg font-bold text-purple-600">
            {interacciones.interacciones.length}
          </p>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {(['todas', 'calificacion', 'denuncia'] as const).map((tipo) => (
          <button
            key={tipo}
            onClick={() => setFiltroTipo(tipo)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filtroTipo === tipo
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tipo === 'todas' && 'Todas'}
            {tipo === 'calificacion' && 'Calificaciones'}
            {tipo === 'denuncia' && 'Denuncias'}
          </button>
        ))}
      </div>

      {/* Lista de Interacciones */}
      <div className="space-y-3">
        {filtroInteracciones.map((interaccion) => (
          <Card
            key={`${interaccion.tipo}-${interaccion.interaccion_id}`}
            className={`p-4 border-l-4 ${
              interaccion.tipo === 'calificacion'
                ? 'border-l-yellow-500 bg-yellow-50'
                : 'border-l-red-500 bg-red-50'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {interaccion.tipo === 'calificacion' ? (
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={
                          i < (interaccion.puntuacion || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle size={16} />
                    <span className="text-xs font-bold">DENUNCIA</span>
                  </div>
                )}
              </div>

              {interaccion.tipo === 'denuncia' && (
                <Badge
                  variant={
                    interaccion.estado === 'Pendiente'
                      ? 'destructive'
                      : interaccion.estado === 'Revisado'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {interaccion.estado}
                </Badge>
              )}
            </div>

            {/* Contenido */}
            <div className="mb-2">
              {interaccion.texto && (
                <p className="text-sm text-gray-700">{interaccion.texto}</p>
              )}
            </div>

            {/* Detalles */}
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <User size={14} />
                <span>{interaccion.usuario_id?.slice(0, 8) || 'Anónimo'}...</span>
              </div>

              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{new Date(interaccion.fecha).toLocaleDateString()}</span>
              </div>

              {interaccion.tipo === 'denuncia' && interaccion.precio_detectado && (
                <div className="font-semibold text-red-600">
                  Bs. {interaccion.precio_detectado.toFixed(2)}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 2.2 Integrar en `MarketCard.tsx`

**Añadir a las props:**

```typescript
import { CommentsSection } from './CommentsSection';

// En el componente MarketCard, agregar un state para mostrar/ocultar comentarios:
const [mostrarComentarios, setMostrarComentarios] = useState(false);

// Agregar botón en la UI:
<button
  onClick={() => setMostrarComentarios(!mostrarComentarios)}
  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
>
  {mostrarComentarios ? 'Ocultar' : 'Ver'} comentarios
</button>

// Mostrar la sección cuando sea necesario:
{mostrarComentarios && (
  <CommentsSection puestoId={puesto.id} className="mt-4" />
)}
```

---

## 📊 FASE 3: Base de Datos - Validación

### 3.1 SQL para Crear la Vista (Ya Creada)

```sql
CREATE VIEW public.vista_interacciones
WITH (security_invoker = on) AS
SELECT
  'calificacion'::text as tipo,
  c.id as interaccion_id,
  c.puesto_id,
  c.usuario_id,
  c.estrellas as puntuacion,
  c.comentario as texto,
  c.fecha_registro as fecha,
  NULL::numeric as precio_detectado,
  NULL::text as estado
FROM calificaciones c
UNION ALL
SELECT
  'denuncia'::text as tipo,
  d.id as interaccion_id,
  d.puesto_id,
  d.usuario_id,
  NULL::integer as puntuacion,
  d.comentario as texto,
  d.fecha_registro as fecha,
  d.precio_detectado,
  d.estado
FROM denuncias_sobreprecio d;
```

### 3.2 Validar Permisos en Supabase

```sql
-- Verificar que la vista está accesible
SELECT * FROM public.vista_interacciones LIMIT 5;

-- Verificar estadísticas de la vista
SELECT 
  tipo, 
  COUNT(*) as total,
  AVG(CAST(puntuacion AS FLOAT)) as promedio_calificacion
FROM public.vista_interacciones
GROUP BY tipo;
```

### 3.3 Agregar Políticas RLS (Si es necesario)

```sql
-- Permitir lectura pública de la vista (considerando que ya tiene security_invoker)
ALTER TABLE public.vista_interacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica" ON public.vista_interacciones
  FOR SELECT
  USING (true);
```

---

## 🔄 Flujo de Implementación Completo

```
1. Usuario abre detalle de un puesto
   ↓
2. Frontend carga el componente CommentsSection
   ↓
3. CommentsSection hace GET a /interaccion/interacciones/puesto/{id}
   ↓
4. Backend consulta vista_interacciones vía supabase.table()
   ↓
5. Retorna objeto ListaInteraccionesPuestoResponse
   ↓
6. Frontend renderiza:
   - Estadísticas (total, promedio, denuncias)
   - Filtros (todas, calificaciones, denuncias)
   - Lista de interacciones con diseño diferenciado
```

---

## 📝 Checklist de Implementación

### Backend
- [ ] Agregar modelos en `app/models/interaccion.py`
- [ ] Agregar función `obtener_interacciones_puesto()` en `app/services/interaccion_service.py`
- [ ] Agregar endpoint en `app/routers/interaccion.py`
- [ ] Testear endpoint localmente: `GET /interaccion/interacciones/puesto/1`
- [ ] Validar respuesta con datos reales

### Frontend
- [ ] Crear `CommentsSection.tsx`
- [ ] Integrar en `MarketCard.tsx`
- [ ] Testear carga de datos
- [ ] Testear filtros
- [ ] Responsive design en móvil

### Base de Datos
- [ ] Confirmar vista creada: `SELECT * FROM vista_interacciones`
- [ ] Verificar RLS y permisos
- [ ] Hacer backup antes de cambios en producción

### Testing
- [ ] Calificaciones sin denuncias
- [ ] Denuncias sin calificaciones
- [ ] Mezcla de ambas
- [ ] Paginación (límite de 50)
- [ ] Filtros por tipo
- [ ] Error handling

---

## 🚀 Mejoras Futuras

1. **Autenticación de comentarios**: Mostrar si es vendedora/comprador
2. **Respuestas a denuncias**: Permitir que vendedoras respondan
3. **Upvotes/Downvotes**: Sistema de utilidad en comentarios
4. **Reportar abuso**: Flag para comentarios inapropiados
5. **Búsqueda y sort avanzado**: Por fecha, relevancia, estado
6. **Notificaciones**: Alertar a vendedoras de denuncias
7. **Analytics**: Dashboard de estadísticas por puesto

---

## 📚 Referencias

- Documentación: [ANALISIS_MODULO_INTERACCION.md](./ANALISIS_MODULO_INTERACCION.md)
- Base de Datos: [database_structure.md](./database_structure.md)
- Cambios Anteriores: [CAMBIOS_IMPLEMENTADOS.md](./CAMBIOS_IMPLEMENTADOS.md)
