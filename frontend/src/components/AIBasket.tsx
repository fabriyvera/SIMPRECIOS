"use client";

import { useState } from "react";
import { Sparkles, Users, DollarSign, ShoppingCart, TrendingDown, CheckCircle, AlertTriangle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Market } from "@/types";
// Importarás tu cliente de Supabase aquí cuando estés listo para la HU-42
// import { createClient } from "@/utils/supabase/client";

interface AIBasketProps {
  markets: Market[];
}


interface BasketItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  marketName: string;
  marketColor: string;
  category: string;
}

interface GeneratedBasket {
  items: BasketItem[];
  totalCost: number;
  savings: number;
  membersServed: number;
  weeklyBudget: number;
  daysCovered: number; // Nuevo: Para HU-43
}

const ESSENTIALS = [
  { category: "Verduras", name: "Papas", baseQty: 3, basePrice: 7.00 },
  { category: "Verduras", name: "Tomates", baseQty: 2, basePrice: 8.00 },
  { category: "Verduras", name: "Cebollas", baseQty: 2, basePrice: 6.00 },
  { category: "Verduras", name: "Zanahorias", baseQty: 2, basePrice: 5.00 },
  { category: "Pollo", name: "Pollo entero", baseQty: 2, basePrice: 28.00 },
  { category: "Carne", name: "Carne molida", baseQty: 2, basePrice: 35.00 },
  { category: "Verduras", name: "Lechuga", baseQty: 2, basePrice: 4.00 },
  { category: "Verduras", name: "Arvejas", baseQty: 1, basePrice: 9.00 },
  { category: "Pollo", name: "Pechuga", baseQty: 1, basePrice: 35.00 },
  { category: "Carne", name: "Carne de res", baseQty: 1, basePrice: 42.00 },
  { category: "Verduras", name: "Brócoli", baseQty: 1, basePrice: 9.00 },
];

const CATEGORY_ICONS: Record<string, string> = { Verduras: "🥬", Pollo: "🍗", Carne: "🥩" };

export function AIBasket({ markets }: AIBasketProps) {
  const [members, setMembers] = useState("4");
  const [budget, setBudget] = useState("500");
  const [meatPreference, setMeatPreference] = useState("Mixto"); // Nuevo: Para HU-41
  const [generatedBasket, setGeneratedBasket] = useState<GeneratedBasket | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const generateBasket = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const numMembers = parseInt(members) || 4;
      const weeklyBudget = parseFloat(budget) || 500;
      const scaleFactor = numMembers / 4;
      const basket: BasketItem[] = [];
      
      let remainingBudget = weeklyBudget;
      let requiredCost = 0; // Para calcular si el dinero alcanza para los 7 días

      // HU-41: Filtrar el arreglo base según la preferencia de carne
      let filteredEssentials = ESSENTIALS;
      if (meatPreference === "Solo Pollo") {
        filteredEssentials = ESSENTIALS.filter(item => item.category !== "Carne");
      } else if (meatPreference === "Solo Res") {
        filteredEssentials = ESSENTIALS.filter(item => item.category !== "Pollo");
      }

      for (const essential of filteredEssentials) {
        const quantity = Math.ceil(essential.baseQty * scaleFactor);
        let bestMarket: Market | null = null;
        let bestPrice = essential.basePrice;
        
        for (const market of markets) {
          const product = market.products.find((p) => p.name === essential.name);
          if (product?.available && product.price <= bestPrice) {
            bestPrice = product.price;
            bestMarket = market;
          }
        }
        
        const totalPrice = quantity * bestPrice;
        requiredCost += totalPrice; // Sumamos al costo ideal

        if (bestMarket && remainingBudget >= totalPrice) {
          basket.push({ productName: essential.name, quantity, unitPrice: bestPrice, totalPrice, marketName: bestMarket.name, marketColor: bestMarket.color, category: essential.category });
          remainingBudget -= totalPrice;
        }
      }

      const totalCost = basket.reduce((s, i) => s + i.totalPrice, 0);
      
      // HU-43: Calcular para cuántos días alcanza el presupuesto si no cubre el requiredCost
      let daysCovered = 7;
      if (weeklyBudget < requiredCost) {
        daysCovered = Math.max(1, Math.floor((weeklyBudget / requiredCost) * 7));
      }

      setGeneratedBasket({ 
        items: basket, 
        totalCost, 
        savings: weeklyBudget - totalCost, // Calculamos el ahorro en base al costo ideal
        membersServed: numMembers, 
        weeklyBudget,
        daysCovered 
      });
      setIsGenerating(false);
    }, 1500);
  };

  // HU-42: Función para guardar en Base de Datos (Supabase)
  const handleSaveBasket = async () => {
    setIsSaving(true);
    try {
      // Aquí irá tu lógica de Supabase usando src/utils/supabase/client.ts
      // const supabase = createClient();
      // await supabase.from('saved_baskets').insert([{ user_id: '123', items: generatedBasket?.items, total: generatedBasket?.totalCost }]);
      
      // Simulamos la latencia de la BD
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("¡Canasta guardada exitosamente en tu perfil!");
    } catch (error) {
      console.error(error);
      alert("Error al guardar la canasta");
    } finally {
      setIsSaving(false);
    }
  };

  const groupByCategory = (items: BasketItem[]) => {
    return items.reduce<Record<string, BasketItem[]>>((acc, item) => {
      (acc[item.category] ??= []).push(item);
      return acc;
    }, {});
  };

  return (
    <div className="px-4 py-4 pb-20">
      <div className="mb-4 flex items-center gap-2">
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-xl">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-0">🤖 IA Canasta</h2>
          <p className="text-xs text-gray-600">Optimiza tu compra semanal</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-600" />Configuración</h3>
          <div className="space-y-3">
            <div>
              <Label className="flex items-center gap-2 mb-2 text-sm"><Users className="w-4 h-4 text-blue-600" />Cantidad de Integrantes</Label>
              <Input type="number" min="1" max="20" value={members} onChange={(e) => setMembers(e.target.value)} placeholder="Ej: 4" className="text-base h-11" />
            </div>
            
            <div>
              <Label className="flex items-center gap-2 mb-2 text-sm"><DollarSign className="w-4 h-4 text-green-600" />Presupuesto Semanal (Bs.)</Label>
              <Input type="number" min="50" max="5000" step="50" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Ej: 500" className="text-base h-11" />
            </div>

            {/* HU-41: Nuevo Select para la preferencia de carne */}
            <div>
              <Label className="flex items-center gap-2 mb-2 text-sm">🥩 Preferencia de Carne</Label>
              <select 
                value={meatPreference} 
                onChange={(e) => setMeatPreference(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Mixto">Mixto (Res y Pollo)</option>
                <option value="Solo Res">Solo Carne de Res</option>
                <option value="Solo Pollo">Solo Pollo</option>
              </select>
            </div>

            <Button onClick={generateBasket} disabled={isGenerating} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white h-11 mt-2">
              {isGenerating ? <><Sparkles className="w-5 h-5 mr-2 animate-spin" />Generando...</> : <><Sparkles className="w-5 h-5 mr-2" />Generar Canasta IA</>}
            </Button>
          </div>

          {generatedBasket && (
            <div className="mt-4 space-y-2">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border-2 border-green-200">
                <p className="text-xs text-green-700 font-medium">Ahorro Estimado</p>
                <p className="text-xl font-bold text-green-800">Bs. {generatedBasket.savings > 0 ? generatedBasket.savings.toFixed(2) : "0.00"}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border-2 border-blue-200">
                <p className="text-xs text-blue-700 font-medium">Costo Total</p>
                <p className="text-xl font-bold text-blue-800">Bs. {generatedBasket.totalCost.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>

        {!generatedBasket && !isGenerating && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 text-center border-2 border-dashed border-purple-200">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">¡Genera tu canasta!</h3>
            <p className="text-sm text-gray-600">Ingresa los datos para que la IA genere tu canasta con los mejores precios</p>
          </div>
        )}

        {isGenerating && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Sparkles className="w-16 h-16 text-purple-600 animate-pulse mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">Analizando precios...</h3>
            <p className="text-sm text-gray-600">Optimizando tu canasta 🤖</p>
          </div>
        )}

        {generatedBasket && !isGenerating && (
          <div className="space-y-4">
            
            {/* HU-43: Alerta dinámica si el presupuesto no alcanza para 7 días */}
            {generatedBasket.daysCovered < 7 ? (
               <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-white shadow-lg">
                 <div className="flex items-center gap-2 mb-3">
                   <AlertTriangle className="w-6 h-6" />
                   <div>
                     <h3 className="text-lg font-bold">Presupuesto Ajustado</h3>
                     <p className="text-sm text-white/90">Tu dinero alcanza para {generatedBasket.daysCovered} días exactos.</p>
                   </div>
                 </div>
               </div>
            ) : (
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-6 h-6" />
                  <div>
                    <h3 className="text-lg font-bold">¡Canasta Completa!</h3>
                    <p className="text-xs text-white/90">Semana cubierta para {generatedBasket.membersServed} personas</p>
                  </div>
                </div>
              </div>
            )}

            {Object.entries(groupByCategory(generatedBasket.items)).map(([category, items]) => (
              <div key={category} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b">
                  <h4 className="text-base font-bold flex items-center gap-2">
                    <span className="text-xl">{CATEGORY_ICONS[category] ?? "🛒"}</span>{category}
                    <span className="ml-auto text-xs font-normal text-gray-600">{items.length} {items.length === 1 ? "item" : "items"}</span>
                  </h4>
                </div>
                <div className="divide-y">
                  {items.map((item, i) => (
                    <div key={i} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-base mb-1 truncate">{item.productName}</h5>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: item.marketColor }}>{item.marketName}</span>
                          <div className="flex flex-col gap-0.5 text-xs text-gray-600 mt-1.5">
                            <span>Cantidad: <strong>{item.quantity} kg o unids.</strong></span>
                            <span>Precio: <strong>Bs. {item.unitPrice.toFixed(2)}</strong></span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-500 mb-0.5">Subtotal</p>
                          <p className="text-lg font-bold" style={{ color: item.marketColor }}>Bs. {item.totalPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="text-white/90 text-xs">Optimización</p>
                    <p className="text-lg font-bold">
                      {generatedBasket.savings > 0 
                        ? ((generatedBasket.savings / generatedBasket.weeklyBudget) * 100).toFixed(1) 
                        : "0.0"}% Ahorro
                    </p>
                  </div>
                </div>
              </div>
              
              {/* HU-42: Botones de acción, incluyendo "Guardar" */}
              <div className="flex gap-2">
                <Button onClick={handleSaveBasket} disabled={isSaving} className="flex-1 bg-white/20 hover:bg-white/30 text-white h-10 text-sm border border-white/30">
                  {isSaving ? <Sparkles className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  {isSaving ? "Guardando..." : "Guardar"}
                </Button>
                <Button className="flex-1 bg-white text-green-700 hover:bg-green-50 h-10 text-sm">
                  <ShoppingCart className="w-4 h-4 mr-1" />Descargar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}