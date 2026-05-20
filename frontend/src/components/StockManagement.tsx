import { useState } from "react";
import { Package, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

interface Product {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

interface StockManagementProps {
  products: Product[];
  onToggleStock: (productId: string) => void;
  onNotifyStock: (productId: string) => void;
  marketColor: string;
}

export function StockManagement({
  products,
  onToggleStock,
  onNotifyStock,
  marketColor
}: StockManagementProps) {
  const [notifiedProducts, setNotifiedProducts] = useState<Set<string>>(new Set());

  const handleNotify = (productId: string) => {
    onNotifyStock(productId);
    setNotifiedProducts(prev => new Set([...prev, productId]));

    // Remover la notificación después de 3 segundos
    setTimeout(() => {
      setNotifiedProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }, 3000);
  };

  const lowStockCount = products.filter(p => !p.available).length;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Package className="w-5 h-5" style={{ color: marketColor }} />
          Gestión de Stock
        </h3>
        {lowStockCount > 0 && (
          <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            {lowStockCount} sin stock
          </div>
        )}
      </div>

      <div className="space-y-3">
        {products.map(product => (
          <div
            key={product.id}
            className={`border rounded-lg p-4 transition-all ${
              !product.available ? 'bg-red-50 border-red-200' : 'hover:shadow-md'
            }`}
            style={{
              borderLeftWidth: '4px',
              borderLeftColor: product.available ? marketColor : '#ef4444'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-lg">{product.name}</h4>
                  {product.available ? (
                    <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                      <CheckCircle className="w-3 h-3" />
                      En Stock
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                      <XCircle className="w-3 h-3" />
                      Sin Stock
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Precio: <span className="font-bold">Bs. {product.price.toFixed(2)}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`stock-${product.id}`} className="text-sm">
                    {product.available ? 'Disponible' : 'Agotado'}
                  </Label>
                  <Switch
                    id={`stock-${product.id}`}
                    checked={product.available}
                    onCheckedChange={() => onToggleStock(product.id)}
                    className="data-[state=checked]:bg-black data-[state=unchecked]:bg-input [&_span]:bg-white"
                  />
                </div>

                {!product.available && (
                  <Button
                    size="sm"
                    onClick={() => handleNotify(product.id)}
                    className="bg-orange-600 hover:bg-orange-700"
                    disabled={notifiedProducts.has(product.id)}
                  >
                    {notifiedProducts.has(product.id) ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Notificado
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Notificar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {lowStockCount === 0 && (
        <div className="text-center py-8 bg-green-50 rounded-lg mt-4">
          <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-600" />
          <p className="text-green-700 font-bold">
            ✅ Todos los productos están en stock
          </p>
        </div>
      )}
    </div>
  );
}