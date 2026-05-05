import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

interface PriceValidatorProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  currentPrice: number;
  referencePrice: number;
  averagePrice: number;
  marketColor: string;
}

export function PriceValidator({
  isOpen,
  onClose,
  productName,
  currentPrice,
  referencePrice,
  averagePrice,
  marketColor,
}: PriceValidatorProps) {
  const diffFromReference =
    ((currentPrice - referencePrice) / referencePrice) * 100;
  const diffFromAverage =
    ((currentPrice - averagePrice) / averagePrice) * 100;

  const isGoodPrice = currentPrice <= referencePrice * 1.05; // Dentro del 5% del precio de referencia
  const isFairPrice =
    currentPrice <= referencePrice * 1.1 &&
    currentPrice > referencePrice * 1.05; // Entre 5% y 10%
  const isExpensive = currentPrice > referencePrice * 1.1; // Más del 10%

  const getStatusInfo = () => {
    if (isGoodPrice) {
      return {
        icon: (
          <CheckCircle className="w-12 h-12 text-green-600" />
        ),
        title: "¡Excelente Precio!",
        color: "green",
        bgColor: "bg-green-50",
        borderColor: "border-green-500",
        textColor: "text-green-700",
      };
    } else if (isFairPrice) {
      return {
        icon: (
          <AlertTriangle className="w-12 h-12 text-orange-600" />
        ),
        title: "Precio Aceptable",
        color: "orange",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-500",
        textColor: "text-orange-700",
      };
    } else {
      return {
        icon: <XCircle className="w-12 h-12 text-red-600" />,
        title: "Precio Elevado",
        color: "red",
        bgColor: "bg-red-50",
        borderColor: "border-red-500",
        textColor: "text-red-700",
      };
    }
  };

  const status = getStatusInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Validación de Precio
          </DialogTitle>
          <DialogDescription className="text-center">
            Verifica si el precio de {productName} es justo
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {/* Status principal */}
          <div
            className={`${status.bgColor} border-2 ${status.borderColor} rounded-xl p-6 text-center mb-6`}
          >
            <div className="flex justify-center mb-3">
              {status.icon}
            </div>
            <h3
              className={`text-2xl font-bold ${status.textColor} mb-2`}
            >
              {status.title}
            </h3>
            <p
              className="text-3xl font-bold mb-1"
              style={{ color: marketColor }}
            >
              Bs. {currentPrice.toFixed(2)}
            </p>
            <p className={`text-sm ${status.textColor}`}>
              {productName}
            </p>
          </div>

          {/* Análisis detallado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                📊 Vs. Precio de Referencia
              </h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Precio de Referencia:{" "}
                  <span className="font-bold">
                    Bs. {referencePrice.toFixed(2)}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  {diffFromReference > 0 ? (
                    <TrendingUp className="w-4 h-4 text-red-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-600" />
                  )}
                  <p
                    className={`text-sm font-bold ${diffFromReference > 0 ? "text-red-600" : "text-green-600"}`}
                  >
                    {diffFromReference > 0 ? "+" : ""}
                    {diffFromReference.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                📈 Vs. Precio Promedio del Mercado
              </h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Precio Promedio:{" "}
                  <span className="font-bold">
                    Bs. {averagePrice.toFixed(2)}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  {diffFromAverage > 0 ? (
                    <TrendingUp className="w-4 h-4 text-red-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-600" />
                  )}
                  <p
                    className={`text-sm font-bold ${diffFromAverage > 0 ? "text-red-600" : "text-green-600"}`}
                  >
                    {diffFromAverage > 0 ? "+" : ""}
                    {diffFromAverage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="border-t pt-4">
            <h4 className="font-bold mb-3">
              💡 Recomendaciones
            </h4>
            <div className="space-y-2">
              {isGoodPrice && (
                <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                  ✅ Este es un buen precio. Está dentro del
                  rango justo según el precio de referencia del
                  mercado.
                </p>
              )}
              {isFairPrice && (
                <>
                  <p className="text-sm text-orange-700 bg-orange-50 p-3 rounded-lg">
                    ⚠️ El precio es un poco elevado pero aún
                    aceptable. Considera comparar con otros
                    puestos.
                  </p>
                  <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                    💰 Podrías ahorrar hasta Bs.{" "}
                    {(currentPrice - referencePrice).toFixed(2)}{" "}
                    buscando opciones más económicas.
                  </p>
                </>
              )}
              {isExpensive && (
                <>
                  <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                    ⛔ Este precio excede significativamente el
                    precio de referencia. Te recomendamos buscar
                    otras opciones.
                  </p>
                  <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                    💰 Podrías ahorrar Bs.{" "}
                    {(currentPrice - referencePrice).toFixed(2)}{" "}
                    comprando al precio de referencia.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={onClose}
            style={{ backgroundColor: marketColor }}
          >
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}