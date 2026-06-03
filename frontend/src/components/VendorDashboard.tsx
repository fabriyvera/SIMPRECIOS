"use client";

import { useState, useEffect } from "react";
import { Market, PriceHistory } from "@/types"; 
import { AlertTriangle, Package, Edit2, Save, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { OverpricingAlertModal } from "./OverpricingAlertModal";
import { RegisterProductModal } from "./RegisterProductModal";
import { StockManagement } from "./StockManagement";
import { toast } from "sonner";
import { pricesAPI } from "@/services/api/prices";

interface VendorDashboardProps {
  market: Market;
  onUpdatePrice: (productId: string, newPrice: number) => void;
  onMarkRestocked: (productId: string) => void;
  onRegisterProduct: (productName: string, price: number) => void;
  onToggleStock: (productId: string) => void;
  onNotifyStock: (productId: string) => void;
  onDeleteProduct?: (productId: string) => void; // 🌟 Punto 4: Prop opcional para sincronizar borrado con el padre
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
  onDeleteProduct,
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

  // ── FUNCIÓN DE ACTUALIZAR PRECIO (ALINEADA CON PYDANTIC) ──
  const handleSavePrice = async (productId: string, productName: string) => {
    const price = parseFloat(newPrice);
    
    if (!isNaN(price) && price > 0) {
      try {
        const idLimpio = productId.replace(/\D/g, ""); 
        const productoIdFinal = idLimpio ? parseInt(idLimpio, 10) : parseInt(productId, 10);

        if (isNaN(productoIdFinal)) {
          toast.error(`ID de producto inválido para ${productName}`);
          return;
        }

        const bodyPayload = {
          puesto_id: parseInt(market.id, 10),
          producto_id: productoIdFinal,      
          precio_actual: price,
          nombre_producto: productName 
        };

        await pricesAPI.updatePrice(bodyPayload);

        onUpdatePrice(productId, price);
        setLocalProducts(prev => 
          prev.map(p => p.id === productId ? { ...p, price } : p)
        );
        setEditingProduct(null);
        setNewPrice("");
        
        toast.success("✅ Precio actualizado correctamente", {
          description: `${productName} ahora cuesta Bs. ${price.toFixed(2)}`,
          duration: 4000,
        });

      } catch (e: any) {
        console.error("🚨 Detalle completo del error del backend:", e.message);
        toast.error("🚨 Error al guardar en el servidor");
      }
    } else {
      toast.error("Por favor, ingresa un precio válido");
    }
  };

  // ── 🎯 ELIMINACIÓN SEGURA PASANDO PUESTO Y PRODUCTO ──
  const handleDeleteProductClick = async (productId: string, productName: string) => {
    try {
      const idLimpio = productId.replace(/\D/g, ""); 
      const productoIdFinal = idLimpio ? parseInt(idLimpio, 10) : parseInt(productId, 10);

      if (isNaN(productoIdFinal)) {
        toast.error("ID de producto inválido para eliminar");
        return;
      }

      
      const response = await pricesAPI.deletePrice(market.id, String(productoIdFinal));

      // Descontar del estado local inmediatamente
      setLocalProducts(prev => prev.filter(p => p.id !== productId));
      
      if (onDeleteProduct) {
        onDeleteProduct(productId);
      }

      toast.success("🗑️ Producto eliminado", {
        description: `${productName} fue removido de tu inventario con éxito.`,
        duration: 3000,
      });

    } catch (e: any) {
      console.error("🚨 Error al eliminar producto:", e.message);
      toast.error("🚨 Error al intentar eliminar el producto en el servidor");
    }
  };
  // ── 🎯 PUNTO 3: NOTIFICACIÓN DE ESCASEZ / AGOTADO REAL ──
  const handleLocalNotifyStock = async (productId: string, productName: string) => {
    try {
      // 1. Forzar el estado de disponible a false para que la vista de usuario lo renderice como 'Agotado'
      setLocalProducts(prev => prev.map(p => p.id === productId ? { ...p, available: false } : p));
      
      // 2. Ejecutar la acción del componente superior para persistir en cascada
      onNotifyStock(productId);
      
      toast.warning("📢 Alerta de desabastecimiento enviada", {
        description: `${productName} marcado como agotado para los usuarios.`,
        duration: 4000,
      });
    } catch (e) {
      console.error("Error al despachar notificación de stock:", e);
    }
  };

  // REGISTRO TOTALMENTE CONTROLADO E INDEPENDIENTE
  const handleDashboardRegister = (productName: string, price: number) => {
    const newProduct = {
      id: crypto.randomUUID(), 
      name: productName,
      price: price,
      available: true
    };

    setLocalProducts(prev => [...prev, newProduct]);

    try {
      onRegisterProduct(productName, price);
    } catch (e) {
      console.error("El componente padre falló al guardar en BD:", e);
    }

    toast.success("✅ Producto registrado correctamente", {
      description: `${productName} - Bs. ${price.toFixed(2)}`,
      duration: 4000,
    });
  };

  // ── SISTEMA DE ALERTAS UNIFICADO Y CORREGIDO ──
  const calculatePriceAlert = (product: any) => {
    const currentPrice = product.price;
    const nameLimpio = product.name.toLowerCase().trim();
    
    let refPrice = currentPrice; 

    if (nameLimpio.includes("pollo entero") || nameLimpio.includes("pollo kilo")) {
      refPrice = 16.50; 
    } else if (nameLimpio.includes("pechuga de pollo") || nameLimpio.includes("pechuga")) {
      refPrice = 26.00;
    } else if (nameLimpio.includes("pierna de pollo") || nameLimpio.includes("pierna") || nameLimpio.includes("muslo")) {
      refPrice = 19.00;
    } else if (nameLimpio.includes("alitas de pollo") || nameLimpio.includes("alitas")) {
      refPrice = 17.00;
    } else if (nameLimpio.includes("carne molida") || nameLimpio.includes("molida")) {
      refPrice = 28.00;
    } else if (nameLimpio.includes("pulpa de res") || nameLimpio.includes("pulpa")) {
      refPrice = 42.00;
    } else if (nameLimpio.includes("chuleta de res") || nameLimpio.includes("chuleta")) {
      refPrice = 32.00;
    } else if (nameLimpio.includes("costilla de res") || nameLimpio.includes("costilla")) {
      refPrice = 26.00;
    } else if (nameLimpio.includes("lomo de res") || nameLimpio.includes("lomo")) {
      refPrice = 45.00;
    } else if (nameLimpio.includes("chuleta de cerdo") || nameLimpio.includes("cerdo chuleta")) {
      refPrice = 28.00;
    } else if (nameLimpio.includes("costilla de cerdo") || nameLimpio.includes("lechón") || nameLimpio.includes("lechon")) {
      refPrice = 30.00;
    } else if (nameLimpio.includes("pierna de cerdo")) {
      refPrice = 25.00;
    } else if (nameLimpio.includes("trucha")) {
      refPrice = 35.00; 
    } else if (nameLimpio.includes("sábalo") || nameLimpio.includes("sabalo")) {
      refPrice = 25.00; 
    } else if (nameLimpio.includes("pejerrey")) {
      refPrice = 40.00;
    } else if (nameLimpio.includes("apio")) {
      refPrice = 3.50;
    } else if (nameLimpio.includes("choclo")) {
      refPrice = 5.00;
    } else if (nameLimpio.includes("tomate")) {
      refPrice = 6.00;
    } else if (nameLimpio.includes("zanahoria")) {
      refPrice = 4.00;
    } else if (nameLimpio.includes("cebolla")) {
      refPrice = 5.00;
    } else if (nameLimpio.includes("papa")) {
      refPrice = 45.00; 
    } else if (nameLimpio.includes("lechuga")) {
      refPrice = 3.00;
    } else if (nameLimpio.includes("morron") || nameLimpio.includes("pimenton") || nameLimpio.includes("pimentón")) {
      refPrice = 2.50;
    } else if (nameLimpio.includes("arveja")) {
      refPrice = 7.00;
    } else if (nameLimpio.includes("espinaca")) {
      refPrice = 3.50;
    } else if (nameLimpio.includes("vainita")) {
      refPrice = 5.00;
    } else if (nameLimpio.includes("brocoli") || nameLimpio.includes("brócoli")) {
      refPrice = 7.50;
    } else if (nameLimpio.includes("locoto")) {
      refPrice = 6.00;
    } else if (nameLimpio.includes("camote")) {
      refPrice = 5.00;
    } else if (nameLimpio.includes("yuca")) {
      refPrice = 6.00;
    } else if (nameLimpio.includes("chuño") || nameLimpio.includes("chuñito") || nameLimpio.includes("Chuño")) {
      refPrice = 46.00;
    } else if (nameLimpio.includes("platano") || nameLimpio.includes("plátano") || nameLimpio.includes("banano")) {
      refPrice = 4.00;
    } else if (nameLimpio.includes("manzana")) {
      refPrice = 2.00;
    } else if (nameLimpio.includes("naranja")) {
      refPrice = 0.80;
    } else if (nameLimpio.includes("mandarina")) {
      refPrice = 0.70; 
    } else if (nameLimpio.includes("papaya")) {
      refPrice = 8.00;
    } else if (nameLimpio.includes("frutilla")) {
      refPrice = 15.00;
    } else if (nameLimpio.includes("piña") || nameLimpio.includes("pina")) {
      refPrice = 10.00;
    } else if (nameLimpio.includes("palta")) {
      refPrice = 5.00;
    }

    const difference = refPrice > 0 ? ((currentPrice - refPrice) / refPrice) * 100 : 0;
    
    return {
      isOverpriced: difference > 10, 
      difference: difference.toFixed(1),
      refPriceFinal: refPrice
    };
  };

  const getLowStockProducts = () => localProducts.filter(p => !p.available);

  const overpricedProducts = localProducts
    .map(product => {
      const alert = calculatePriceAlert(product);
      if (alert.isOverpriced) {
        return {
          id: product.id,
          name: product.name,
          currentPrice: product.price,
          referencePrice: alert.refPriceFinal,
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

      {/* Gestión de Precios */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Edit2 className="w-5 h-5 text-blue-600" />
          Actualizar Precios
        </h3>
        <div className="space-y-3">
          {localProducts.map(product => {
            const alert = calculatePriceAlert(product);
            const isEditing = editingProduct === product.id;
            const refPrice = alert.refPriceFinal;

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
                  
                  {/* 📦 BOTONERÍA CONFIGURADA CON BORRAR (PUNTO 4) */}
                  <div className="flex gap-2 items-center">
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
                      <>
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
                        
                        {/* 🗑️ BOTÓN ELIMINAR AGREGADO AL LADO DE ACTUALIZAR */}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteProductClick(product.id, product.name)}
                          className="bg-red-600 hover:bg-red-700"
                          title="Eliminar producto por completo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
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
        onNotifyStock={(id) => {
          const prod = localProducts.find(p => p.id === id);
          handleLocalNotifyStock(id, prod ? prod.name : "Producto");
        }} 
        marketColor={market.color} 
      />

      <OverpricingAlertModal isOpen={showOverpricingModal} onClose={() => setShowOverpricingModal(false)} overpricedProducts={overpricedProducts} marketColor={market.color} />
      <RegisterProductModal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} onRegister={handleDashboardRegister} marketColor={market.color} />
    </div>
  );
}