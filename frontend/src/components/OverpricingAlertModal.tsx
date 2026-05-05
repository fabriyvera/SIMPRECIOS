import { AlertTriangle, X } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

interface OverpricedProduct {
  id: string;
  name: string;
  currentPrice: number;
  referencePrice: number;
  difference: number;
}

interface OverpricingAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  overpricedProducts: OverpricedProduct[];
  marketColor: string;
}

export function OverpricingAlertModal({
  isOpen,
  onClose,
  overpricedProducts,
  marketColor
}: OverpricingAlertModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-6 h-6" />
            Alertas de Sobreprecio
          </DialogTitle>
          <DialogDescription>
            Los siguientes productos tienen un precio que excede el 10% del precio de referencia establecido
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {overpricedProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">✅ No hay productos con sobreprecio</p>
              <p className="text-sm mt-2">Todos tus precios están dentro del rango permitido</p>
            </div>
          ) : (
            overpricedProducts.map(product => (
              <div
                key={product.id}
                className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-red-900 text-lg">{product.name}</h4>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-red-700">
                        Precio actual: <span className="font-bold">Bs. {product.currentPrice.toFixed(2)}</span>
                      </p>
                      <p className="text-sm text-red-700">
                        Precio de referencia: <span className="font-bold">Bs. {product.referencePrice.toFixed(2)}</span>
                      </p>
                      <p className="text-sm text-red-700">
                        Sobreprecio: <span className="font-bold">+{product.difference.toFixed(1)}%</span>
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    +{product.difference.toFixed(1)}%
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-xs text-red-600">
                    💡 Sugerencia: Ajusta el precio a máximo Bs. {(product.referencePrice * 1.1).toFixed(2)} para estar dentro del rango permitido
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} style={{ backgroundColor: marketColor }}>
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
