# Plan: Calificaciones Dinámicas Basadas en Reseñas

## Problema Actual
- Las estrellas en el header del `MarketCard` son estáticas (mostradas en línea 318)
- Siempre muestra "(0 reseñas)" porque el array `market.reviews` está vacío
- El porcentaje de confiabilidad no se basa en reseñas reales

## Solución

### 1. **Obtener Interacciones Reales del Backend**
   - Llamar a `/api/interaccion/puestos/{puesto_id}/interacciones` al cargar el MarketCard
   - Extraer:
     - `promedio_estrellas`: Promedio real de calificaciones
     - `total_calificaciones`: Total de reseñas
     - `interacciones[]`: Array con todas las calificaciones

### 2. **Calcular Métricas**
   - **Reseñas Buenas**: Calificaciones >= 4 estrellas
   - **Reseñas Malas**: Calificaciones <= 2 estrellas
   - **Porcentaje de Confiabilidad**: `(reseñas_buenas / total_calificaciones) * 100`
     - Si total_calificaciones < 2: mostrar "Sin reseñas"
     - Aplicar color según confiabilidad (rojo < 50%, amarillo 50-75%, verde > 75%)

### 3. **Actualizar MarketCard**
   - Cargar interacciones en `useEffect` cuando se monta el componente
   - Mostrar el `promedio_estrellas` real en lugar de `market.rating`
   - Mostrar cantidad real de reseñas
   - Actualizar `transparencyScore` con el % de confiabilidad

### 4. **Actualizar Tipos**
   - Agregar a `ListaInteraccionesPuestoResponse`: `promedio_estrellas`, `total_calificaciones`, `interacciones[]`

## Archivos a Modificar
1. `frontend/src/components/MarketCard.tsx` - Cargar interacciones y mostrar datos reales
2. `frontend/src/types/index.ts` - Si es necesario extender tipos
3. `frontend/src/components/CommentsSection.tsx` - Ya está usando la API correcta
