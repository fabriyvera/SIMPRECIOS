"use client";

import { useState, useMemo } from "react";
import { SearchAndFilter } from "@/components/SearchAndFilter";
import { MarketGrid } from "@/components/MarketGrid";
// Importación vital para que no salga "not defined"
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

  // --- Lógica de Negocio / Handlers ---

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

  // NUEVO: Manejador para registrar productos desde el Dashboard
  const handleRegisterProduct = (marketId: string, productName: string, price: number) => {
    setMarkets((prev) =>
      prev.map((m) => {
        if (m.id !== marketId) return m;
        const newProduct = {
          id: `p-${Date.now()}`,
          name: productName,
          price: price,
          available: true,
        };
        return { ...m, products: [...m.products, newProduct] };
      })
    );
  };

  // NUEVO: Manejador para cambiar disponibilidad de stock
  const handleToggleStock = (marketId: string, productId: string) => {
    setMarkets((prev) =>
      prev.map((m) =>
        m.id === marketId
          ? {
              ...m,
              products: m.products.map((p) =>
                p.id === productId ? { ...p, available: !p.available } : p
              ),
            }
          : m
      )
    );
  };

  // --- Memos para Datos ---

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

  // --- Filtros ---

  const categories = useMemo(() => [...new Set(markets.map((m) => m.category))].sort(), [markets]);
  const marketLocations = useMemo(() => [...new Set(markets.map((m) => m.marketLocation))].sort(), [markets]);

  const filteredAndSortedMarkets = useMemo(() => {
    let filtered = markets.filter((market) => {
      const matchesSearch = market.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            market.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || market.category === selectedCategory;
      const matchesOpenStatus = !showOpenOnly || market.isOpen;
      const matchesLocation = selectedMarketLocation === "all" || market.marketLocation === selectedMarketLocation;
      return matchesSearch && matchesCategory && matchesOpenStatus && matchesLocation;
    });

    filtered.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "rating-desc") return b.rating - a.rating;
      return 0;
    });

    return filtered;
  }, [markets, searchTerm, selectedCategory, sortBy, showOpenOnly, selectedMarketLocation]);

  // --- Vistas Condicionales ---

  // 1. Vista: Panel de Vendedor Detallado
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
                <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Mis Puestos
              </Button>
            </div>
          </div>
          <div className="container mx-auto px-4 py-8">
            <VendorDashboard
              market={market}
              onUpdatePrice={(prodId, price) => handleUpdatePrice(market.id, prodId, price)}
              onMarkRestocked={(prodId) => handleMarkRestocked(market.id, prodId)}
              onRegisterProduct={(name, price) => handleRegisterProduct(market.id, name, price)}
              onToggleStock={(prodId) => handleToggleStock(market.id, prodId)}
              onNotifyStock={(prodId) => console.log("Notificar stock:", prodId)}
              priceHistory={priceHistory}
              averagePrices={averagePrices}
              referencePrices={REFERENCE_PRICES}
            />
          </div>
        </div>
      );
    }
  }

  // 2. Vista: Lista de Puestos del Vendedor
  if (isVendorMode) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-8 px-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Store className="w-8 h-8" />
              <h1 className="text-white text-2xl font-bold">Panel de Vendedor</h1>
            </div>
            <Button onClick={() => setIsVendorMode(false)} className="bg-white/20 hover:bg-white/30 text-white">
              Modo Comprador
            </Button>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {markets.slice(0, 3).map((m) => (
            <div key={m.id} onClick={() => setSelectedVendorMarket(m.id)} className="cursor-pointer border rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white">
              <img src={m.image} alt={m.name} className="h-40 w-full object-cover" />
              <div className="p-4">
                <h3 className="font-bold">{m.name}</h3>
                <p className="text-sm text-gray-500">{m.category}</p>
                <p className="mt-2 text-blue-600 font-bold">Ver Panel →</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. Vista: Comprador (Home)
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v)}
        currentUser={currentUser}
        isVendorMode={isVendorMode}
        onToggleVendorMode={() => setIsVendorMode(!isVendorMode)}
      />

      <div className="container mx-auto px-4 py-4">
        {currentView === "home" && (
          <>
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
            <MarketGrid markets={filteredAndSortedMarkets} onAddReview={() => {}} />
          </>
        )}
        {currentView === "map" && <MapView markets={markets} />}
        {currentView === "ai" && <AIBasket markets={markets} />}
      </div>
    </div>
  );
}