"use client";

import { useState, useEffect } from "react";
import { Sparkles, Users, DollarSign, ShoppingCart, TrendingDown, CheckCircle, AlertTriangle, Save, ArrowRight, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Market } from "@/types";
import { createClient } from "@/utils/supabase/client";

interface AIBasketProps {
  markets: Market[];
  initialData?: any;
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
  wasPruned: boolean; // NUEVO: Para saber si se activó el Modo Ahorro Extremo
}

const ESSENTIALS = [
  // Verduras
  { category: "Verduras", name: "Papa", baseQty: 3, basePrice: 7.00 },
  { category: "Verduras", name: "Tomate", baseQty: 2, basePrice: 8.00 },
  { category: "Verduras", name: "Brocoli", baseQty: 1, basePrice: 9.00 },
  { category: "Verduras", name: "Apio", baseQty: 1, basePrice: 4.00 },
  { category: "Verduras", name: "Chuño", baseQty: 1, basePrice: 12.00 },
  
  // Frutas
  { category: "Frutas", name: "Platano", baseQty: 2, basePrice: 6.00 },
  { category: "Frutas", name: "Manzana", baseQty: 1, basePrice: 10.00 },
  { category: "Frutas", name: "Naranja", baseQty: 2, basePrice: 8.00 },
  { category: "Frutas", name: "Piña", baseQty: 1, basePrice: 10.00 },
  
  // Carnes (Res, Pollo y Pescado unificados según la BD)
  { category: "Carnes", name: "Pechuga de pollo", baseQty: 1, basePrice: 22.00 },
  { category: "Carnes", name: "Pierna de pollo", baseQty: 1, basePrice: 18.00 },
  { category: "Carnes", name: "Alitas de pollo", baseQty: 1, basePrice: 20.00 },
  { category: "Carnes", name: "Chuleta de res", baseQty: 1, basePrice: 35.00 },
  { category: "Carnes", name: "Costilla de res", baseQty: 1, basePrice: 28.00 },
  { category: "Carnes", name: "Trucha", baseQty: 1, basePrice: 30.00 },
  { category: "Carnes", name: "Sabalo", baseQty: 1, basePrice: 25.00 },
  { category: "Carnes", name: "Pejerrey", baseQty: 1, basePrice: 25.00 },
];

const CATEGORY_ICONS: Record<string, string> = { 
  Verduras: "🥬", 
  Frutas: "🍎", 
  Carnes: "🥩" 
};

export function AIBasket({ markets, initialData }: AIBasketProps) {
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

  // Escuchar si llega una canasta para modificar
  useEffect(() => {
    if (initialData) {
      // 1. Rellenar personas y presupuesto
      setMembers(initialData.cantidad_familiares?.toString() || "4");
      setBudget(initialData.presupuesto_semanal_bs?.toString() || "500");
      
      // 2. Marcar automáticamente los checkboxes de los productos guardados
      if (initialData.items) {
        const savedProductNames = initialData.items.map((item: any) => item.productName);
        setSelectedItems(savedProductNames);
      }
      
      // 3. Saltar directamente al Paso 2 y abrir el acordeón para que el usuario vea su lista
      setStep(1);
      setShowAdvanced(true);
    }
  }, [initialData]);

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
      let tempBasket: BasketItem[] = [];
      
      const filteredEssentials = ESSENTIALS.filter(item => selectedItems.includes(item.name));

      // 1. La IA genera primero la lista ideal completa ajustada por tamaño familiar
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
        
        tempBasket.push({ 
          productName: essential.name, 
          quantity, 
          unitPrice: bestPrice, 
          totalPrice, 
          marketName: bestMarket ? bestMarket.name : "Mercado Promedio", 
          marketColor: bestMarket ? bestMarket.color : "#9CA3AF", 
          category: essential.category 
        });
      }

      // 2. ALGORITMO DE PODA (Canasta de Supervivencia)
      // Si el costo total supera el presupuesto, la IA empieza a sacrificar lo más caro
      let wasPruned = false;
      
      while (tempBasket.reduce((sum, item) => sum + item.totalPrice, 0) > weeklyBudget && tempBasket.length > 0) {
        wasPruned = true;
        // Ordenamos la lista para dejar el producto con mayor precio unitario al principio (índice 0)
        tempBasket.sort((a, b) => b.unitPrice - a.unitPrice);
        // Eliminamos el producto más costoso por kilo del mercado
        tempBasket.shift(); 
      }

      const totalCost = tempBasket.reduce((s, i) => s + i.totalPrice, 0);
      const savings = weeklyBudget > totalCost ? weeklyBudget - totalCost : 0;

      setGeneratedBasket({ 
        items: tempBasket, 
        totalCost, 
        savings, 
        membersServed: numMembers, 
        weeklyBudget,
        daysCovered: 7, // Como se redimensionó el contenido, lo que quedó cubre los 7 días
        wasPruned
      });
      setIsGenerating(false);
    }, 1500);
  };

  const handleSaveBasket = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const usuarioIdPrueba = "31c3b38e-6c7b-4876-bedf-a46fe1d654ef"; 

      const { data, error } = await supabase
        .from('canastas_favoritas')
        .insert([
          {
            usuario_id: usuarioIdPrueba,
            nombre_canasta: generatedBasket?.wasPruned ? `Canasta Supervivencia (${generatedBasket?.membersServed} pers.)` : `Canasta IA (${generatedBasket?.membersServed} pers.)`,
            presupuesto_semanal_bs: generatedBasket?.weeklyBudget,
            items: generatedBasket?.items
          }
        ]);

      if (error) throw error;
      alert("¡Éxito! La canasta se guardó en tu base de datos Supabase.");
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
        <div className="bg-white rounded-2xl shadow-xl p-7 border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-500">
          
          {/* Cabecera elegante */}
          <div className="flex items-start gap-4 mb-8">
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">
               <ShoppingCart className="w-6 h-6 text-slate-700" />
             </div>
             <div>
               <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Preferencias de Comida</h3>
               <p className="text-sm text-slate-500 mt-1">Configura los parámetros exactos para el algoritmo de recomendación.</p>
             </div>
          </div>

          <div className="space-y-6">
            {/* Botón de Acordeón Minimalista */}
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-sm transition-all duration-200 group"
            >
              <span className="font-semibold text-slate-700 flex items-center gap-2 group-hover:text-purple-700 transition-colors">
                <Sparkles className="w-4 h-4 text-purple-500" /> 
                Personalizar catálogo de productos
              </span>
              {showAdvanced ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>

            {/* Panel de Selección Avanzada */}
            {showAdvanced && (
              <div className="grid grid-cols-1 gap-6 pt-2 max-h-[380px] overflow-y-auto px-1 pb-4">
                {["Verduras", "Frutas", "Carnes"].map(cat => (
                  <div key={cat} className="space-y-4">
                    {/* Separador de Categoría Elegante */}
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                      <span className="text-lg bg-slate-50 p-1.5 rounded-lg border border-slate-100">{CATEGORY_ICONS[cat]}</span>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {cat}
                      </h4>
                    </div>
                    
                    {/* Grid de Checkboxes Profesionales */}
                    <div className="grid grid-cols-2 gap-3">
                      {ESSENTIALS.filter(i => i.category === cat).map(item => {
                        const isSelected = selectedItems.includes(item.name);
                        return (
                          <button
                            key={item.name}
                            onClick={() => toggleItem(item.name)}
                            className={`relative flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 text-sm font-medium focus:outline-none ${
                              isSelected 
                              ? "bg-white border-purple-500 ring-1 ring-purple-500 text-slate-900 shadow-sm" 
                              : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-700"
                            }`}
                          >
                            <span className="truncate pr-3">{item.name}</span>
                            {/* Icono de Checkbox limpio */}
                            <div className={`flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
                              isSelected 
                              ? "bg-purple-600 border-purple-600 shadow-sm shadow-purple-200" 
                              : "bg-white border-slate-300"
                            }`}>
                              {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Call To Action (Botón Principal) */}
            <Button onClick={generateBasket} className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all mt-4 border border-slate-800">
              Ejecutar Motor de IA <Sparkles className="ml-2 w-5 h-5 text-purple-400" />
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
              
              {/* Alerta Dinámica (HU-13) */}
              {generatedBasket.wasPruned ? (
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-5 text-white shadow-lg flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-2xl"><AlertTriangle className="w-8 h-8" /></div>
                  <div>
                    <h3 className="font-black text-lg italic leading-none">🛡️ MODO AHORRO EXTREMO</h3>
                    <p className="text-sm opacity-90 font-medium mt-1">
                      Hemos retirado los productos más costosos (como carnes y pollo) de tu lista para garantizar que tus Bs. {generatedBasket.weeklyBudget} te alcancen para llevar suficientes verduras y tubérculos para los 7 días completos.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-5 text-white shadow-lg flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-2xl"><CheckCircle className="w-8 h-8" /></div>
                  <div>
                    <h3 className="font-black text-lg italic leading-none">CANASTA COMPLETADA</h3>
                    <p className="text-sm opacity-90 font-medium">Tu familia de {generatedBasket.membersServed} tiene la cobertura semanal completa y óptima.</p>
                  </div>
                </div>
              )}

              {/* Resumen de Costos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-5 rounded-3xl shadow-md border border-gray-100">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Costo de Compra</p>
                  <p className="text-2xl font-black text-gray-800">Bs. {generatedBasket.totalCost.toFixed(1)}</p>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-md border border-gray-100">
                  <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-1">Tu Saldo Disponible</p>
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