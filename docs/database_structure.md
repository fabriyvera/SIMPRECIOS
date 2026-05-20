# Database Structure: Supabase Schema

This document describes the current database schema for the application. It includes all tables, their columns, and data types based on the export from Supabase.

## TABLES:

## calificaciones
create table public.calificaciones (
  id serial not null,
  usuario_id uuid not null,
  puesto_id integer not null,
  estrellas integer not null,
  comentario text null,
  fecha_registro timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint calificaciones_pkey primary key (id),
  constraint calificaciones_usuario_id_puesto_id_key unique (usuario_id, puesto_id),
  constraint calificaciones_puesto_id_fkey foreign KEY (puesto_id) references puestos_venta (id) on delete CASCADE,
  constraint calificaciones_usuario_id_fkey foreign KEY (usuario_id) references profiles (id) on delete CASCADE,
  constraint calificaciones_estrellas_check check (
    (
      (estrellas >= 1)
      and (estrellas <= 5)
    )
  )
) TABLESPACE pg_default;

## canastas_favoritas
create table public.canastas_favoritas (
  id uuid not null default extensions.uuid_generate_v4 (),
  usuario_id uuid not null,
  nombre_canasta text not null default 'Mi Canasta Frecuente'::text,
  cantidad_familiares integer null default 1,
  presupuesto_semanal_bs numeric(10, 2) null,
  items jsonb not null,
  fecha_creacion timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint canastas_favoritas_pkey primary key (id),
  constraint canastas_favoritas_usuario_id_fkey foreign KEY (usuario_id) references profiles (id) on delete CASCADE,
  constraint canastas_favoritas_cantidad_familiares_check check ((cantidad_familiares > 0))
) TABLESPACE pg_default;

## categorias_productos
create table public.categorias_productos (
  id serial not null,
  nombre text not null,
  descripcion text null,
  fecha_registro timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint categorias_productos_pkey primary key (id),
  constraint categorias_productos_nombre_key unique (nombre)
) TABLESPACE pg_default;

## denuncias_sobreprecio
create table public.denuncias_sobreprecio (
  id serial not null,
  usuario_id uuid null,
  puesto_id integer not null,
  producto_id integer not null,
  precio_detectado numeric(10, 2) not null,
  comentario text null,
  estado text null default 'Pendiente'::text,
  fecha_registro timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint denuncias_sobreprecio_pkey primary key (id),
  constraint denuncias_sobreprecio_producto_id_fkey foreign KEY (producto_id) references productos_mercado (id) on delete CASCADE,
  constraint denuncias_sobreprecio_puesto_id_fkey foreign KEY (puesto_id) references puestos_venta (id) on delete CASCADE,
  constraint denuncias_sobreprecio_usuario_id_fkey foreign KEY (usuario_id) references profiles (id) on delete set null,
  constraint denuncias_sobreprecio_estado_check check (
    (
      estado = any (
        array[
          'Pendiente'::text,
          'Revisado'::text,
          'Desestimado'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

## historial_precios
create table public.historial_precios (
  id serial not null,
  puesto_id integer not null,
  producto_id integer not null,
  precio numeric(10, 2) not null,
  fecha_registro timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint historial_precios_pkey primary key (id),
  constraint historial_precios_producto_id_fkey foreign KEY (producto_id) references productos_mercado (id) on delete CASCADE,
  constraint historial_precios_puesto_id_fkey foreign KEY (puesto_id) references puestos_venta (id) on delete CASCADE
) TABLESPACE pg_default;

## mercados
create table public.mercados (
  id serial not null,
  nombre text not null,
  direccion text not null,
  latitud numeric(10, 8) not null,
  longitud numeric(11, 8) not null,
  telefono_contacto text null,
  horario_apertura time without time zone null,
  horario_cierre time without time zone null,
  fecha_registro timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint mercados_pkey primary key (id)
) TABLESPACE pg_default;

## precios_referenciales
create table public.precios_referenciales (
  id serial not null,
  producto_id integer not null,
  precio_referencial_gob numeric(10, 2) not null,
  fecha_vigencia date not null default CURRENT_DATE,
  constraint precios_referenciales_pkey primary key (id),
  constraint precios_referenciales_producto_id_fkey foreign KEY (producto_id) references productos_mercado (id) on delete CASCADE
) TABLESPACE pg_default;

## productos_mercado
create table public.productos_mercado (
  id serial not null,
  subcategoria_id integer null,
  nombre_producto text not null,
  unidad_medida text not null default 'kg'::text,
  fecha_registro timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint productos_mercado_pkey primary key (id),
  constraint productos_mercado_subcategoria_id_fkey foreign KEY (subcategoria_id) references subcategorias_productos (id) on delete set null
) TABLESPACE pg_default;

## profiles
create table public.profiles (
  id uuid not null,
  nombre_completo text not null,
  telefono text null,
  rol text not null,
  es_verificado boolean null default false,
  fecha_registro timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_rol_check check (
    (
      rol = any (array['Comprador'::text, 'Vendedora'::text])
    )
  )
) TABLESPACE pg_default;

## puestos_favoritos
create table public.puestos_favoritos (
  id serial not null,
  usuario_id uuid not null,
  puesto_id integer not null,
  fecha_agregado timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint puestos_favoritos_pkey primary key (id),
  constraint puestos_favoritos_usuario_id_puesto_id_key unique (usuario_id, puesto_id),
  constraint puestos_favoritos_puesto_id_fkey foreign KEY (puesto_id) references puestos_venta (id) on delete CASCADE,
  constraint puestos_favoritos_usuario_id_fkey foreign KEY (usuario_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

## puestos_venta
create table public.puestos_venta (
  id serial not null,
  vendedora_id uuid not null,
  mercado_id integer null,
  nombre_puesto text not null,
  sector text not null,
  nro_puesto text null,
  calificacion_promedio numeric(3, 2) null default 5.00,
  esta_abierto boolean null default true,
  fecha_registro timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint puestos_venta_pkey primary key (id),
  constraint puestos_venta_mercado_id_fkey foreign KEY (mercado_id) references mercados (id) on delete set null,
  constraint puestos_venta_vendedora_id_fkey foreign KEY (vendedora_id) references profiles (id) on delete CASCADE,
  constraint puestos_venta_calificacion_promedio_check check (
    (
      (calificacion_promedio >= 1.00)
      and (calificacion_promedio <= 5.00)
    )
  )
) TABLESPACE pg_default;

## stock_vendedora
create table public.stock_vendedora (
  id serial not null,
  puesto_id integer not null,
  producto_id integer not null,
  precio_actual numeric(10, 2) not null,
  disponible boolean null default true,
  ultima_actualizacion timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint stock_vendedora_pkey primary key (id),
  constraint stock_vendedora_puesto_id_producto_id_key unique (puesto_id, producto_id),
  constraint stock_vendedora_producto_id_fkey foreign KEY (producto_id) references productos_mercado (id) on delete CASCADE,
  constraint stock_vendedora_puesto_id_fkey foreign KEY (puesto_id) references puestos_venta (id) on delete CASCADE,
  constraint stock_vendedora_precio_actual_check check ((precio_actual > (0)::numeric))
) TABLESPACE pg_default;

## subcategorias_productos
create table public.subcategorias_productos (
  id serial not null,
  categoria_id integer not null,
  nombre text not null,
  constraint subcategorias_productos_pkey primary key (id),
  constraint subcategorias_productos_categoria_id_nombre_key unique (categoria_id, nombre),
  constraint subcategorias_productos_categoria_id_fkey foreign KEY (categoria_id) references categorias_productos (id) on delete CASCADE
) TABLESPACE pg_default;