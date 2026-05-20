# Análisis: Módulo de Interacción - Alineación con Base de Datos

## Resumen Ejecutivo
Se encontraron **7 problemas críticos** en el módulo de interacción que impiden su correcto funcionamiento. Estos incluyen errores de tipeo, referencias a tablas inexistentes y tipos de datos incorrectos.

---

## Problemas Encontrados

### 🔴 CRÍTICO 1: Error de Tipeo en Nombre de Columna
**Ubicación**: `app/services/interaccion_service.py` - función `calificar_puesto()`  
**Líneas**: 52, 78  
**Problema**: Se usa `"es_rellas"` pero la columna en la BD se llama `"estrellas"`

```python
# INCORRECTO
nueva_calificacion = {
    "puesto_id": puesto_id,
    "usuario_id": str(data.usuario_id),
    "es_rellas": data.estrellas,  # ❌ Typo: debería ser "estrellas"
    "comentario": data.comentario,
}

# Recalcular promedio
ratings_values = [float(r["es_rellas"]) for r in data_list...]  # ❌ Mismo error
```

**Impacto**: Las calificaciones NO se guardarán correctamente.  
**Solución**: Cambiar `"es_rellas"` por `"estrellas"` en ambas líneas.

---

### 🔴 CRÍTICO 2: Tabla `user_favorites` No Existe en BD
**Ubicación**: `app/services/interaccion_service.py` - función `agregar_favorito()`  
**Problema**: El código intenta usar tabla `user_favorites` que NO existe en la estructura de BD

```python
# Línea 265
db.table("user_favorites").insert({
    "usuario_id": usuario_id,
    "puesto_id": puesto_id,
}).execute()
```

**BD Real**: Las tablas existentes relacionadas son:
- `denuncias`
- `denuncia_evidencias`
- `denuncia_estados`

**Solución**: Crear tabla `user_favorites` o usar una tabla de denuncias repropósito (opción menos recomendada).

---

### 🔴 CRÍTICO 3: Tabla `denuncias_guardadas` No Existe
**Ubicación**: `app/services/interaccion_service.py` - línea 243  
**Problema**: Se usa `denuncias_guardadas` pero la BD usa `denuncia_evidencias`

```python
# INCORRECTO
db.table("denuncias_guardadas").insert({  # ❌ Nombre incorrecto
    "denuncia_id": denuncia_id,
    "url_foto": data.url_evidencia,
}).execute()

# CORRECTO (según BD)
# Tabla: denuncia_evidencias
# Campos: id, denuncia_id, url_foto, subido_el
```

**Solución**: Usar `denuncia_evidencias` en lugar de `denuncias_guardadas`.

---

### 🔴 CRÍTICO 4: Error de Tipeo en Tabla `denuncia_estados`
**Ubicación**: `app/services/interaccion_service.py` - línea 248  
**Problema**: Se usa `"demuncias_estados"` (con extra 'm')

```python
# INCORRECTO
db.table("demuncias_estados").insert({  # ❌ "demuncias" vs "denuncia"
    "denuncia_id": denuncia_id,
    "estado": "alerta_sobreprecio",
    "comentario_intendencia": f"...",
}).execute()

# CORRECTO (según BD)
# Tabla: denuncia_estados
```

**Solución**: Cambiar `"demuncias_estados"` por `"denuncia_estados"`.

---

### 🟡 CRÍTICO 5: Campo `contexto` No Existe en `puesto_ratings`
**Ubicación**: `app/services/interaccion_service.py` - línea 108  
**Problema**: Se intenta insertar un campo `contexto` que no existe en la tabla

```python
# INCORRECTO
db.table("puesto_ratings").insert({
    "puesto_id": puesto_id,
    "usuario_id": str(data.usuario_id),
    "es_rellas": None,
    "comentario": f"Verificación: ...",
    "contexto": "verificacion_precio",  # ❌ Campo no existe en BD
}).execute()
```

**BD Real - `puesto_ratings`**: Solo tiene columnas: `id, puesto_id, usuario_id, estrellas, comentario`

**Solución**: 
- Opción 1: Remover el campo `contexto` y usar el campo `comentario` con un prefijo para distinguir
- Opción 2: Crear un registro en una tabla separada (si la lógica lo justifica)

---

### 🟡 CRÍTICO 6: Tipo de Dato Incorrecto en Modelos
**Ubicación**: `app/models/interaccion.py` - Líneas 20, 26, 35  
**Problema**: Se usa `UUID4` para `producto_id` pero en BD es `integer`

```python
# INCORRECTO
class VerificarPrecioRequest(BaseModel):
    producto_id: UUID4  # ❌ En BD es integer

class DenunciarRequest(BaseModel):
    producto_id: UUID4  # ❌ En BD es integer
```

**BD Real**:
- `productos_carnicos.id` → integer
- `precios_actuales.producto_id` → integer

**Solución**: Cambiar `UUID4` a `int` en los modelos de request.

---

### 🟡 CRÍTICO 7: Campo `nombre_puesto` No Existe en `puestos_venta`
**Ubicación**: `app/services/interaccion_service.py` - línea 32  
**Problema**: Se intenta acceder a `nombre_puesto` pero `puestos_venta` no tiene ese campo

```python
# Línea 32
puesto = db.table("puestos_venta").select("id, nombre_puesto").eq("id", puesto_id).single().execute()
# ❌ "nombre_puesto" no existe en puestos_venta
```

**BD Real - `puestos_venta`**: Solo tiene `id, vendedora_id, sector_id, zona_id`

**Solución**: 
- Para obtener información del puesto, necesitarías hacer un JOIN con `mercados` (si zona_id es sector_id)
- O almacenar el nombre en una tabla separada de información de puestos

---

## Resumen de Cambios Necesarios

| Problema | Tipo | Ubicación | Acción |
|----------|------|-----------|--------|
| `es_rellas` → `estrellas` | Typo | interaccion_service.py | Cambiar 2 líneas |
| `user_favorites` | Tabla faltante | Crear o redesignar | CREATE TABLE en BD |
| `denuncias_guardadas` → `denuncia_evidencias` | Nombre incorrecto | interaccion_service.py | Cambiar nombre tabla |
| `demuncias_estados` → `denuncia_estados` | Typo | interaccion_service.py | Cambiar nombre tabla |
| Campo `contexto` | Campo inexistente | interaccion_service.py | Remover o cambiar lógica |
| `UUID4` → `int` para producto_id | Tipo incorrecto | interaccion.py | Cambiar tipo en modelos |
| `nombre_puesto` | Campo inexistente | interaccion_service.py | Remover o usar JOIN |

---

## Próximos Pasos

1. **Crear tabla `user_favorites`** en Supabase
2. **Correcciones inmediatas** en el código (typos y nombres)
3. **Revisar lógica de verificación de transparencia** - probablemente necesita rediseñarse
4. **Testing exhaustivo** del módulo una vez corregido
5. Luego: Integración con frontend

