# Guía de Testing: Vista Interacciones Unificadas

## 🧪 Pruebas Manuales

### 1. Verificar que la Vista SQL existe

**En Supabase SQL Editor:**
```sql
-- Verificar que la vista existe
SELECT * FROM public.vista_interacciones LIMIT 10;

-- Debe retornar:
-- tipo | interaccion_id | puesto_id | usuario_id | puntuacion | texto | fecha | precio_detectado | estado
```

**Resultado esperado:**
- Si la vista NO existe: Error "relation 'vista_interacciones' does not exist"
- Si existe: Lista de calificaciones y denuncias

---

### 2. Testear Endpoint Backend

**URL Base:** `http://localhost:8000`

#### Caso 1: Obtener todas las interacciones de un puesto
```bash
curl -X GET "http://localhost:8000/api/interaccion/puestos/1/interacciones" \
  -H "Content-Type: application/json"
```

**Respuesta esperada (200 OK):**
```json
{
  "puesto_id": 1,
  "total_calificaciones": 5,
  "promedio_estrellas": 4.2,
  "total_denuncias": 2,
  "denuncias_pendientes": 1,
  "interacciones": [...]
}
```

**Errores posibles:**
- 404: "Puesto no encontrado" → Usar un puesto_id que exista
- 500: Error del servidor → Verificar logs de FastAPI

#### Caso 2: Filtrar solo calificaciones
```bash
curl -X GET "http://localhost:8000/api/interaccion/puestos/1/interacciones?tipo=calificacion" \
  -H "Content-Type: application/json"
```

**Resultado esperado:**
- Solo interacciones con `"tipo": "calificacion"`
- denuncias_pendientes = 0

#### Caso 3: Filtrar solo denuncias
```bash
curl -X GET "http://localhost:8000/api/interaccion/puestos/1/interacciones?tipo=denuncia" \
  -H "Content-Type: application/json"
```

**Resultado esperado:**
- Solo interacciones con `"tipo": "denuncia"`
- total_calificaciones = 0

#### Caso 4: Paginación
```bash
# Primera página (0-49)
curl -X GET "http://localhost:8000/api/interaccion/puestos/1/interacciones?limite=50&offset=0"

# Segunda página (50-99)
curl -X GET "http://localhost:8000/api/interaccion/puestos/1/interacciones?limite=50&offset=50"

# Con filtro
curl -X GET "http://localhost:8000/api/interaccion/puestos/1/interacciones?limite=20&offset=0&tipo=denuncia"
```

**Validaciones:**
- Los elementos no deben repetirse entre páginas
- Offset fuera de rango debe retornar vacío

#### Caso 5: Límite inválido
```bash
curl -X GET "http://localhost:8000/api/interaccion/puestos/1/interacciones?limite=200"
```

**Resultado esperado:** Automáticamente se ajusta a 100 (máximo)

---

### 3. Testear Componente Frontend

#### Paso 1: Verificar que CommentsSection.tsx se importa correctamente
- Abrir DevTools (F12)
- Ir a Console
- No debe haber errores de import

#### Paso 2: Navegar a un puesto y abrir MarketCard
- Ir a la página principal
- Hacer clic en un puesto (MarketCard)
- Hacer scroll hacia abajo
- Ver botón "Ver comentarios y denuncias"

#### Paso 3: Hacer clic en el botón
- El botón debe cambiar de estado (expandirse)
- Debe aparecer "Cargando comentarios..."

#### Paso 4: Esperar a que carguen los datos
- Si hay interacciones: Mostrar tarjetas de estadísticas + lista
- Si NO hay: Mostrar "No hay comentarios aún"

#### Paso 5: Probar Filtros
- Hacer clic en "Calificaciones" → Solo debe mostrar calificaciones
- Hacer clic en "Denuncias" → Solo debe mostrar denuncias
- Hacer clic en "Todas" → Mostrar todas nuevamente

#### Paso 6: Validar visualización
- **Calificaciones**: Mostrar estrellas (⭐)
- **Denuncias**: Mostrar badge de estado (Pendiente/Revisado/Desestimado)
- **Fecha**: Formato localizado (ej: "01 jun 2026")
- **Usuario**: Primeros 8 caracteres del UUID

---

## 🔍 Validaciones en DevTools

### Console
```javascript
// Verificar que CommentsSection está disponible
console.log(typeof CommentsSection) // debe retornar 'function'

// Verificar que la API responde
fetch('/api/interaccion/puestos/1/interacciones')
  .then(r => r.json())
  .then(data => console.log(data))
```

### Network Tab
- Debe haber una solicitud a `/api/interaccion/puestos/{id}/interacciones`
- Status debe ser 200
- Response debe incluir: `total_calificaciones`, `promedio_estrellas`, `interacciones`

### Performance
- Tiempo de respuesta < 500ms (ideal)
- Tiempo < 1s (aceptable)
- Si > 1s: Revisar cantidad de datos

---

## 📊 Casos de Prueba Completos

### Escenario 1: Puesto sin interacciones
**Setup:** Seleccionar un puesto recién creado sin denuncias ni calificaciones

**Pasos:**
1. Abrir MarketCard del puesto
2. Hacer clic en "Ver comentarios y denuncias"
3. Ver CommentsSection

**Resultado esperado:**
- ✅ "No hay comentarios aún"
- ✅ Todas las estadísticas en 0
- ✅ Sin botones de filtro

---

### Escenario 2: Puesto solo con calificaciones
**Setup:** Un puesto con 5 calificaciones, 0 denuncias

**Pasos:**
1. Abrir CommentsSection
2. Notar estadísticas
3. Filtrar por "Denuncias"

**Resultado esperado:**
- ✅ Tarjeta de Calificaciones: 5
- ✅ Tarjeta de Denuncias: 0
- ✅ Tarjeta de Total: 5
- ✅ Al filtrar Denuncias: "No hay denuncias para mostrar"

---

### Escenario 3: Puesto solo con denuncias
**Setup:** Un puesto con 0 calificaciones, 3 denuncias (1 pendiente, 2 revisadas)

**Pasos:**
1. Abrir CommentsSection
2. Observar estadísticas
3. Filtrar por "Calificaciones"

**Resultado esperado:**
- ✅ Tarjeta de Calificaciones: 0
- ✅ Tarjeta de Denuncias: 3
- ✅ Tarjeta de Pendientes: 1
- ✅ Al filtrar Calificaciones: "No hay calificaciones para mostrar"

---

### Escenario 4: Paginación
**Setup:** Un puesto con > 50 interacciones

**Pasos:**
1. Abrir CommentsSection (carga primeros 50)
2. Hacer scroll en la lista
3. Verificar que se muestren 50 items

**Resultado esperado:**
- ✅ Se muestran máximo 50 items
- ✅ Scroll funciona correctamente
- ✅ Los primeros 50 tienen fechas más recientes

---

## ⚠️ Casos de Error

### Error 1: Puesto no existe
```bash
curl http://localhost:8000/api/interaccion/puestos/99999/interacciones
```
**Resultado:** 404 "Puesto no encontrado" ✅

### Error 2: Parámetro tipo inválido
```bash
curl "http://localhost:8000/api/interaccion/puestos/1/interacciones?tipo=invalid"
```
**Resultado:** El parámetro se ignora (campo vacío en regex no valida) ✅

### Error 3: Límite negativo
```bash
curl "http://localhost:8000/api/interaccion/puestos/1/interacciones?limite=-5"
```
**Resultado:** Se ajusta automáticamente a 50 ✅

### Error 4: Offset negativo
```bash
curl "http://localhost:8000/api/interaccion/puestos/1/interacciones?offset=-10"
```
**Resultado:** Se ajusta automáticamente a 0 ✅

---

## 📋 Checklist Final

- [ ] Vista SQL `vista_interacciones` creada y accesible
- [ ] Backend endpoint retorna respuesta correcta
- [ ] Filtros por tipo funcionan
- [ ] Paginación funciona
- [ ] Validaciones de límites funcionan
- [ ] CommentsSection se importa sin errores
- [ ] Botón "Ver comentarios y denuncias" aparece en MarketCard
- [ ] CommentsSection se expande/colapsa correctamente
- [ ] Datos se cargan en CommentsSection
- [ ] Estadísticas muestran valores correctos
- [ ] Filtros funcionan en UI
- [ ] Estilos responsive en móvil
- [ ] Manejo de errores muestra mensajes
- [ ] Loading states aparecen
- [ ] Fechas están formateadas correctamente
- [ ] Scroll en lista funciona
- [ ] No hay errores en console

---

## 🚀 Deployment

Antes de pasar a producción:

1. **Backend:**
   - [ ] Ejecutar tests unitarios
   - [ ] Verificar que todos los imports están disponibles
   - [ ] Revisar que la vista existe en BD de producción

2. **Frontend:**
   - [ ] Build sin warnings: `npm run build`
   - [ ] No hay console errors
   - [ ] Componente se renderiza correctamente

3. **Database:**
   - [ ] Vista creada en Supabase producción
   - [ ] RLS configurado correctamente
   - [ ] Permisos apropiados para lectura

---

## 🔧 Troubleshooting

**Problema:** CommentsSection no carga datos
- [ ] Verificar que la URL del endpoint es correcta
- [ ] Verificar en Network tab que hay respuesta 200
- [ ] Revisar console de errores

**Problema:** Estilos no se aplican
- [ ] Verificar que Badge y Card están importados
- [ ] Revisar que Tailwind está configurado correctamente

**Problema:** Filtros no funcionan
- [ ] Verificar que filtroTipo state se actualiza
- [ ] Revisar que parámetro 'tipo' se envía en URL

**Problema:** Datos desactualizados
- [ ] Verificar que useEffect tiene dependencies correctas
- [ ] Intentar recargar la página (F5)

