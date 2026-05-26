# Plan de Cambios: Integración Completa de Autenticación y Persistencia de Datos

## Resumen
Implementar autenticación de usuario con routing dinámico basado en rol, persistencia de calificaciones y denuncias en BD, y mejoras en la UI del navbar.

## Cambios a Realizar

### 1. Mejoras en Autenticación y Navbar

#### Archivo: `frontend/src/components/Navbar.tsx`
**Cambios:**
- Obtener usuario actual de Supabase
- Mostrar nombre del usuario en la parte superior derecha cuando está logueado
- Ocultar botones "Iniciar Sesión" y "Registrarse" cuando usuario está autenticado
- Agregar botón de logout (cerrar sesión)
- Agregar avatar o inicial del usuario

**Flujo:**
```
Si usuario logueado:
  - Mostrar: [Nombre Usuario] [Avatar] [Logout]
  
Si usuario no logueado:
  - Mostrar: [Iniciar Sesión] [Registrarse]
```

---

### 2. Eliminar Botón de Vendedor de Página Principal

#### Archivo: `frontend/src/components/HomeClient.tsx`
**Cambios:**
- Remover botón "Modo Vendedor" de la navbar
- Remover la lógica de `isVendorMode` y `onToggleVendorMode` de presentación (mantener en backend)
- El acceso al panel de vendedor será automático según el rol en la BD

---

### 3. Routing Dinámico Basado en Rol

#### Archivos afectados:
- `frontend/src/components/HomeClient.tsx`
- `frontend/src/components/LoginView.tsx`
- `frontend/src/types/index.ts`

**Cambios:**

**LoginView.tsx:**
- Al iniciar sesión exitosamente, obtener el rol del usuario desde la BD (tabla profiles)
- Redirigir automáticamente:
  - Si rol = 'Comprador' → Vista home (MarketGrid)
  - Si rol = 'Vendedora' → Panel de Vendedor (lista de puestos)

**HomeClient.tsx:**
- Obtener sesión de Supabase al montar
- Hacer query a tabla `profiles` para obtener rol del usuario
- Guardar en estado: `sessionUser` (con id, nombre, rol)
- Usar el rol para determinar vista inicial y disponibilidad de funciones
- En vendedor: mostrar solo panel de vendedor (sin opción de volver a comprador)

**types/index.ts:**
- Extender interfaz `SessionUser` con el campo `rol: 'Vendedora' | 'Comprador'`

---

### 4. Persistencia de Calificaciones y Denuncias

#### Cambios en Backend (si es necesario):
- Los endpoints ya están configurados para guardar en BD
- Verificar que el backend guarde correctamente en tablas:
  - `calificaciones`: usuario_id, puesto_id, estrellas, comentario
  - `denuncias_sobreprecio`: usuario_id, puesto_id, producto_id, precio_detectado, comentario

#### Cambios en Frontend:

**Archivo: `frontend/src/hooks/useInteraccion.ts`**
- Hooks ya están correctos para enviar datos al backend
- Confirmar que manejan errores de BD correctamente

**Archivo: `frontend/src/components/MarketCard.tsx`**
- Ya integrado con hooks
- Validar que datos se persisten en BD después de submit

**Archivo: `frontend/src/services/api/interaccion.ts`**
- Confirmar mapeo correcto de campos:
  - CalificarRequest: usuario_id, estrellas, comentario
  - DenunciarRequest: usuario_id, producto_id, precio_cobrado, motivo

---

## Detalles de Implementación

### Obtener Rol del Usuario

```typescript
// En HomeClient.tsx o LoginView.tsx
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre_completo, rol')
    .eq('id', session.user.id)
    .single();
  
  // profile.rol será 'Comprador' o 'Vendedora'
}
```

### Flujo de Login

1. Usuario ingresa email y contraseña en LoginView
2. Backend autentica con Supabase Auth
3. LoginView obtiene sesión y perfil (rol)
4. Si rol = 'Comprador' → navegar a 'home'
5. Si rol = 'Vendedora' → navegar a 'vendor'

### Persistencia de Datos

1. Al calificar: POST /interaccion/puestos/{puesto_id}/calificar
   - Datos guardados en tabla `calificaciones`
   - Usuario_id: obtenido de sesión
   
2. Al denunciar: POST /interaccion/puestos/{puesto_id}/denunciar
   - Datos guardados en tabla `denuncias_sobreprecio`
   - Usuario_id: obtenido de sesión

---

## Orden de Implementación

1. Actualizar tipos TypeScript (SessionUser con rol)
2. Modificar LoginView para obtener rol y redirigir
3. Actualizar HomeClient para usar SessionUser y rol
4. Modificar Navbar para mostrar usuario y logout
5. Remover botón de Vendedor
6. Hacer llamadas de prueba para verificar persistencia

---

## Datos de Prueba

Usuarios en BD:
- Email: usuario@test.com → Rol: Comprador
- Email: vendedor@test.com → Rol: Vendedora
- (Según lo que exista en tu base de datos)

---

## Validaciones

- Usuario debe estar logueado para calificar y denunciar
- Rol debe ser 'Comprador' o 'Vendedora'
- Datos deben guardarse en BD y recuperarse en siguientes sesiones
- Logout debe limpiar estado y volver a vista no autenticada
