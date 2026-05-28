// src/app/page.tsx 
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import HomeClient from "@/components/HomeClient";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 👤 RECONOCIMIENTO DE SESIÓN INMEDIATA EN EL SERVIDOR
  let serverRole = "Comprador";
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', session.user.id)
      .maybeSingle();
      
    if (profile?.rol) {
      serverRole = profile.rol;
    }
  }

  const { data: marketsData, error } = await supabase
    .from("puestos_venta")
    .select(`
      id,
      nombre_puesto,
      sector,
      nro_puesto,
      calificacion_promedio,
      esta_abierto,
      mercados (
        nombre,
        direccion,
        latitud,
        longitud
      ),
      stock_vendedora (
        precio_actual,
        disponible,
        productos_mercado (
          id,
          nombre_producto,
          unidad_medida
        )
      )
    `);

  if (error) {
    console.error("Supabase Sprint 2 Error:", error.message);
  }

  const formattedMarkets = marketsData?.map((puesto: any) => {
    const esCarne = puesto.sector?.toLowerCase().includes("carne");
    const imagenEstetica = esCarne
      ? "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500&auto=format&fit=crop&q=60"
      : "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60";
    
    return {
      id: puesto.id.toString(),
      name: puesto.nombre_puesto,
      category: puesto.sector,
      isOpen: puesto.esta_abierto,
      rating: parseFloat(puesto.calificacion_promedio) || 5.0,
      marketLocation: puesto.mercados?.nombre || "Mercado Local",
      description: esCarne
        ? "Carnes frescas de primera calidad"
        : "Frutas y verduras frescas del productor",
      products: puesto.stock_vendedora?.map((stock: any) => ({
        id: stock.productos_mercado?.id.toString(),
        name: stock.productos_mercado?.nombre_producto,
        price: parseFloat(stock.precio_actual),
        available: stock.disponible
      })) || [],
      color: puesto.sector === "Sector Carnes" ? "#ef4444" : "#0a6e34", 
      image: imagenEstetica,
      imageUrl: imagenEstetica,
      reviews: [],
    };
  }) || [];

  return <HomeClient initialMarkets={formattedMarkets} serverRole={serverRole} />;
}