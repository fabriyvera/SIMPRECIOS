import { useState } from "react";
import { TrendingDown, TrendingUp, Store } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

interface Product {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

interface Market {
  id: string;
  name: string;
  category: string;
  isOpen: boolean;
  products: Product[];
  rating: number;
  marketLocation: string;
  color: string;
}

interface PriceComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  currentPrice: number;
  currentMarket: Market;
  allMarkets: Market[];
}

export function PriceComparison({
  isOpen,
  onClose,
  productName,
  currentPrice,
  currentMarket,
  allMarkets
}: PriceComparisonProps) {
  // Encontrar todos los mercados que venden este producto
  const marketsWithProduct = allMarkets
    .map(market => {
      const product = market.products.find(p => p.name === productName);
      if (product) {
        return {
          market,
          product,
          isCurrent: market.id === currentMarket.id
        };
      }
      return null;
    })
    .filter(item => item !== null)
    .sort((a, b) => a!.product.price - b!.product.price);

  const lowestPrice = marketsWithProduct.length > 0 ? marketsWithProduct[0]!.product.price : currentPrice;
  const highestPrice = marketsWithProduct.length > 0 ? marketsWithProduct[marketsWithProduct.length - 1]!.product.price : currentPrice;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-6 h-6 text-blue-600" />
            Comparación de Precios - {productName}
          </DialogTitle>
          <DialogDescription>
            Compara los precios de {productName} entre diferentes mercados locales
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-700">Precio Más Bajo</p>
              </div>
              <p className="text-2xl font-bold text-green-900">Bs. {lowestPrice.toFixed(2)}</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Store className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-blue-700">Precio Actual</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">Bs. {currentPrice.toFixed(2)}</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <p className="text-sm font-medium text-orange-700">Precio Más Alto</p>
              </div>
              <p className="text-2xl font-bold text-orange-900">Bs. {highestPrice.toFixed(2)}</p>
            </div>
          </div>

          {/* Lista de mercados */}
          <div className="space-y-3">
            <h4 className="font-bold text-lg mb-3">
              Puestos que venden {productName} ({marketsWithProduct.length})
            </h4>

            {marketsWithProduct.map((item, index) => {
              const market = item!.market;
              const product = item!.product;
              const isCurrent = item!.isCurrent;
              const isLowest = index === 0;
              const isHighest = index === marketsWithProduct.length - 1;
              const priceDiff = ((product.price - lowestPrice) / lowestPrice) * 100;

              return (
                <div
                  key={market.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isCurrent ? 'border-blue-500 bg-blue-50' : 'hover:shadow-md'
                  }`}
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: isCurrent ? '#3b82f6' : market.color
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold">{market.name}</h5>
                        {isCurrent && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                            Puesto Actual
                          </span>
                        )}
                        {isLowest && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" />
                            Mejor Precio
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-sm text-gray-600">
                          📍 {market.marketLocation}
                        </p>
                        <p className="text-sm text-gray-600">
                          ⭐ {market.rating}
                        </p>
                        <p className="text-sm">
                          <span className={`font-bold px-2 py-1 rounded ${
                            market.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {market.isOpen ? '🟢 Abierto' : '🔴 Cerrado'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: market.color }}>
                        Bs. {product.price.toFixed(2)}
                      </p>
                      {!isLowest && (
                        <p className="text-sm text-gray-500 mt-1">
                          +{priceDiff.toFixed(1)}% vs mejor precio
                        </p>
                      )}
                      {isLowest && priceDiff === 0 && (
                        <p className="text-sm text-green-600 font-bold mt-1">
                          💰 ¡Mejor oferta!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {marketsWithProduct.length === 1 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg mt-4">
              <p className="text-gray-600">
                Este es el único puesto que vende {productName}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
