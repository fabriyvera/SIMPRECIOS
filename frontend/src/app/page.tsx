// src/app/page.tsx  ← SIN "use client"
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import HomeClient from "@/components/HomeClient";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);


  const { data: markets, error } = await supabase
    .from("markets")
    .select("*");

  if (error) {
    console.error("Supabase error:", error.message);
  }

  // Por ahora pasa los datos mockeados (HomeClient los tiene internamente)
  // Cuando la DB esté lista, pasarás: <HomeClient initialMarkets={markets} />
  return <HomeClient />;
}