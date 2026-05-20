-- ================================================================
-- CREATE TABLE: user_favorites
-- Descripción: Tabla para almacenar los puestos marcados como favoritos por los usuarios
-- Relación con: profiles (usuario_id), puestos_venta (puesto_id)
-- ================================================================

CREATE TABLE user_favorites (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    puesto_id INTEGER NOT NULL REFERENCES puestos_venta(id) ON DELETE CASCADE,
    agregado_el TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Restricción: un usuario solo puede tener un puesto como favorito una vez
    UNIQUE(usuario_id, puesto_id),
    
    -- Índices para optimizar búsquedas
    INDEX idx_user_favorites_usuario_id (usuario_id),
    INDEX idx_user_favorites_puesto_id (puesto_id)
);

-- Comentarios de documentación
COMMENT ON TABLE user_favorites IS 'Almacena la relación de puestos marcados como favoritos por cada usuario';
COMMENT ON COLUMN user_favorites.usuario_id IS 'ID del usuario que marcó el favorito (referencia a auth.users)';
COMMENT ON COLUMN user_favorites.puesto_id IS 'ID del puesto marcado como favorito (referencia a puestos_venta)';
COMMENT ON COLUMN user_favorites.agregado_el IS 'Fecha y hora en que se agregó el favorito (UTC)';

-- ================================================================
-- NOTAS DE IMPLEMENTACIÓN
-- ================================================================
-- 1. La tabla usa soft-delete implícito mediante ON DELETE CASCADE
--    Si se elimina un usuario, se eliminan automáticamente sus favoritos
-- 2. La restricción UNIQUE garantiza que no haya duplicados
-- 3. Los índices optimizan las búsquedas por usuario_id y puesto_id
-- 4. Todos los timestamps están en UTC (con time zone)
-- ================================================================
