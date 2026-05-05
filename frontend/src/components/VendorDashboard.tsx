"use client";

import { useState } from "react";
// Ajuste de ruta según tu estructura de carpetas
import { Market, PriceHistory } from "@/types"; 
import { AlertTriangle, Package, Edit2, Save, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Importación de componentes locales (están en la misma carpeta src/components)
import { OverpricingAlertModal } from "./OverpricingAlertModal";
import { RegisterProductModal } from "./RegisterProductModal";
import { StockManagement } from "./StockManagement";

interface VendorDashboardProps {
  market: Market;
  onUpdatePrice: (productId: string, newPrice: number) => void;
  onMarkRestocked: (productId: string) => void;
  onRegisterProduct: (productName: string, price: number) => void;
  onToggleStock: (productId: string) => void;
  onNotifyStock: (productId: string) => void;
  priceHistory: Record<string, PriceHistory[]>;
  averagePrices: Record<string, number>;
  referencePrices: Record<string, number>;
}

export function VendorDashboard({
  market,
  onUpdatePrice,
  onMarkRestocked,
  onRegisterProduct,
  onToggleStock,
  onNotifyStock,
  priceHistory,
  averagePrices,
  referencePrices
}: VendorDashboardProps) {
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState<string>("");
  const [showOverpricingModal, setShowOverpricingModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const handleSavePrice = (productId: string) => {
    const price = parseFloat(newPrice);
    if (!isNaN(price) && price > 0) {
      onUpdatePrice(productId, price);
      setEditingProduct(null);
      setNewPrice("");
    }
  };

  const calculatePriceAlert = (currentPrice: number, productName: string) => {
    const refPrice = referencePrices[productName] || currentPrice;
    const difference = ((currentPrice - refPrice) / refPrice) * 100;
    return {
      isOverpriced: difference > 10,
      difference: difference.toFixed(1)
    };
  };

  const getLowStockProducts = () => market.products.filter(p => !p.available);

  const overpricedProducts = market.products
    .map(product => {
      const alert = calculatePriceAlert(product.price, product.name);
      if (alert.isOverpriced) {
        return {
          id: product.id,
          name: product.name,
          currentPrice: product.price,
          referencePrice: referencePrices[product.name] || product.price,
          difference: parseFloat(alert.difference)
        };
      }
      return null;
    })
    .filter((item): item is any => item !== null);

  return (
    <div className="space-y-6">
      {/* Header con gradiente de La Paz / SIMPRECIOS */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Panel de Vendedor - {market.name}</h2>
            <p className="text-white/90">Gestiona tus precios, productos y stock</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowRegisterModal(true)} className="bg-white text-purple-600 hover:bg-white/90">
              <Plus className="w-4 h-4 mr-2" /> Registrar
            </Button>
            {overpricedProducts.length > 0 && (
              <Button onClick={() => setShowOverpricingModal(true)} className="bg-red-500 hover:bg-red-600 text-white">
                <AlertTriangle className="w-4 h-4 mr-2" /> Ver Sobreprecios ({overpricedProducts.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Alertas de Abastecimiento */}
      {getLowStockProducts().length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
          <h3 className="font-bold text-red-900 mb-2">🚨 Alertas de Abastecimiento</h3>
          <div className="space-y-2">
            {getLowStockProducts().map(product => (
              <div key={product.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200">
                <span className="font-medium text-red-900">{product.name}</span>
                <Button size="sm" onClick={() => onMarkRestocked(product.id)} className="bg-green-600 hover:bg-green-700">
                  Marcar Reabastecido
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de productos y actualización de precios */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Edit2 className="w-5 h-5 text-blue-600" /> Actualizar Precios
        </h3>
        <div className="space-y-3">
          {market.products.map(product => {
            const alert = calculatePriceAlert(product.price, product.name);
            const isEditing = editingProduct === product.id;
            return (
              <div key={product.id} className="border rounded-lg p-4 transition-shadow" style={{ borderLeftWidth: '4px', borderLeftColor: alert.isOverpriced ? '#ef4444' : market.color }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold">{product.name}</h4>
                    <p className="text-sm text-gray-500">Actual: Bs. {product.price.toFixed(2)}</p>
                  </div>
                  <Button size="sm" onClick={() => { setEditingProduct(product.id); setNewPrice(product.price.toString()); }} style={{ backgroundColor: market.color }} className="text-white">
                    Actualizar
                  </Button>
                </div>
                {isEditing && (
                  <div className="mt-3 flex items-center gap-2">
                    <Input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-24" />
                    <Button onClick={() => handleSavePrice(product.id)} className="bg-green-600">Guardar</Button>
                    <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancelar</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <StockManagement products={market.products} onToggleStock={onToggleStock} onNotifyStock={onNotifyStock} marketColor={market.color} />

      <OverpricingAlertModal isOpen={showOverpricingModal} onClose={() => setShowOverpricingModal(false)} overpricedProducts={overpricedProducts} marketColor={market.color} />
      <RegisterProductModal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} onRegister={onRegisterProduct} marketColor={market.color} />
    </div>
  );
}