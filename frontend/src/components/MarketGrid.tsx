"use client";

import { MarketCard } from "./MarketCard";
import { Market, PriceHistory, UserLocation } from "@/types";
import { MARKET_LOCATIONS, calculateDistance } from "@/lib/data";

interface MarketGridProps {
  markets: Market[];
  onAddReview: (marketId: string, rating: number, comment: string) => void;
  // Añadimos estas props para que coincidan con lo que MarketCard espera
  priceHistory: Record<string, PriceHistory[]>;
  averagePrices: Record<string, number>;
  referencePrices: Record<string, number>;
  onToggleFavorite: (marketId: string) => void;
  userLocation: UserLocation | null;
  sortBy: string;
}

export function MarketGrid({
  markets,
  onAddReview,
  priceHistory,
  averagePrices,
  referencePrices,
  onToggleFavorite,
  userLocation,
  sortBy
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

  // Enriquecer mercados con distancia
  const marketsWithDistance = markets.map(market => {
    let distanceStr = "";
    let distanceNum = Infinity;
    if (userLocation) {
      const loc = MARKET_LOCATIONS.find(l => l.marketLocation === market.marketLocation);
      if (loc) {
        distanceStr = calculateDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng);
        distanceNum = parseFloat(distanceStr);
      }
    }
    return { market, distanceStr, distanceNum };
  });

  // Ordenar por sortBy
  marketsWithDistance.sort((a, b) => {
    if (sortBy === "distance") {
      return a.distanceNum - b.distanceNum;
    }
    if (sortBy === "name") {
      return a.market.name.localeCompare(b.market.name);
    }
    if (sortBy === "name-desc") {
      return b.market.name.localeCompare(a.market.name);
    }
    if (sortBy === "rating") {
      return a.market.rating - b.market.rating;
    }
    if (sortBy === "rating-desc") {
      return b.market.rating - a.market.rating;
    }
    return 0;
  });

  // Ordenar para que los favoritos salgan primero siempre
  const sortedMarkets = marketsWithDistance.sort((a, b) => {
    if (a.market.isFavorite === b.market.isFavorite) return 0;
    return a.market.isFavorite ? -1 : 1;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {sortedMarkets.map(({ market, distanceStr }) => (
        <MarketCard
          key={market.id}
          market={market}
          distance={distanceStr}
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