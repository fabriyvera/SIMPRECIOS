"use client";

import { useState, useMemo } from "react";
import { SearchAndFilter } from "@/components/SearchAndFilter";
import { MarketGrid } from "@/components/MarketGrid";
import { VendorDashboard } from "@/components/VendorDashboard"; 
import { Navbar } from "@/components/Navbar";
import { MapView } from "@/components/MapView";
import { AIBasket } from "@/components/AIBasket";
import { ArrowLeft, Store, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { INITIAL_MARKETS, REFERENCE_PRICES, generatePriceHistory } from "@/lib/data";
import { Market, AppView, PriceHistory } from "@/types";

export default function HomeClient() {
  const [currentUser] = useState({ name: "Juan Pérez", avatar: "JP", isVendor: true });
  const [currentView, setCurrentView] = useState<AppView>("home");
  const [isVendorMode, setIsVendorMode] = useState(false);
  const [selectedVendorMarket, setSelectedVendorMarket] = useState<string | null>(null);
  const [markets, setMarkets] = useState<Market[]>(INITIAL_MARKETS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMarketLocation, setSelectedMarketLocation] = useState("all");

  // --- Handlers para el Dashboard ---
  const handleUpdatePrice = (mId: string, pId: string, price: number) => {
    setMarkets(prev => prev.map(m => m.id === mId ? {
      ...m, products: m.products.map(p => p.id === pId ? { ...p, price } : p)
    } : m));
  };

  const handleRegisterProduct = (mId: string, name: string, price: number) => {
    setMarkets(prev => prev.map(m => m.id === mId ? {
      ...m, products: [...m.products, { id: `p-${Date.now()}`, name, price, available: true }]
    } : m));
  };

  const handleToggleStock = (mId: string, pId: string) => {
    setMarkets(prev => prev.map(m => m.id === mId ? {
      ...m, products: m.products.map(p => p.id === pId ? { ...p, available: !p.available } : p)
    } : m));
  };

  // --- Memos para cálculos ---
  const averagePrices = useMemo(() => {
    const averages: Record<string, number> = {};
    const priceMap: Record<string, number[]> = {};
    markets.forEach(m => m.products.forEach(p => {
      if (!priceMap[p.name]) priceMap[p.name] = [];
      priceMap[p.name].push(p.price);
    }));
    Object.entries(priceMap).forEach(([name, prices]) => {
      averages[name] = prices.reduce((a, b) => a + b, 0) / prices.length;
    });
    return averages;
  }, [markets]);

  const priceHistory = useMemo(() => {
    const history: Record<string, PriceHistory[]> = {};
    markets.forEach(m => m.products.forEach(p => {
      if (!history[p.name]) history[p.name] = generatePriceHistory(p.price);
    }));
    return history;
  }, [markets]);

  // --- Lógica de Vistas ---

  // VISTA 1: DASHBOARD DETALLADO (Cuando entras a un puesto)
  if (isVendorMode && selectedVendorMarket) {
    const market = markets.find(m => m.id === selectedVendorMarket);
    if (market) {
      return (
        <div className="min-h-screen bg-background">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 shadow-md">
            <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => setSelectedVendorMarket(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver a mis puestos
            </Button>
          </div>
          <div className="container mx-auto p-6">
            <VendorDashboard
              market={market}
              onUpdatePrice={(pid, price) => handleUpdatePrice(market.id, pid, price)}
              onMarkRestocked={(pid) => handleToggleStock(market.id, pid)}
              onRegisterProduct={(n, p) => handleRegisterProduct(market.id, n, p)}
              onToggleStock={(pid) => handleToggleStock(market.id, pid)}
              onNotifyStock={(pid) => console.log(pid)}
              priceHistory={priceHistory}
              averagePrices={averagePrices}
              referencePrices={REFERENCE_PRICES}
            />
          </div>
        </div>
      );
    }
  }

  // VISTA 2: LISTA DE PUESTOS DEL VENDEDOR
  if (isVendorMode) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Store className="w-10 h-10" />
              <h1 className="text-3xl font-bold">Mis Puestos</h1>
            </div>
            <Button onClick={() => setIsVendorMode(false)} className="bg-white text-purple-600 hover:bg-gray-100">
              <ShoppingBag className="w-4 h-4 mr-2" /> Modo Comprador
            </Button>
          </div>
        </div>
        <div className="container mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {markets.slice(0, 3).map(m => (
            <div key={m.id} onClick={() => setSelectedVendorMarket(m.id)} className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform border-l-8" style={{ borderLeftColor: m.color }}>
              <img src={m.image} className="h-40 w-full object-cover" alt={m.name} />
              <div className="p-5">
                <h3 className="text-xl font-bold">{m.name}</h3>
                <p className="text-blue-600 font-medium">Gestionar Precios →</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // VISTA 3: MODO COMPRADOR (HOME)
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        currentUser={currentUser} 
        isVendorMode={isVendorMode}
        onToggleVendorMode={() => setIsVendorMode(!isVendorMode)} 
      />
      <div className="container mx-auto px-4 py-6">
        {currentView === "home" && (
          <>
            <SearchAndFilter 
              searchTerm={searchTerm} onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory}
              selectedMarketLocation={selectedMarketLocation} onMarketLocationChange={setSelectedMarketLocation}
              categories={[]} marketLocations={[]} sortBy="name" onSortChange={() => {}} showOpenOnly={false} onShowOpenOnlyChange={() => {}}
            />
            <MarketGrid 
              markets={markets.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))} 
              onAddReview={() => {}} 
              priceHistory={priceHistory}
              averagePrices={averagePrices}
              referencePrices={REFERENCE_PRICES}
            />
          </>
        )}
        {currentView === "map" && <MapView markets={markets} />}
        {currentView === "ai" && <AIBasket markets={markets} />}
      </div>
    </div>
  );
}