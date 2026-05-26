-- ================================================================
-- FIX PERMISSIONS: Dar permisos a las secuencias y tablas
-- Ejecutar estos comandos en la consola SQL de Supabase
-- ================================================================

-- Dar permisos de uso a las secuencias de todas las tablas interactivas
GRANT USAGE, SELECT ON SEQUENCE calificaciones_id_seq TO postgres, authenticated, anon, service_role;
GRANT USAGE, SELECT ON SEQUENCE denuncias_sobreprecio_id_seq TO postgres, authenticated, anon, service_role;
GRANT USAGE, SELECT ON SEQUENCE puestos_favoritos_id_seq TO postgres, authenticated, anon, service_role;

-- Dar permisos de INSERT en las tablas
GRANT INSERT ON TABLE calificaciones TO postgres, authenticated, anon, service_role;
GRANT INSERT ON TABLE denuncias_sobreprecio TO postgres, authenticated, anon, service_role;
GRANT INSERT ON TABLE puestos_favoritos TO postgres, authenticated, anon, service_role;

-- Dar permisos SELECT (para verificaciones)
GRANT SELECT ON TABLE calificaciones TO postgres, authenticated, anon, service_role;
GRANT SELECT ON TABLE denuncias_sobreprecio TO postgres, authenticated, anon, service_role;
GRANT SELECT ON TABLE puestos_favoritos TO postgres, authenticated, anon, service_role;

-- Dar permisos DELETE (para eliminar favoritos)
GRANT DELETE ON TABLE puestos_favoritos TO postgres, authenticated, anon, service_role;

-- Dar permisos UPDATE (por si acaso)
GRANT UPDATE ON TABLE calificaciones TO postgres, authenticated, anon, service_role;
GRANT UPDATE ON TABLE denuncias_sobreprecio TO postgres, authenticated, anon, service_role;

-- ================================================================
-- Si quieres ser más específico y solo dar permisos al anon key:
-- ================================================================
-- GRANT USAGE, SELECT ON SEQUENCE calificaciones_id_seq TO anon;
-- GRANT INSERT ON TABLE calificaciones TO anon;
-- GRANT SELECT ON TABLE calificaciones TO anon;
