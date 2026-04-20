"use client";

import { useState, useMemo } from "react";
import { SearchAndFilter } from "@/components/SearchAndFilter";
import { MarketGrid } from "@/components/MarketGrid";
import { VendorDashboard } from "@/components/VendorDashboard";
import { Navbar } from "@/components/Navbar";
import { MapView } from "@/components/MapView";
import { AIBasket } from "@/components/AIBasket";
import { ShoppingBag, Store, ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { INITIAL_MARKETS, REFERENCE_PRICES, generatePriceHistory } from "@/lib/data";
import { Market, AppView, PriceHistory } from "@/types";

export default function HomeClient() {
  const [currentUser] = useState({
    name: "Juan Pérez",
    avatar: "JP",
    isVendor: false,
  });

  const [currentView, setCurrentView] = useState<AppView>("home");
  const [isVendorMode, setIsVendorMode] = useState(false);
  const [selectedVendorMarket, setSelectedVendorMarket] = useState<string | null>(null);
  const [markets, setMarkets] = useState<Market[]>(INITIAL_MARKETS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [selectedMarketLocation, setSelectedMarketLocation] = useState("all");

  const handleToggleVendorMode = () => {
    if (isVendorMode) {
      setIsVendorMode(false);
      setCurrentView("home");
      setSelectedVendorMarket(null);
    } else {
      setIsVendorMode(true);
      setCurrentView("vendor");
    }
  };

  const handleViewChange = (view: AppView) => {
    if (view === "vendor") {
      setIsVendorMode(true);
      setSelectedVendorMarket(null);
    } else {
      setIsVendorMode(false);
    }
    setCurrentView(view);
  };

  const averagePrices = useMemo(() => {
    const priceMap: Record<string, number[]> = {};
    markets.forEach((market) => {
      market.products.forEach((product) => {
        if (!priceMap[product.name]) priceMap[product.name] = [];
        priceMap[product.name].push(product.price);
      });
    });
    const averages: Record<string, number> = {};
    Object.entries(priceMap).forEach(([name, prices]) => {
      averages[name] = prices.reduce((a, b) => a + b, 0) / prices.length;
    });
    return averages;
  }, [markets]);

  const priceHistory = useMemo(() => {
    const history: Record<string, PriceHistory[]> = {};
    markets.forEach((market) => {
      market.products.forEach((product) => {
        if (!history[product.name]) {
          history[product.name] = generatePriceHistory(product.price);
        }
      });
    });
    return history;
  }, [markets]);

  const handleUpdatePrice = (marketId: string, productId: string, newPrice: number) => {
    setMarkets((prev) =>
      prev.map((market) =>
        market.id === marketId
          ? {
              ...market,
              products: market.products.map((p) =>
                p.id === productId ? { ...p, price: newPrice } : p
              ),
            }
          : market
      )
    );
  };

  const handleMarkRestocked = (marketId: string, productId: string) => {
    setMarkets((prev) =>
      prev.map((market) =>
        market.id === marketId
          ? {
              ...market,
              products: market.products.map((p) =>
                p.id === productId ? { ...p, available: true } : p
              ),
            }
          : market
      )
    );
  };

  const handleAddReview = (marketId: string, rating: number, comment: string) => {
    setMarkets((prev) =>
      prev.map((market) => {
        if (market.id !== marketId) return market;
        const newReview = {
          id: `r${Date.now()}`,
          userName: currentUser.name,
          rating,
          comment,
          date: new Date().toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        };
        const updatedReviews = [...market.reviews, newReview];
        const newRating =
          updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length;
        return { ...market, reviews: updatedReviews, rating: Number(newRating.toFixed(1)) };
      })
    );
  };

  const categories = useMemo(
    () => [...new Set(markets.map((m) => m.category))].sort(),
    [markets]
  );

  const marketLocations = useMemo(
    () => [...new Set(markets.map((m) => m.marketLocation))].sort(),
    [markets]
  );

  const filteredAndSortedMarkets = useMemo(() => {
    let filtered = markets.filter((market) => {
      const matchesSearch =
        market.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        market.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || market.category === selectedCategory;
      const matchesOpenStatus = !showOpenOnly || market.isOpen;
      const matchesLocation =
        selectedMarketLocation === "all" || market.marketLocation === selectedMarketLocation;
      return matchesSearch && matchesCategory && matchesOpenStatus && matchesLocation;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "rating": return a.rating - b.rating;
        case "rating-desc": return b.rating - a.rating;
        default: return 0;
      }
    });

    return filtered;
  }, [markets, searchTerm, selectedCategory, sortBy, showOpenOnly, selectedMarketLocation]);

  // ── Vista: panel de un puesto específico ──────────────────────────────────
  if (isVendorMode && selectedVendorMarket) {
    const market = markets.find((m) => m.id === selectedVendorMarket);
    if (market) {
      return (
        <div className="min-h-screen bg-background">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-6 px-4 shadow-lg">
            <div className="container mx-auto">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20 mb-4"
                onClick={() => setSelectedVendorMarket(null)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Mis Puestos
              </Button>
            </div>
          </div>
          <div className="container mx-auto px-4 py-8">
            <VendorDashboard
              market={market}
              onUpdatePrice={(productId, newPrice) =>
                handleUpdatePrice(market.id, productId, newPrice)
              }
              onMarkRestocked={(productId) => handleMarkRestocked(market.id, productId)}
              priceHistory={priceHistory}
              averagePrices={averagePrices}
              referencePrices={REFERENCE_PRICES}
            />
          </div>
        </div>
      );
    }
  }

  // ── Vista: lista de puestos del vendedor ──────────────────────────────────
  if (isVendorMode) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-8 px-4 shadow-lg">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  <Store className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="mb-0 text-white drop-shadow-lg">🏪 Panel de Vendedor</h1>
                  <p className="text-white/90 text-lg">Gestiona tus puestos y precios</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleToggleVendorMode}
                  className="bg-white/20 hover:bg-white/30 text-white"
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Modo Comprador
                </Button>
                <div className="flex items-center gap-3 bg-white/20 rounded-full pl-4 pr-2 py-2 backdrop-blur-sm">
                  <span className="text-sm font-bold text-white">{currentUser.name}</span>
                  <Avatar className="w-11 h-11 border-2 border-white shadow-lg">
                    <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                      <span className="font-bold text-white">{currentUser.avatar}</span>
                    </div>
                  </Avatar>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Mis Puestos</h2>
            <p className="text-gray-600">Selecciona un puesto para gestionar precios y stock</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.slice(0, 3).map((market) => (
              <div
                key={market.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow border-l-4"
                style={{ borderLeftColor: market.color }}
                onClick={() => setSelectedVendorMarket(market.id)}
              >
                <div className="h-48 overflow-hidden">
                  <img src={market.image} alt={market.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-xl">{market.name}</h3>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: market.color }}
                    >
                      {market.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{market.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{market.products.length} productos</span>
                    <span className="font-bold" style={{ color: market.color }}>
                      Ver Panel →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Vista: comprador (home, map, ai) ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar
        currentView={currentView}
        onViewChange={handleViewChange}
        currentUser={currentUser}
        isVendorMode={isVendorMode}
        onToggleVendorMode={handleToggleVendorMode}
      />

      {currentView === "map" && <MapView markets={markets} />}

      {currentView === "ai" && <AIBasket markets={markets} />}

      {currentView === "home" && (
        <div className="px-4 py-4">
          <SearchAndFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
            categories={categories}
            showOpenOnly={showOpenOnly}
            onShowOpenOnlyChange={setShowOpenOnly}
            selectedMarketLocation={selectedMarketLocation}
            onMarketLocationChange={setSelectedMarketLocation}
            marketLocations={marketLocations}
          />

          <div className="mb-4 bg-white rounded-xl p-3 shadow-sm border-l-4 border-orange-500">
            <p className="text-sm font-bold text-gray-700">
              📊 {filteredAndSortedMarkets.length} de {markets.length} puestos
              {selectedMarketLocation !== "all" && (
                <span className="ml-2 text-orange-600">en {selectedMarketLocation}</span>
              )}
            </p>
          </div>

          <MarketGrid markets={filteredAndSortedMarkets} onAddReview={handleAddReview} />
        </div>
      )}
    </div>
  );
}