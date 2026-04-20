"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, AlertTriangle, Package, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Market, PriceHistory } from "@/types";

interface VendorDashboardProps {
  market: Market;
  onUpdatePrice: (productId: string, newPrice: number) => void;
  onMarkRestocked: (productId: string) => void;
  priceHistory: Record<string, PriceHistory[]>;
  averagePrices: Record<string, number>;
  referencePrices: Record<string, number>;
}

export function VendorDashboard({ market, onUpdatePrice, onMarkRestocked, priceHistory, averagePrices, referencePrices }: VendorDashboardProps) {
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const handleSavePrice = (productId: string) => {
    const price = parseFloat(newPrice);
    if (!isNaN(price) && price > 0) {
      onUpdatePrice(productId, price);
      setEditingProduct(null);
      setNewPrice("");
    }
  };

  const calculatePriceAlert = (currentPrice: number, productName: string) => {
    const refPrice = referencePrices[productName] ?? currentPrice;
    const difference = ((currentPrice - refPrice) / refPrice) * 100;
    return { isOverpriced: difference > 10, difference: difference.toFixed(1) };
  };

  const lowStockProducts = market.products.filter((p) => !p.available);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Panel de Vendedor - {market.name}</h2>
        <p className="text-white/90">Gestiona tus precios, revisa tendencias y recibe alertas</p>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-2">🚨 Alertas de Abastecimiento</h3>
              <p className="text-sm text-red-700 mb-3">Los siguientes productos necesitan reabastecimiento:</p>
              <div className="space-y-2">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200">
                    <span className="font-medium text-red-900">{product.name}</span>
                    <Button size="sm" onClick={() => onMarkRestocked(product.id)} className="bg-green-600 hover:bg-green-700">Marcar Reabastecido</Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Edit2 className="w-5 h-5 text-blue-600" />Actualizar Precios</h3>
        <div className="space-y-3">
          {market.products.map((product) => {
            const alert = calculatePriceAlert(product.price, product.name);
            const isEditing = editingProduct === product.id;
            const refPrice = referencePrices[product.name] ?? product.price;

            return (
              <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow" style={{ borderLeftWidth: "4px", borderLeftColor: alert.isOverpriced ? "#ef4444" : market.color }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold">{product.name}</h4>
                      {alert.isOverpriced && (
                        <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                          <AlertTriangle className="w-3 h-3" />Sobreprecio +{alert.difference}%
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Nuevo precio:</Label>
                          <Input type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-24" placeholder="0.00" />
                          <span className="text-sm font-medium">Bs.</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600">Precio actual: <span className="font-bold text-lg" style={{ color: market.color }}>Bs. {product.price.toFixed(2)}</span></p>
                          <p className="text-sm text-gray-500">Referencia: <span className="font-bold">Bs. {refPrice.toFixed(2)}</span></p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button size="sm" onClick={() => handleSavePrice(product.id)} className="bg-green-600 hover:bg-green-700"><Save className="w-4 h-4 mr-1" />Guardar</Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingProduct(null); setNewPrice(""); }}><X className="w-4 h-4" /></Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" onClick={() => { setEditingProduct(product.id); setNewPrice(product.price.toString()); }} style={{ backgroundColor: market.color }} className="text-white">
                          <Edit2 className="w-4 h-4 mr-1" />Actualizar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedProduct(selectedProduct === product.id ? null : product.id)}>
                          <TrendingUp className="w-4 h-4 mr-1" />Historial
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {selectedProduct === product.id && priceHistory[product.name] && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-bold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" style={{ color: market.color }} />Historial de Precios - {product.name}</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={priceHistory[product.name]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 12 }} label={{ value: "Precio (Bs.)", angle: -90, position: "insideLeft" }} />
                        <Tooltip formatter={(value) => value !== undefined ? [`Bs. ${(value as number).toFixed(2)}`, "Precio"] : ["", "Precio"]} />
                        <Legend />
                        <Line type="monotone" dataKey="price" stroke={market.color} strokeWidth={3} name="Precio" dot={{ fill: market.color, r: 5 }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                      {[
                        ["Precio Mínimo", "blue", `Bs. ${Math.min(...priceHistory[product.name].map((h) => h.price)).toFixed(2)}`],
                        ["Precio Promedio", "green", `Bs. ${(priceHistory[product.name].reduce((a, h) => a + h.price, 0) / priceHistory[product.name].length).toFixed(2)}`],
                        ["Precio Máximo", "orange", `Bs. ${Math.max(...priceHistory[product.name].map((h) => h.price)).toFixed(2)}`],
                      ].map(([label, color, val]) => (
                        <div key={label as string} className={`bg-${color}-50 rounded-lg p-3`}>
                          <p className={`text-xs text-${color}-600 font-medium`}>{label}</p>
                          <p className={`text-lg font-bold text-${color}-900`}>{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Productos", value: market.products.length, from: "from-blue-500", to: "to-blue-600", text: "text-blue-100" },
          { label: "En Stock", value: market.products.filter((p) => p.available).length, from: "from-green-500", to: "to-green-600", text: "text-green-100" },
          { label: "Calificación", value: `${market.rating} ⭐`, from: "from-orange-500", to: "to-orange-600", text: "text-orange-100" },
        ].map(({ label, value, from, to, text }) => (
          <div key={label} className={`bg-gradient-to-br ${from} ${to} rounded-xl p-6 text-white shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${text} text-sm mb-1`}>{label}</p>
                <p className="text-3xl font-bold">{value}</p>
              </div>
              <Package className="w-12 h-12 opacity-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
