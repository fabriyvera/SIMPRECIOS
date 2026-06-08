"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { History, RefreshCw, ShoppingBag, ArrowRight, CheckCircle, TrendingDown, TrendingUp, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Market } from "@/types";

interface SavedBasketsProps {
  markets: Market[];
  onModifyBasket?: (basket: any) => void; 
}

export function SavedBaskets({ markets, onModifyBasket }: SavedBasketsProps) {
  const [usuarioActivo, setUsuarioActivo] = useState<any>(null); // NUEVO: Estado del usuario
  const [baskets, setBaskets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null);
  const [recalculatedResults, setRecalculatedResults] = useState<Record<string, any>>({});

  useEffect(() => {
    verificarSesion();
  }, []);

  // 1. Primero verificamos quién es el usuario
  const verificarSesion = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      setUsuarioActivo(user);
      fetchBaskets(user.id); // Si hay usuario, buscamos SUS canastas
    } else {
      setIsLoading(false); // Si no hay usuario, apagamos la carga y mostramos el bloqueo visual
    }
  };

  // 2. Buscamos las canastas usando el ID real
  const fetchBaskets = async (userId: string) => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("canastas_favoritas")
        .select("*")
        .eq("usuario_id", userId) // USAMOS EL ID REAL AQUÍ
        .order("fecha_creacion", { ascending: false });

      if (error) throw error;
      setBaskets(data || []);
    } catch (error) {
      console.error("Error al cargar canastas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculate = (basket: any) => {
    setRecalculatingId(basket.id);
    
    setTimeout(() => {
      let newTotal = 0;
      const oldTotal = basket.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

      const updatedItems = basket.items.map((item: any) => {
        let bestPrice = item.unitPrice; 
        let currentMarket = item.marketName;

        markets.forEach((m) => {
          const prod = m.products.find((p) => p.name === item.productName);
          if (prod && prod.available && prod.price < bestPrice) {
            bestPrice = prod.price;
            currentMarket = m.name;
          }
        });

        const currentTotalPrice = item.quantity * bestPrice;
        newTotal += currentTotalPrice;

        return { ...item, newUnitPrice: bestPrice, newTotalPrice: currentTotalPrice, newMarket: currentMarket };
      });

      const difference = newTotal - oldTotal;

      setRecalculatedResults((prev) => ({
        ...prev,
        [basket.id]: { newTotal, oldTotal, difference, updatedItems }
      }));
      setRecalculatingId(null);
    }, 1500); 
  };

  // 3. BLOQUEO VISUAL: Si ya terminó de cargar y no hay usuario, mostramos el mensaje
  if (!isLoading && !usuarioActivo) {
    return (
      <div className="px-2 py-4 w-full">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">
            <History className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Mis Canastas Guardadas</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Recalcula tus compras frecuentes con precios de hoy.</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <History className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-xl font-extrabold text-slate-800 mb-2">Inicia sesión para continuar</h3>
          <p className="text-slate-500 font-medium max-w-sm mb-6">
            Debes tener una cuenta activa para poder guardar y recalcular tus canastas frecuentes.
          </p>
        </div>
      </div>
    );
  }

  // Si pasa la validación y hay usuario, renderizamos la lista normal
  return (
    <div className="px-2 py-4 w-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">
          <History className="w-6 h-6 text-slate-700" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Mis Canastas Guardadas</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Recalcula tus compras frecuentes con precios de hoy.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 text-slate-300 animate-spin" />
        </div>
      ) : baskets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <ShoppingBag className="w-12 h-12 mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 font-semibold">Aún no tienes canastas guardadas en tu perfil.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {baskets.map((basket) => {
            const isRecalculating = recalculatingId === basket.id;
            const result = recalculatedResults[basket.id];

            return (
              <div key={basket.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Cabecera de la Tarjeta */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800">{basket.nombre_canasta}</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-1">Guardada el {new Date(basket.fecha_creacion).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Presupuesto Inicial</p>
                    <p className="font-black text-slate-800">Bs. {basket.presupuesto_semanal_bs}</p>
                  </div>
                </div>

                {/* Área de Botones y Recálculo */}
                <div className="p-5">
                  {!result ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        onClick={() => handleRecalculate(basket)}
                        disabled={isRecalculating}
                        className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-sm transition-all"
                      >
                        {isRecalculating ? (
                          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Consultando...</>
                        ) : (
                          <><RefreshCw className="w-4 h-4 mr-2" /> Recalcular Hoy</>
                        )}
                      </Button>
                      <Button 
                        onClick={() => onModifyBasket?.(basket)}
                        disabled={isRecalculating}
                        variant="outline"
                        className="flex-1 h-12 border-2 border-slate-200 text-slate-600 hover:border-purple-500 hover:text-purple-600 font-bold rounded-xl bg-white transition-all"
                      >
                        <Edit className="w-4 h-4 mr-2" /> Modificar / Plantilla
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in zoom-in-95">
                      <div className="flex items-center gap-3 bg-slate-50 text-slate-700 p-4 rounded-xl border border-slate-100">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <p className="font-semibold text-sm">Recálculo completado según precios de mercado actuales.</p>
                      </div>

                      <div className="flex items-center justify-between px-4 py-2">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Costo Histórico</p>
                          <p className="text-xl font-black text-slate-400 line-through">Bs. {result.oldTotal.toFixed(1)}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300" />
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-purple-500 uppercase mb-1">Costo Hoy</p>
                          <p className="text-2xl font-black text-purple-700">Bs. {result.newTotal.toFixed(1)}</p>
                        </div>
                      </div>

                      {/* Notificación de Variación */}
                      {result.difference < 0 ? (
                        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold border border-emerald-100">
                          <TrendingDown className="w-4 h-4" />
                          Excelente. Hoy ahorrarás Bs. {Math.abs(result.difference).toFixed(1)}.
                        </div>
                      ) : result.difference > 0 ? (
                        <div className="bg-rose-50 text-rose-700 p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold border border-rose-100">
                          <TrendingUp className="w-4 h-4" />
                          Atención: Los precios subieron Bs. {result.difference.toFixed(1)}.
                        </div>
                      ) : (
                        <div className="bg-slate-50 text-slate-600 p-3 rounded-xl flex items-center justify-center text-sm font-bold border border-slate-200">
                          Los precios se mantienen sin inflación.
                        </div>
                      )}

                      {/* Botón de modificar después de recalcular */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <Button 
                          onClick={() => onModifyBasket?.(basket)} 
                          variant="ghost" 
                          className="w-full text-slate-500 hover:text-purple-600 hover:bg-purple-50 font-semibold"
                        >
                          <Edit className="w-4 h-4 mr-2" /> Ajustar cantidades o productos
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}