"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { History, RefreshCw, ShoppingBag, ArrowRight, CheckCircle, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Market } from "@/types";

interface SavedBasketsProps {
  markets: Market[];
}

export function SavedBaskets({ markets }: SavedBasketsProps) {
  const [baskets, setBaskets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null);
  const [recalculatedResults, setRecalculatedResults] = useState<Record<string, any>>({});

  // 1. Cargar las canastas al abrir el componente
  useEffect(() => {
    fetchBaskets();
  }, []);

  const fetchBaskets = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // ATENCIÓN: Pega aquí el mismo UUID completo que usaste para guardar
      const usuarioIdPrueba = "31c3b38e-6c7b-4876-bedf-a46fe1d654ef"; 

      const { data, error } = await supabase
        .from("canastas_favoritas")
        .select("*")
        .eq("usuario_id", usuarioIdPrueba)
        .order("fecha_creacion", { ascending: false });

      if (error) throw error;
      setBaskets(data || []);
    } catch (error) {
      console.error("Error al cargar canastas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. El motor de RECÁLCULO (HU-12)
  const handleRecalculate = (basket: any) => {
    setRecalculatingId(basket.id);
    
    setTimeout(() => {
      let newTotal = 0;
      const oldTotal = basket.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

      // Cruzamos la lista guardada con los mercados actuales
      const updatedItems = basket.items.map((item: any) => {
        let bestPrice = item.unitPrice; // Precio por defecto (el antiguo)
        let currentMarket = item.marketName;

        // Buscamos si hoy hay un precio más barato
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
    }, 1500); // Simulamos el análisis de la IA
  };

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-3 rounded-2xl shadow-lg">
          <History className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-800">Mis Canastas Guardadas</h2>
          <p className="text-sm text-gray-500 font-medium">Recalcula tus compras frecuentes con precios de hoy.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-10 h-10 text-blue-500 animate-spin opacity-50" />
        </div>
      ) : baskets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-bold">Aún no tienes canastas guardadas.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {baskets.map((basket) => {
            const isRecalculating = recalculatingId === basket.id;
            const result = recalculatedResults[basket.id];

            return (
              <div key={basket.id} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                {/* Cabecera de la Tarjeta */}
                <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-lg text-gray-800">{basket.nombre_canasta}</h3>
                    <p className="text-xs font-bold text-gray-400 mt-1">Guardada el {new Date(basket.fecha_creacion).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Presupuesto</p>
                    <p className="font-black text-gray-800">Bs. {basket.presupuesto_semanal_bs}</p>
                  </div>
                </div>

                {/* Área de Recálculo */}
                <div className="p-6">
                  {!result ? (
                    <Button 
                      onClick={() => handleRecalculate(basket)}
                      disabled={isRecalculating}
                      className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl shadow-md transition-all"
                    >
                      {isRecalculating ? (
                        <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Consultando Mercados...</>
                      ) : (
                        <><RefreshCw className="w-5 h-5 mr-2" /> Recalcular Precios de Hoy</>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-4 animate-in fade-in zoom-in-95">
                      <div className="flex items-center gap-3 bg-blue-50 text-blue-700 p-4 rounded-2xl">
                        <CheckCircle className="w-6 h-6" />
                        <p className="font-bold text-sm">Recálculo completado según precios actuales de los mercados.</p>
                      </div>

                      <div className="flex items-center justify-between px-4 py-2">
                        <div className="text-center">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Costo Anterior</p>
                          <p className="text-xl font-black text-gray-600 line-through">Bs. {result.oldTotal.toFixed(1)}</p>
                        </div>
                        <ArrowRight className="w-6 h-6 text-gray-300" />
                        <div className="text-center">
                          <p className="text-xs font-bold text-blue-500 uppercase mb-1">Costo Hoy</p>
                          <p className="text-2xl font-black text-blue-700">Bs. {result.newTotal.toFixed(1)}</p>
                        </div>
                      </div>

                      {/* Notificación de Variación */}
                      {result.difference < 0 ? (
                        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold border border-emerald-100">
                          <TrendingDown className="w-5 h-5" />
                          ¡Excelente! Hoy te cuesta Bs. {Math.abs(result.difference).toFixed(1)} menos.
                        </div>
                      ) : result.difference > 0 ? (
                        <div className="bg-rose-50 text-rose-700 p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold border border-rose-100">
                          <TrendingUp className="w-5 h-5" />
                          Los precios subieron Bs. {result.difference.toFixed(1)} en total.
                        </div>
                      ) : (
                        <div className="bg-gray-100 text-gray-600 p-3 rounded-xl flex items-center justify-center text-sm font-bold">
                          Los precios se mantienen igual que cuando la guardaste.
                        </div>
                      )}
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