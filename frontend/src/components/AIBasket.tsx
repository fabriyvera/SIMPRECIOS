"use client";

import { useState } from "react";
import { Sparkles, Users, DollarSign, ShoppingCart, TrendingDown, CheckCircle, AlertTriangle, Save, ArrowRight, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Market } from "@/types";
import { createClient } from "@/utils/supabase/client";

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
  daysCovered: number;
}

const ESSENTIALS = [
  { category: "Verduras", name: "Papas", baseQty: 3, basePrice: 7.00 },
  { category: "Verduras", name: "Tomates", baseQty: 2, basePrice: 8.00 },
  { category: "Verduras", name: "Cebollas", baseQty: 2, basePrice: 6.00 },
  { category: "Verduras", name: "Zanahorias", baseQty: 2, basePrice: 5.00 },
  { category: "Verduras", name: "Lechuga", baseQty: 2, basePrice: 4.00 },
  { category: "Verduras", name: "Arvejas", baseQty: 1, basePrice: 9.00 },
  { category: "Verduras", name: "Brócoli", baseQty: 1, basePrice: 9.00 },
  { category: "Pollo", name: "Pollo entero", baseQty: 2, basePrice: 28.00 },
  { category: "Pollo", name: "Pechuga", baseQty: 1, basePrice: 35.00 },
  { category: "Carne", name: "Carne molida", baseQty: 2, basePrice: 35.00 },
  { category: "Carne", name: "Carne de res", baseQty: 1, basePrice: 42.00 },
];

const CATEGORY_ICONS: Record<string, string> = { Verduras: "🥬", Pollo: "🍗", Carne: "🥩" };

export function AIBasket({ markets }: AIBasketProps) {
  // Estados de navegación
  const [step, setStep] = useState(1); 
  
  // Estados de Configuración (Paso 1)
  const [members, setMembers] = useState("4");
  const [budget, setBudget] = useState("500");

  // Estados de Preferencias Granulares (Paso 2)
  const [selectedItems, setSelectedItems] = useState<string[]>(ESSENTIALS.map(i => i.name));
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Estados de Resultados (Paso 3)
  const [generatedBasket, setGeneratedBasket] = useState<GeneratedBasket | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Manejo de Checkboxes granulares
  const toggleItem = (name: string) => {
    setSelectedItems(prev => 
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  const generateBasket = () => {
    setIsGenerating(true);
    setStep(3);
    
    setTimeout(() => {
      const numMembers = parseInt(members) || 4;
      const weeklyBudget = parseFloat(budget) || 500;
      const scaleFactor = numMembers / 4;
      const basket: BasketItem[] = [];
      
      let remainingBudget = weeklyBudget;
      let requiredCost = 0;

      const filteredEssentials = ESSENTIALS.filter(item => selectedItems.includes(item.name));

      for (const essential of filteredEssentials) {
        const quantity = Math.ceil(essential.baseQty * scaleFactor);
        
        // 1. Definimos un "Mercado Base" por si la BD falla o no tiene el producto
        let bestPrice = essential.basePrice;
        let bestMarketName = "Mercado Promedio"; 
        let bestMarketColor = "#9CA3AF"; // Color gris neutro

        // 2. Buscamos en los mercados de la BD a ver si hay una mejor oferta
        if (markets && markets.length > 0) {
          for (const market of markets) {
            const product = market.products?.find((p) => p.name === essential.name);
            if (product?.available && product.price <= bestPrice) {
              bestPrice = product.price;
              bestMarketName = market.name;
              bestMarketColor = market.color || "#9333ea";
            }
          }
        }
        
        const totalPrice = quantity * bestPrice;
        requiredCost += totalPrice;

        // 3. QUITAMOS la restricción de "bestMarket". Ahora siempre inserta si hay dinero.
        if (remainingBudget >= totalPrice) {
          basket.push({ 
            productName: essential.name, 
            quantity, 
            unitPrice: bestPrice, 
            totalPrice, 
            marketName: bestMarketName, 
            marketColor: bestMarketColor, 
            category: essential.category 
          });
          remainingBudget -= totalPrice;
        }
      }

      const totalCost = basket.reduce((s, i) => s + i.totalPrice, 0);
      let daysCovered = 7;
      if (weeklyBudget < requiredCost) {
        daysCovered = Math.max(1, Math.floor((weeklyBudget / requiredCost) * 7));
      }

      setGeneratedBasket({ 
        items: basket, 
        totalCost, 
        savings: weeklyBudget - totalCost, 
        membersServed: numMembers, 
        weeklyBudget,
        daysCovered 
      });
      setIsGenerating(false);
    }, 1500);
  };

  const handleSaveBasket = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();

      // 1. Obtener el usuario autenticado en este momento
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      // 2. Bloquear el guardado si nadie ha iniciado sesión
      if (authError || !user) {
        alert("Por favor, inicia sesión en el sistema para guardar tus canastas.");
        return; // Detiene la ejecución aquí
      }

      // 3. Guardar la canasta usando el ID dinámico del usuario
      const { error } = await supabase
        .from('canastas_favoritas')
        .insert([
          {
            usuario_id: user.id, // <--- Aquí captura automáticamente el ID correcto
            nombre_canasta: `Canasta IA (${generatedBasket?.membersServed} pers.)`,
            cantidad_familiares: generatedBasket?.membersServed,
            presupuesto_semanal_bs: generatedBasket?.weeklyBudget,
            items: generatedBasket?.items
          }
        ]);

      if (error) throw error;

      alert("¡Éxito! La canasta se guardó en tu perfil.");
    } catch (error) {
      console.error("Error al guardar en Supabase:", error);
      alert("Error al guardar. Revisa la consola de tu navegador.");
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
    <div className="px-4 py-4 pb-20 max-w-2xl mx-auto">
      {/* Header Fijo */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2.5 rounded-2xl shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">SIMPRECIOS IA</h2>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${step >= s ? "bg-purple-600" : "bg-gray-200"}`} />
              ))}
            </div>
          </div>
        </div>
        {step > 1 && step < 3 && (
          <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="text-gray-500">
            <ArrowLeft className="w-4 h-4 mr-1" /> Atrás
          </Button>
        )}
      </div>

      {/* PASO 1: DATOS FAMILIARES */}
      {step === 1 && (
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-6">
             <div className="bg-blue-100 p-2 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
             <h3 className="text-xl font-bold text-gray-800">Datos del Hogar</h3>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">¿Cuántas personas viven en casa?</Label>
              <Input type="number" value={members} onChange={(e) => setMembers(e.target.value)} className="h-14 text-lg font-bold border-gray-200 focus:border-purple-500" />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">Presupuesto para Carne y Verdura (Bs.)</Label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="h-14 pl-12 text-lg font-bold border-gray-200 focus:border-purple-500" />
              </div>
            </div>
            <Button onClick={() => setStep(2)} className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-2xl transition-all shadow-lg">
              Continuar <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* PASO 2: PREFERENCIAS GRANULARES */}
      {step === 2 && (
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex items-center gap-3 mb-6">
             <div className="bg-pink-100 p-2 rounded-lg"><ShoppingCart className="w-6 h-6 text-pink-600" /></div>
             <h3 className="text-xl font-bold text-gray-800">Preferencias de Comida</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-6">Selecciona qué productos quieres que la IA incluya en tu canasta semanal.</p>

          <div className="space-y-4">
            {/* Acordeón de Personalización Avanzada */}
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors"
            >
              <span className="font-bold text-gray-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" /> Personalizar productos específicos
              </span>
              {showAdvanced ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 gap-4 pt-2 max-h-[350px] overflow-y-auto px-1">
                {["Verduras", "Pollo", "Carne"].map(cat => (
                  <div key={cat} className="space-y-2">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      {CATEGORY_ICONS[cat]} {cat}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {ESSENTIALS.filter(i => i.category === cat).map(item => (
                        <button
                          key={item.name}
                          onClick={() => toggleItem(item.name)}
                          className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium ${
                            selectedItems.includes(item.name) 
                            ? "bg-purple-50 border-purple-200 text-purple-700 shadow-sm" 
                            : "bg-white border-gray-100 text-gray-400 opacity-60"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${selectedItems.includes(item.name) ? "bg-purple-600 border-purple-600" : "bg-white border-gray-300"}`}>
                            {selectedItems.includes(item.name) && <CheckCircle className="w-4 h-4 text-white" />}
                          </div>
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={generateBasket} className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-2xl shadow-xl mt-4">
              Generar Canasta IA <Sparkles className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* PASO 3: RESULTADOS */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-700">
          {isGenerating ? (
            <div className="bg-white rounded-3xl shadow-xl p-12 text-center border border-gray-100">
              <Sparkles className="w-20 h-20 text-purple-600 animate-spin mx-auto mb-6 opacity-20" />
              <h3 className="text-2xl font-black text-gray-800 mb-2">Analizando Mercados</h3>
              <p className="text-gray-500">Buscando los precios más bajos en La Paz...</p>
            </div>
          ) : generatedBasket && (
            <div className="space-y-4">
              {/* Alerta de Días (HU-13) */}
              {generatedBasket.daysCovered < 7 ? (
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-5 text-white shadow-lg flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-2xl"><AlertTriangle className="w-8 h-8" /></div>
                  <div>
                    <h3 className="font-black text-lg italic leading-none">PRESUPUESTO LIMITADO</h3>
                    <p className="text-sm opacity-90 font-medium">La carne te alcanzará para <span className="underline decoration-2 font-black">{generatedBasket.daysCovered} días</span>. Prioriza el consumo.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-5 text-white shadow-lg flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-2xl"><CheckCircle className="w-8 h-8" /></div>
                  <div>
                    <h3 className="font-black text-lg italic leading-none">CANASTA COMPLETADA</h3>
                    <p className="text-sm opacity-90 font-medium">Tu familia de {generatedBasket.membersServed} tiene la semana cubierta.</p>
                  </div>
                </div>
              )}

              {/* Resumen de Costos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-5 rounded-3xl shadow-md border border-gray-100">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Costo Total</p>
                  <p className="text-2xl font-black text-gray-800">Bs. {generatedBasket.totalCost.toFixed(1)}</p>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-md border border-gray-100">
                  <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-1">Tu Ahorro</p>
                  <p className="text-2xl font-black text-emerald-600">Bs. {generatedBasket.savings.toFixed(1)}</p>
                </div>
              </div>

              {/* Lista de Productos por Categoría */}
              {Object.entries(groupByCategory(generatedBasket.items)).map(([category, items]) => (
                <div key={category} className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                    <h4 className="font-black text-sm uppercase tracking-tighter flex items-center gap-2">
                      <span className="text-xl">{CATEGORY_ICONS[category]}</span> {category}
                    </h4>
                    <span className="text-xs font-bold bg-gray-200 px-2 py-1 rounded-lg text-gray-600">{items.length} items</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {items.map((item, i) => (
                      <div key={i} className="p-4 flex items-center justify-between group hover:bg-purple-50/30 transition-colors">
                        <div className="flex-1">
                          <h5 className="font-bold text-gray-800 text-lg leading-none mb-1">{item.productName}</h5>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black px-2 py-0.5 rounded-md text-white uppercase" style={{ backgroundColor: item.marketColor }}>{item.marketName}</span>
                             <span className="text-xs text-gray-400 font-bold">{item.quantity} kg/unid. × Bs. {item.unitPrice}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-gray-800 leading-none">Bs. {item.totalPrice.toFixed(1)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                 <Button 
                  onClick={handleSaveBasket} 
                  disabled={isSaving} 
                  className="flex-1 h-14 bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 font-black rounded-2xl shadow-md transition-all"
                 >
                  {isSaving ? <Sparkles className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />} 
                  {isSaving ? "Guardando..." : "Guardar"}
                 </Button>
                 <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-14 bg-gray-100 text-gray-600 font-black rounded-2xl">
                   Nueva Consulta
                 </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}