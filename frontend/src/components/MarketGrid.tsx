"use client";

import { MarketCard } from "./MarketCard";
import { Market, PriceHistory } from "@/types";

interface MarketGridProps {
  markets: Market[];
  onAddReview: (marketId: string, rating: number, comment: string) => void;
  // Añadimos estas props para que coincidan con lo que MarketCard espera
  priceHistory: Record<string, PriceHistory[]>;
  averagePrices: Record<string, number>;
  referencePrices: Record<string, number>;
  onToggleFavorite: (marketId: string) => void;
}

export function MarketGrid({
  markets,
  onAddReview,
  priceHistory,
  averagePrices,
  referencePrices,
  onToggleFavorite
}: MarketGridProps) {
  
  if (markets.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-xl font-bold text-gray-800">No se encontraron puestos</p>
        <p className="text-muted-foreground">
          Intenta ajustar los filtros o buscar con otro nombre.
        </p>
      </div>
    );
  }

  // Ordenar para que los favoritos salgan primero
  const sortedMarkets = [...markets].sort((a, b) => {
    if (a.isFavorite === b.isFavorite) return 0;
    return a.isFavorite ? -1 : 1;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {sortedMarkets.map((market) => (
        <MarketCard
          key={market.id}
          market={market}
          onAddReview={onAddReview}
          // Pasamos la lista completa de mercados para que PriceComparison funcione
          allMarkets={markets} 
          priceHistory={priceHistory}
          averagePrices={averagePrices}
          referencePrices={referencePrices}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}