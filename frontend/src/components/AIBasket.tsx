"use client";

import { useState } from "react";
import { Sparkles, Users, DollarSign, ShoppingCart, TrendingDown, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Market } from "@/types";

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
  const [generatedBasket, setGeneratedBasket] = useState<GeneratedBasket | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateBasket = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const numMembers = parseInt(members) || 4;
      const weeklyBudget = parseFloat(budget) || 500;
      const scaleFactor = numMembers / 4;
      const basket: BasketItem[] = [];
      let remainingBudget = weeklyBudget;

      for (const essential of ESSENTIALS) {
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
        if (bestMarket && remainingBudget >= totalPrice) {
          basket.push({ productName: essential.name, quantity, unitPrice: bestPrice, totalPrice, marketName: bestMarket.name, marketColor: bestMarket.color, category: essential.category });
          remainingBudget -= totalPrice;
        }
      }

      const totalCost = basket.reduce((s, i) => s + i.totalPrice, 0);
      setGeneratedBasket({ items: basket, totalCost, savings: weeklyBudget - totalCost, membersServed: numMembers, weeklyBudget });
      setIsGenerating(false);
    }, 1500);
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
              <p className="text-xs text-gray-500 mt-1">Número de personas en tu hogar</p>
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-2 text-sm"><DollarSign className="w-4 h-4 text-green-600" />Presupuesto Semanal (Bs.)</Label>
              <Input type="number" min="100" max="5000" step="50" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Ej: 500" className="text-base h-11" />
              <p className="text-xs text-gray-500 mt-1">Tu presupuesto disponible</p>
            </div>
            <Button onClick={generateBasket} disabled={isGenerating} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white h-11">
              {isGenerating ? <><Sparkles className="w-5 h-5 mr-2 animate-spin" />Generando...</> : <><Sparkles className="w-5 h-5 mr-2" />Generar Canasta IA</>}
            </Button>
          </div>

          {generatedBasket && (
            <div className="mt-4 space-y-2">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border-2 border-green-200">
                <p className="text-xs text-green-700 font-medium">Ahorro Total</p>
                <p className="text-xl font-bold text-green-800">Bs. {generatedBasket.savings.toFixed(2)}</p>
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
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-bold">¡Canasta Generada!</h3>
                  <p className="text-xs text-white/90">Para {generatedBasket.membersServed} {generatedBasket.membersServed === 1 ? "persona" : "personas"} - Bs. {generatedBasket.weeklyBudget.toFixed(0)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[["Items", generatedBasket.items.length], ["Gastado", `Bs. ${generatedBasket.totalCost.toFixed(0)}`], ["Ahorro", `Bs. ${generatedBasket.savings.toFixed(0)}`]].map(([label, val]) => (
                  <div key={label as string} className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                    <p className="text-xs text-white/80 mb-0.5">{label}</p>
                    <p className="text-lg font-bold">{val}</p>
                  </div>
                ))}
              </div>
            </div>

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
                            <span>Cantidad: <strong>{item.quantity} kg</strong></span>
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
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <TrendingDown className="w-6 h-6 shrink-0" />
                  <div>
                    <p className="text-white/90 text-xs">Optimización</p>
                    <p className="text-lg font-bold">{((generatedBasket.savings / generatedBasket.weeklyBudget) * 100).toFixed(1)}% Ahorro</p>
                  </div>
                </div>
                <Button className="bg-white text-green-700 hover:bg-green-50 shrink-0 h-9 text-sm">
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
