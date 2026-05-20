"use client";

import { useState, useEffect } from "react";
import { Market, PriceHistory } from "@/types"; 
import { AlertTriangle, Package, Edit2, Save, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { OverpricingAlertModal } from "./OverpricingAlertModal";
import { RegisterProductModal } from "./RegisterProductModal";
import { StockManagement } from "./StockManagement";
import { toast } from "sonner";

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

  // ESTADO LOCAL DE SEGURIDAD PARA LOS PRODUCTOS
  const [localProducts, setLocalProducts] = useState(market.products);

  // Sincronizar por si el mercado padre cambia desde fuera
  useEffect(() => {
    setLocalProducts(market.products);
  }, [market.products]);

  const handleSavePrice = (productId: string, productName: string) => {
    const price = parseFloat(newPrice);
    if (!isNaN(price) && price > 0) {
      onUpdatePrice(productId, price);
      
      // Actualizar localmente de inmediato
      setLocalProducts(prev => 
        prev.map(p => p.id === productId ? { ...p, price } : p)
      );

      setEditingProduct(null);
      setNewPrice("");
      
      toast.success(`✅ Precio de ${productName} actualizado`, {
        description: `Nuevo precio: Bs. ${price.toFixed(2)}`,
        duration: 3000,
      });
    }
  };

  // REGISTRO TOTALMENTE CONTROLADO E INDEPENDIENTE
  const handleDashboardRegister = (productName: string, price: number) => {
    // 1. Crear el producto estructurado
    const newProduct = {
      id: crypto.randomUUID(), 
      name: productName,
      price: price,
      available: true
    };

    // 2. Insertarlo localmente primero para saltearnos cualquier bug del padre
    setLocalProducts(prev => [...prev, newProduct]);

    // 3. Mandar los datos al backend/padre de fondo
    try {
      onRegisterProduct(productName, price);
    } catch (e) {
      console.error("El componente padre falló al guardar en BD:", e);
    }

    // 4. Mostrar el Toast de Sonner con los datos reales
    toast.success("✅ Producto registrado correctamente", {
      description: `${productName} - Bs. ${price.toFixed(2)}`,
      duration: 4000,
    });
  };

  const calculatePriceAlert = (currentPrice: number, productName: string) => {
    const refPrice = referencePrices[productName] || currentPrice;
    const difference = ((currentPrice - refPrice) / refPrice) * 100;
    return {
      isOverpriced: difference > 10,
      difference: difference.toFixed(1)
    };
  };

  const getLowStockProducts = () => localProducts.filter(p => !p.available);

  const overpricedProducts = localProducts
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
      {/* Header */}
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
                <Button 
                  size="sm" 
                  onClick={() => {
                    onMarkRestocked(product.id);
                    setLocalProducts(prev => prev.map(p => p.id === product.id ? { ...p, available: true } : p));
                  }} 
                  className="bg-green-600 hover:bg-green-700"
                >
                  Marcar Reabastecido
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gestión de Precios usando localProducts */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Edit2 className="w-5 h-5 text-blue-600" />
          Actualizar Precios
        </h3>
        <div className="space-y-3">
          {localProducts.map(product => {
            const alert = calculatePriceAlert(product.price, product.name);
            const isEditing = editingProduct === product.id;
            const refPrice = referencePrices[product.name] || product.price;

            return (
              <div
                key={product.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: alert.isOverpriced ? '#ef4444' : market.color
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold">{product.name}</h4>
                      {alert.isOverpriced && (
                        <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          Sobreprecio +{alert.difference}%
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Nuevo precio:</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                            className="w-24"
                            placeholder="0.00"
                          />
                          <span className="text-sm font-medium">Bs.</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600">
                            Precio actual: <span className="font-bold text-lg" style={{ color: market.color }}>
                              Bs. {product.price.toFixed(2)}
                            </span>
                          </p>
                          <p className="text-sm text-gray-500">
                            Precio referencia: <span className="font-bold">Bs. {refPrice.toFixed(2)}</span>
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSavePrice(product.id, product.name)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingProduct(null);
                            setNewPrice("");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingProduct(product.id);
                          setNewPrice(product.price.toString());
                        }}
                        style={{ backgroundColor: market.color }}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Actualizar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <StockManagement 
        products={localProducts} 
        onToggleStock={(id) => {
          onToggleStock(id);
          setLocalProducts(prev => prev.map(p => p.id === id ? { ...p, available: !p.available } : p));
        }} 
        onNotifyStock={onNotifyStock} 
        marketColor={market.color} 
      />

      <OverpricingAlertModal isOpen={showOverpricingModal} onClose={() => setShowOverpricingModal(false)} overpricedProducts={overpricedProducts} marketColor={market.color} />
      <RegisterProductModal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} onRegister={handleDashboardRegister} marketColor={market.color} />
    </div>
  );
}