"use client";

import { useState, useMemo, useEffect } from "react";
import { SearchAndFilter } from "@/components/SearchAndFilter";
import { MarketGrid } from "@/components/MarketGrid";
import { VendorDashboard } from "@/components/VendorDashboard";
import { Navbar } from "@/components/Navbar";
import { MapView } from "@/components/MapView";
import { AIBasket } from "@/components/AIBasket";
import { SavedBaskets } from "@/components/SavedBaskets";
import { ShoppingBag, Store, ArrowLeft, Sparkles, Save } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  INITIAL_MARKETS,
  REFERENCE_PRICES,
  generatePriceHistory,
} from "@/lib/data";
import {
  Market,
  AppView,
  PriceHistory,
  UserLocation,
  SessionUser,
} from "@/types";
import { LoginView } from "@/components/LoginView";
import { RegisterView } from "@/components/RegisterView";
import { RecoverView } from "@/components/RecoverView";
import { VerifyView } from "@/components/VerifyView";
import { ProfileView } from "@/components/ProfileView";
import { ToastProvider } from "@/components/Toast";
import { createClient } from "@/utils/supabase/client";
import { marketsAPI } from "@/services/api/markets";
import { pricesAPI } from "@/services/api/prices";
import { interaccionAPI } from "@/services/api/interaccion-client";

interface HomeClientProps {
  initialMarkets?: any[];
  serverRole?: string;
}

export default function HomeClient({ initialMarkets, serverRole }: HomeClientProps) {
  const supabase = createClient();

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [userRole, setUserRole] = useState<"Vendedora" | "Comprador">("Comprador");
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const [currentView, setCurrentView] = useState<AppView>("home");
  const [isVendorMode, setIsVendorMode] = useState(false);
  const [selectedVendorMarket, setSelectedVendorMarket] = useState<string | null>(null);

  const [markets, setMarkets] = useState<Market[]>(
    initialMarkets && initialMarkets.length > 0 ? initialMarkets : INITIAL_MARKETS,
  );
  const [vendorMarkets, setVendorMarkets] = useState<Market[]>([]);
  const [calificacionesPorPuesto, setCalificacionesPorPuesto] = useState<Record<string, number>>({});

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMarketLocation, setSelectedMarketLocation] = useState("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [favoriteMarketIds, setFavoriteMarketIds] = useState<string[]>([]);
  const [activeAiTab, setActiveAiTab] = useState<"generar" | "guardadas">("generar");
  const [basketToModify, setBasketToModify] = useState<any>(null);

  // ── Helper para obtener headers de autenticación ──
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
  };

  // ── Geolocalización ──
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: -16.5, lng: -68.15 }),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 },
    );
  }, []);

  // ── OBTENER USUARIO Y PERFIL ──
  useEffect(() => {
    const getAuthUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userId = session.user.id;
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("rol, nombre_completo")
          .eq("id", userId)
          .maybeSingle();

        if (error) console.error("Error perfil:", error);

        if (profile) {
          setSessionUser({
            id: userId,
            email: session.user.email || "",
            rol: profile.rol,
            user_metadata: { full_name: profile.nombre_completo },
          });
          setUserRole(profile.rol);

          if (profile.rol === "Vendedora") {
            try {
              const headers = await getAuthHeaders();
              const puestos = await pricesAPI.getVendorPuestos(userId, headers);
              setVendorMarkets(puestos);
            } catch (err) {
              console.error("Error cargando puestos del vendedor:", err);
            }
            setCurrentView("vendor");
            setIsVendorMode(true);
          } else {
            setCurrentView("home");
            setIsVendorMode(false);
          }
        } else {
          const { data: newProfile } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              nombre_completo: session.user.user_metadata?.nombre_completo || session.user.email,
              rol: "Comprador",
            })
            .select()
            .maybeSingle();
          if (newProfile) {
            setSessionUser({
              id: userId,
              email: session.user.email || "",
              rol: newProfile.rol,
              user_metadata: { full_name: newProfile.nombre_completo },
            });
            setUserRole("Comprador");
            setCurrentView("home");
            setIsVendorMode(false);
          }
        }
      } else {
        setSessionUser(null);
        setUserRole("Comprador");
        setCurrentView("home");
        setIsVendorMode(false);
        setVendorMarkets([]);
      }
      setInitialLoadComplete(true);
    };

    getAuthUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        getAuthUser();
      } else if (event === "SIGNED_OUT") {
        setSessionUser(null);
        setUserRole("Comprador");
        setCurrentView("home");
        setIsVendorMode(false);
        setVendorMarkets([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Sincronizar mercados (stock) ──
  useEffect(() => {
    const syncWithDatabase = async () => {
      try {
        const dbData = await marketsAPI.getMarkets();
        if (!dbData || dbData.length === 0) return;

        const mappedMarkets = dbData.map((dbMarket: any, index: number) => {
          const productosReales = (dbMarket.stock_vendedora || []).map((stock: any) => {
            const prodMaestro = stock.productos_mercado || {};
            return {
              id: prodMaestro.id ? prodMaestro.id.toString() : stock.id.toString(),
              name: prodMaestro.nombre_producto ? prodMaestro.nombre_producto.trim() : "Producto",
              price: stock.precio_actual,
              available: stock.disponible,
            };
          });

          const esCarne = dbMarket.sector?.toLowerCase().includes("carne");
          const color = esCarne ? "#ef4444" : "#0a6e34";
          const image = esCarne
            ? "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500&auto=format&fit=crop&q=60"
            : "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60";

          const mercadoInfo = dbMarket.mercados || dbMarket.mercado || {};
          const marketLocation = mercadoInfo.nombre || "Mercado Central";

          return {
            id: dbMarket.id.toString(),
            vendorId: dbMarket.vendorId,
            name: dbMarket.nombre_puesto || "Puesto de Venta",
            description: esCarne ? "Carnes frescas de primera calidad" : "Frutas y verduras frescas del productor",
            category: dbMarket.sector || (esCarne ? "Carnes" : "Verduras"),
            marketLocation,
            isOpen: dbMarket.esta_abierto !== undefined ? dbMarket.esta_abierto : true,
            image,
            imageUrl: image,
            color,
            products: productosReales,
            rating: dbMarket.calificacion_promedio || 4.5 + ((index * 0.1) % 0.5),
            reviews: [],
          };
        });

        setMarkets(mappedMarkets);

        if (sessionUser?.rol === "Vendedora") {
          try {
            const headers = await getAuthHeaders();
            const puestos = await pricesAPI.getVendorPuestos(sessionUser.id, headers);
            setVendorMarkets(puestos);
          } catch (err) {
            const misPuestos = mappedMarkets.filter((m: any) => m.vendorId === sessionUser.id);
            if (misPuestos.length) setVendorMarkets(misPuestos);
          }
        }
      } catch (error) {
        console.error("Error cargando mercados en HomeClient:", error);
      }
    };

    syncWithDatabase();
  }, [sessionUser?.id]);

  // ── Cargar favoritos y calificaciones ──
  useEffect(() => {
    const loadUserData = async () => {
      if (!sessionUser?.id) return;
      try {
        const headers = await getAuthHeaders();
        if (!headers.Authorization) return;

        try {
          const calData = await interaccionAPI.getCalificaciones(headers);
          const map: Record<string, number> = {};
          calData.calificaciones?.forEach((c: any) => { map[c.puesto_id] = c.estrellas; });
          setCalificacionesPorPuesto(map);
        } catch (err) {
          console.error("Error cargando calificaciones:", err);
        }

        try {
          const favData = await interaccionAPI.listarFavoritos(headers);
          const ids = favData.favoritos?.map((f: any) => f.puesto_id) || [];
          setFavoriteMarketIds(ids);
          localStorage.setItem("favoriteMarkets", JSON.stringify(ids));
        } catch (err) {
          console.error("Error cargando favoritos:", err);
        }
      } catch (error) {
        console.error("Error cargando datos del usuario:", error);
      }
    };
    loadUserData();
  }, [sessionUser?.id]);

  // ── Recargar calificaciones ──
  const recargarCalificaciones = async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) return;
      const data = await interaccionAPI.getCalificaciones(headers);
      const map: Record<string, number> = {};
      data.calificaciones?.forEach((c: any) => { map[c.puesto_id] = c.estrellas; });
      setCalificacionesPorPuesto(map);
    } catch (err) {
      console.error("Error recargando calificaciones:", err);
    }
  };

  // ── Handlers ──
  const handleViewChange = (view: AppView) => {
    if (view === "vendor") {
      setIsVendorMode(true);
      setSelectedVendorMarket(null);
    } else {
      setIsVendorMode(false);
    }
    setCurrentView(view);
  };

  const handleUpdatePrice = (marketId: string, productId: string, newPrice: number) => {
    const updateFn = (list: Market[]) =>
      list.map((m) =>
        m.id === marketId
          ? { ...m, products: m.products.map((p) => p.id === productId ? { ...p, price: newPrice } : p) }
          : m,
      );
    setMarkets(updateFn);
    setVendorMarkets(updateFn);
  };

  const handleToggleStock = (marketId: string, productId: string) => {
    const toggleFn = (list: Market[]) =>
      list.map((m) =>
        m.id === marketId
          ? { ...m, products: m.products.map((p) => p.id === productId ? { ...p, available: !p.available } : p) }
          : m,
      );
    setMarkets(toggleFn);
    setVendorMarkets(toggleFn);
  };

  const handleAddReview = (marketId: string, rating: number, comment: string) => {
    setMarkets((prev) =>
      prev.map((m) => {
        if (m.id !== marketId) return m;
        const newReview = {
          id: `r${Date.now()}`,
          userName: sessionUser?.user_metadata?.full_name || "Usuario",
          rating,
          comment,
          date: new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }),
        };
        const updatedReviews = [...m.reviews, newReview];
        const newRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length;
        return { ...m, reviews: updatedReviews, rating: Number(newRating.toFixed(1)) };
      }),
    );
  };

  const handleToggleFavorite = async (marketId: string) => {
    const isFavorite = favoriteMarketIds.includes(marketId);
    let newFavs: string[];
    const headers = await getAuthHeaders();

    if (isFavorite) {
      newFavs = favoriteMarketIds.filter((id) => id !== marketId);
      if (sessionUser?.id && headers.Authorization) {
        try {
          await interaccionAPI.eliminarFavorito(marketId, headers);
        } catch (err) {
          console.error("Error eliminando favorito:", err);
        }
      }
    } else {
      newFavs = [...favoriteMarketIds, marketId];
      if (sessionUser?.id && headers.Authorization) {
        try {
          await interaccionAPI.agregarFavorito(marketId, headers);
        } catch (err) {
          console.error("Error agregando favorito:", err);
        }
      }
    }
    setFavoriteMarketIds(newFavs);
    localStorage.setItem("favoriteMarkets", JSON.stringify(newFavs));
  };

  const handleReportOverprice = (marketId: string, report: any) => {
    console.log("Reporte de sobreprecio", { marketId, report });
  };

  // ── Memorización ──
  const averagePrices = useMemo(() => {
    const priceMap: Record<string, number[]> = {};
    markets.forEach((m) => m.products.forEach((p) => {
      if (!priceMap[p.name]) priceMap[p.name] = [];
      priceMap[p.name].push(p.price);
    }));
    const averages: Record<string, number> = {};
    Object.entries(priceMap).forEach(([name, prices]) => {
      averages[name] = prices.reduce((a, b) => a + b, 0) / prices.length;
    });
    return averages;
  }, [markets]);

  const priceHistory = useMemo(() => {
    const history: Record<string, PriceHistory[]> = {};
    markets.forEach((m) => m.products.forEach((p) => {
      if (!history[p.name]) history[p.name] = generatePriceHistory(p.price);
    }));
    return history;
  }, [markets]);

  const categories = useMemo(
    () => [...new Set(markets.map((m) => m.category || "General"))].sort(),
    [markets],
  );
  const marketLocations = useMemo(
    () => [...new Set(markets.map((m) => m.marketLocation || "Mercado Central"))].sort(),
    [markets],
  );

  const finalMarkets = useMemo(() => {
    let filtered = markets.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === "all" || m.category === selectedCategory;
      const matchesLoc = selectedMarketLocation === "all" || m.marketLocation === selectedMarketLocation;
      const matchesOpen = !showOpenOnly || m.isOpen;
      const matchesFav = !showFavoritesOnly || favoriteMarketIds.includes(m.id);
      return matchesSearch && matchesCat && matchesLoc && matchesOpen && matchesFav;
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
  }, [markets, searchTerm, selectedCategory, selectedMarketLocation, showOpenOnly, showFavoritesOnly, favoriteMarketIds, sortBy]);

  const vendorFilteredMarkets = useMemo(() => {
    if (vendorMarkets.length) return vendorMarkets;
    if (sessionUser?.id && markets.length) {
      return markets.filter((m) => m.vendorId === sessionUser.id);
    }
    return [];
  }, [vendorMarkets, markets, sessionUser?.id]);

  // ── Pantalla de carga ──
  if (!initialLoadComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="text-sm font-semibold text-gray-500 animate-pulse mt-4">Iniciando entorno seguro...</p>
      </div>
    );
  }

  // ── Vistas de autenticación ──
  if (currentView === "login") return <LoginView onViewChange={handleViewChange} />;
  if (currentView === "registro") return <RegisterView onViewChange={handleViewChange} />;
  if (currentView === "recuperar") return <RecoverView onViewChange={handleViewChange} />;
  if (currentView === "verificar") return <VerifyView onViewChange={handleViewChange} />;
  if (currentView === "perfil") return <ProfileView onViewChange={handleViewChange} />;

  // ── Panel de vendedor (detalle de un puesto) ──
  if (isVendorMode && selectedVendorMarket) {
    const market = vendorFilteredMarkets.find((m) => m.id === selectedVendorMarket);
    if (market) {
      return (
        <div className="min-h-screen bg-background">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-6 px-4 shadow-lg">
            <div className="container mx-auto">
              <Button variant="ghost" className="text-white hover:bg-white/20 mb-4" onClick={() => setSelectedVendorMarket(null)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Mis Puestos
              </Button>
            </div>
          </div>
          <div className="container mx-auto px-4 py-8">
            <VendorDashboard
              market={market}
              onUpdatePrice={(productId, newPrice) => handleUpdatePrice(market.id, productId, newPrice)}
              onMarkRestocked={(productId) => handleToggleStock(market.id, productId)}
              onDeleteProduct={async (productId) => {
                // 👈 agregar token al eliminar producto
                try {
                  const headers = await getAuthHeaders();
                  await pricesAPI.deletePrice(market.id, productId, headers);
                } catch (err) {
                  console.error("Error eliminando producto:", err);
                }
                setMarkets((prev) =>
                  prev.map((m) => m.id === market.id ? { ...m, products: m.products.filter((p) => p.id !== productId) } : m)
                );
                setVendorMarkets((prev) =>
                  prev.map((m) => m.id === market.id ? { ...m, products: m.products.filter((p) => p.id !== productId) } : m)
                );
              }}
              onRegisterProduct={async (name, price) => {
                if (!name.trim() || !price) return;
                const nombreFormateado = name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();
                const precioNumerico = parseFloat(price.toString());
                try {
                  const headers = await getAuthHeaders(); // 👈 token
                  const data = await pricesAPI.updatePrice({
                    puesto_id: parseInt(market.id, 10),
                    producto_id: 0,
                    nombre_producto: nombreFormateado,
                    precio_actual: precioNumerico,
                  }, headers);
                  const newId = data.producto_id ? data.producto_id.toString() : `p-${Date.now()}`;
                  const addProd = (list: Market[]) =>
                    list.map((m) =>
                      m.id === market.id
                        ? { ...m, products: [...m.products, { id: newId, name: nombreFormateado, price: precioNumerico, available: true }] }
                        : m,
                    );
                  setMarkets(addProd);
                  setVendorMarkets(addProd);
                } catch (e) {
                  console.error("Error registrando producto:", e);
                }
              }}
              onToggleStock={(productId) => handleToggleStock(market.id, productId)}
              onNotifyStock={(productId) => {
                setMarkets((prev) =>
                  prev.map((m) => m.id === market.id ? { ...m, products: m.products.map((p) => p.id === productId ? { ...p, available: false } : p) } : m)
                );
                setVendorMarkets((prev) =>
                  prev.map((m) => m.id === market.id ? { ...m, products: m.products.map((p) => p.id === productId ? { ...p, available: false } : p) } : m)
                );
              }}
              priceHistory={priceHistory}
              averagePrices={averagePrices}
              referencePrices={market.products.reduce(
                (acc, p) => ({ ...acc, [p.name.trim()]: (p as any).refPrice || p.price }),
                {},
              )}
            />
          </div>
        </div>
      );
    }
  }

  // ── Lista de puestos del vendedor ──
  if (isVendorMode) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Navbar currentView={currentView} onViewChange={handleViewChange} sessionUser={sessionUser} />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1">Mis Puestos</h2>
            <p className="text-sm text-gray-600">Selecciona un puesto para gestionar precios, productos y stock.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendorFilteredMarkets.map((market) => (
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
                    <span className="px-3 py-1 rounded-full text-sm font-bold text-white" style={{ backgroundColor: market.color }}>
                      {market.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{market.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{market.products.length} productos</span>
                    <span className="font-bold" style={{ color: market.color }}>Ver Panel →</span>
                  </div>
                </div>
              </div>
            ))}
            {vendorFilteredMarkets.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed p-6">
                No tienes ningún puesto asignado actualmente.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Vista comprador ──
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background pb-20">
        <Navbar currentView={currentView} onViewChange={handleViewChange} sessionUser={sessionUser} />
        <div className="container mx-auto px-4 py-6">
          {currentView === "home" && (
            <>
              <SearchAndFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedMarketLocation={selectedMarketLocation}
                onMarketLocationChange={setSelectedMarketLocation}
                categories={categories}
                marketLocations={marketLocations}
                sortBy={sortBy}
                onSortChange={setSortBy}
                showOpenOnly={showOpenOnly}
                onShowOpenOnlyChange={setShowOpenOnly}
                showFavoritesOnly={showFavoritesOnly}
                onShowFavoritesOnlyChange={setShowFavoritesOnly}
              />
              <div className="mb-4 bg-white rounded-xl p-3 shadow-sm border-l-4 border-orange-500">
                <p className="text-sm font-bold text-gray-700">
                  {finalMarkets.length} de {markets.length} puestos
                  {selectedMarketLocation !== "all" && <span className="ml-2 text-orange-600">en {selectedMarketLocation}</span>}
                  {showFavoritesOnly && <span className="ml-2 text-orange-600">(solo favoritos)</span>}
                </p>
              </div>
              <MarketGrid
                markets={finalMarkets}
                onAddReview={handleAddReview}
                allMarkets={markets}
                priceHistory={priceHistory}
                averagePrices={averagePrices}
                referencePrices={REFERENCE_PRICES}
                favoriteMarketIds={favoriteMarketIds}
                onToggleFavorite={handleToggleFavorite}
                onReportOverprice={handleReportOverprice}
                userLocation={userLocation}
                sortBy={sortBy}
                userId={sessionUser?.id}
                userRole={userRole}
                calificacionesPorPuesto={calificacionesPorPuesto}
                onCalificacionChanged={recargarCalificaciones}
              />
            </>
          )}
          {currentView === "map" && <MapView markets={finalMarkets} userLocation={userLocation} />}
          {currentView === "ai" && (
            <div className="max-w-2xl mx-auto w-full flex flex-col gap-4">
              <div className="bg-slate-100/80 backdrop-blur-sm p-1.5 rounded-2xl flex mx-4 border border-slate-200/60 shadow-sm mt-2">
                <button
                  onClick={() => setActiveAiTab("generar")}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeAiTab === "generar"
                      ? "bg-white text-purple-700 shadow-sm ring-1 ring-slate-900/5"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Nueva Consulta IA
                </button>
                <button
                  onClick={() => setActiveAiTab("guardadas")}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeAiTab === "guardadas"
                      ? "bg-white text-purple-700 shadow-sm ring-1 ring-slate-900/5"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
                >
                  <Save className="w-4 h-4" />
                  Mis Guardadas
                </button>
              </div>
              <div className="animate-in fade-in zoom-in-95 duration-300">
                {activeAiTab === "generar" ? (
                  <AIBasket markets={markets} initialData={basketToModify} />
                ) : (
                  <SavedBaskets
                    markets={markets}
                    onModifyBasket={(basket) => {
                      setBasketToModify(basket);
                      setActiveAiTab("generar");
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ToastProvider>
  );
}