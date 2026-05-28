"use client";

import { MarketCard } from "./MarketCard";
import { Market, PriceHistory, UserLocation } from "@/types";
import { MARKET_LOCATIONS, calculateDistance } from "@/lib/data";

interface MarketGridProps {
  markets: Market[];
  onAddReview: (marketId: string, rating: number, comment: string) => void;
  priceHistory: Record<string, PriceHistory[]>;
  averagePrices: Record<string, number>;
  referencePrices: Record<string, number>;
  allMarkets: Market[];
  favoriteMarketIds: string[];
  onToggleFavorite: (marketId: string) => void;
  onReportOverprice: (marketId: string, report: any) => void;
  userLocation: UserLocation | null;
  sortBy: string;
  userId?: string;
  userRole?: 'Vendedora' | 'Comprador';
  calificacionesPorPuesto?: Record<string, number>;
  onCalificacionChanged?: () => void;
}

export function MarketGrid({
  markets,
  onAddReview,
  priceHistory,
  averagePrices,
  referencePrices,
  allMarkets,
  favoriteMarketIds,
  onToggleFavorite,
  onReportOverprice,
  userLocation,
  sortBy,
  userId,
  userRole = 'Comprador',
  calificacionesPorPuesto = {},
  onCalificacionChanged,
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

  // Enriquecer mercados con distancia y flag de favorito
  const marketsWithData = markets.map((market) => {
    let distanceStr = "";
    let distanceNum = Infinity;
    if (userLocation) {
      const loc = MARKET_LOCATIONS.find((l) => l.marketLocation === market.marketLocation);
      if (loc) {
        distanceStr = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          loc.lat,
          loc.lng
        );
        distanceNum = parseFloat(distanceStr);
      }
    }
    const isFavorite = favoriteMarketIds.includes(market.id);
    return { market, distanceStr, distanceNum, isFavorite };
  });

  // Ordenamiento: primero los favoritos, luego por el criterio elegido (sortBy)
  const sortedMarkets = marketsWithData.sort((a, b) => {
    // Primero por favoritos (los favoritos arriba)
    if (a.isFavorite !== b.isFavorite) {
      return a.isFavorite ? -1 : 1;
    }
    // Luego por el criterio de ordenamiento
    switch (sortBy) {
      case "distance":
        return a.distanceNum - b.distanceNum;
      case "name":
        return a.market.name.localeCompare(b.market.name);
      case "name-desc":
        return b.market.name.localeCompare(a.market.name);
      case "rating":
        return a.market.rating - b.market.rating;
      case "rating-desc":
        return b.market.rating - a.market.rating;
      default:
        return 0;
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {sortedMarkets.map(({ market, distanceStr }) => (
        <MarketCard
          key={market.id}
          market={market}
          distance={distanceStr}
          onAddReview={onAddReview}
          allMarkets={allMarkets}
          priceHistory={priceHistory}
          averagePrices={averagePrices}
          referencePrices={referencePrices}
          isFavorite={favoriteMarketIds.includes(market.id)}
          onToggleFavorite={onToggleFavorite}
          onReportOverprice={onReportOverprice}
          userId={userId}
          userRole={userRole}
          calificacionesPorPuesto={calificacionesPorPuesto}
          onCalificacionChanged={onCalificacionChanged}
        />
      ))}
    </div>
  );
}