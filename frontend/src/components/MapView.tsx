"use client";

import { useState, useEffect, ReactNode } from "react";
import dynamic from "next/dynamic";
import { MapPin, Navigation, Store as StoreIcon, Phone, Clock } from "lucide-react";

const RealMap = dynamic(() => import("./RealMap"), { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500">Cargando mapa...</div> });
import { Button } from "@/components/ui/button";
import { Market, UserLocation, MarketLocation } from "@/types";
import { MARKET_LOCATIONS, calculateDistance } from "@/lib/data";

interface MapViewProps {
  markets: Market[];
  filterComponent?: ReactNode;
  userLocation: UserLocation | null;
}

export function MapView({ markets, filterComponent, userLocation }: MapViewProps) {
  const [selectedMarket, setSelectedMarket] = useState<MarketLocation | null>(null);

  const getStallsCount = (marketLocation: string) => markets.filter((m) => m.marketLocation === marketLocation).length;
  const getFavoriteCount = (marketLocation: string) => markets.filter((m) => m.marketLocation === marketLocation && m.isFavorite).length;

  const markerPositions = [{ top: "30%", left: "60%" }, { top: "65%", left: "35%" }, { top: "40%", left: "75%" }];

  return (
    <div className="px-4 py-4 pb-20">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-1">🗺️ Buscar Mercados</h2>
        <p className="text-sm text-gray-600">Encuentra mercados cercanos</p>
        {!userLocation && (
          <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 text-xs rounded">
            ℹ️ Obteniendo tu ubicación...
          </div>
        )}
      </div>

      {filterComponent && (
        <div className="mb-4">
          {filterComponent}
        </div>
      )}

      <div className="space-y-4">
        {/* Mapa simulado */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 text-white">
            <h3 className="text-sm font-bold flex items-center gap-2"><MapPin className="w-4 h-4" />Mapa de Mercados</h3>
          </div>
          <div className="relative bg-gray-100 h-64 z-0">
            <RealMap 
              locations={MARKET_LOCATIONS.map(m => ({ 
                ...m, 
                count: getStallsCount(m.marketLocation),
                hasFavorites: getFavoriteCount(m.marketLocation) > 0
              }))}
              userLocation={userLocation}
              onSelectMarket={(id) => {
                const market = MARKET_LOCATIONS.find(m => m.id === id);
                if (market) setSelectedMarket(market);
              }}
            />
          </div>
        </div>

        {/* Lista de mercados */}
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-3 text-white shadow-lg">
            <h3 className="font-bold text-sm">Mercados Disponibles</h3>
            <p className="text-xs text-white/90">Toca un mercado para ver detalles</p>
          </div>
          {MARKET_LOCATIONS.map((market) => {
            const distance = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, market.lat, market.lng) : "0";
            const isSelected = selectedMarket?.id === market.id;
            const count = getStallsCount(market.marketLocation);
            const favCount = getFavoriteCount(market.marketLocation);
            const isGray = count === 0;
            return (
              <div
                key={market.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all ${isSelected ? "ring-2" : ""} ${isGray ? "opacity-60 grayscale" : ""} ${favCount > 0 ? "ring-2 ring-yellow-400" : ""}`}
                style={{ borderLeft: `4px solid ${favCount > 0 ? '#facc15' : market.color}` }}
                onClick={() => setSelectedMarket(isSelected ? null : market)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `${market.color}20` }}>
                        <StoreIcon className="w-5 h-5" style={{ color: market.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base truncate flex items-center gap-2">
                          {market.name}
                          {favCount > 0 && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1">⭐ {favCount} favorito(s)</span>}
                        </h3>
                        <p className="text-xs text-gray-600 truncate">{market.address}</p>
                      </div>
                    </div>
                    <div className="px-2 py-1 rounded-full text-xs font-bold shrink-0 ml-2" style={{ backgroundColor: `${market.color}20`, color: market.color }}>
                      {distance} km
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-gray-600"><Clock className="w-3 h-3 shrink-0" /><span>{market.hours}</span></div>
                    <div className="flex items-center gap-2 text-gray-600"><Phone className="w-3 h-3 shrink-0" /><span>{market.phone}</span></div>
                    <div className="flex items-center gap-2 text-gray-600"><StoreIcon className="w-3 h-3 shrink-0" /><span className="font-bold">{count} puestos {count === 0 && "(ninguno coincide con tu búsqueda)"}</span></div>
                  </div>
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t">
                      <Button className="w-full h-9 text-sm text-white" style={{ backgroundColor: market.color }}>
                        <Navigation className="w-4 h-4 mr-2" />Cómo llegar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
