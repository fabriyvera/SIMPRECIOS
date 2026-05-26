"use client";

import { useState, useMemo, useEffect } from "react";
import { SearchAndFilter } from "@/components/SearchAndFilter";
import { MarketGrid } from "@/components/MarketGrid";
import { VendorDashboard } from "@/components/VendorDashboard";
import { Navbar } from "@/components/Navbar";
import { MapView } from "@/components/MapView";
import { AIBasket } from "@/components/AIBasket";
import { SavedBaskets } from "@/components/SavedBaskets";
import { ShoppingBag, Store, ArrowLeft } from "lucide-react";
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

interface HomeClientProps {
  initialMarkets?: any[];
}

export default function HomeClient({ initialMarkets }: HomeClientProps) {
  const [currentUser] = useState({
    name: "Juan Pérez",
    avatar: "JP",
    isVendor: true,
  });

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [userRole, setUserRole] = useState<"Vendedora" | "Comprador">(
    "Comprador",
  );
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

useEffect(() => {
  const supabase = createClient();

  const getAuthUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const userId = session.user.id;
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('rol, nombre_completo')
        .eq('id', userId)
        .maybeSingle();

      if (error) console.error("Error perfil:", error);
      if (profile) {
        setSessionUser({
          id: userId,
          email: session.user.email || '',
          rol: profile.rol,
          user_metadata: { full_name: profile.nombre_completo },
        });
        setUserRole(profile.rol);
      } else {
        // Crear perfil por si no existe
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            nombre_completo: session.user.user_metadata?.nombre_completo || session.user.email,
            rol: 'Comprador',
          })
          .select()
          .maybeSingle();
        if (newProfile) {
          setSessionUser({
            id: userId,
            email: session.user.email || '',
            rol: newProfile.rol,
            user_metadata: { full_name: newProfile.nombre_completo },
          });
          setUserRole(newProfile.rol);
        }
      }
    } else {
      setSessionUser(null);
      setUserRole('Comprador');
    }
    setInitialLoadComplete(true);
  };

  getAuthUser();

  // Escuchar cambios en la autenticación (login/logout)
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      getAuthUser();
    } else if (event === 'SIGNED_OUT') {
      setSessionUser(null);
      setUserRole('Comprador');
      setCurrentView('home');
      setIsVendorMode(false);
    }
  });

  return () => subscription.unsubscribe();
}, []);


  const [currentView, setCurrentView] = useState<AppView>("home");
  const [isVendorMode, setIsVendorMode] = useState(false);
  const [selectedVendorMarket, setSelectedVendorMarket] = useState<
    string | null
  >(null);

  // Inicialización con datos de respaldo
  const [markets, setMarkets] = useState<Market[]>(
    initialMarkets && initialMarkets.length > 0
      ? initialMarkets
      : INITIAL_MARKETS,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMarketLocation, setSelectedMarketLocation] = useState("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  // Efecto de Geolocalización
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => setUserLocation({ lat: -16.5, lng: -68.15 }), // predeterminado La Paz
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 },
    );
  }, []);

  // ── SINCED DB: TRAER TODOS LOS PUESTOS DE LA BASE DE DATOS PARA EL CONSUMIDOR ──
  useEffect(() => {
    const syncWithDatabase = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/stock/markets");
        if (!response.ok) throw new Error("Error al consultar el backend");

        const dbData = await response.json();
        if (!dbData || dbData.length === 0) return;

        // Mapeamos recursivamente todos los puestos retornados por el backend
        const todosLosMercadosSincronizados = dbData.map(
          (dbMarket: any, index: number) => {
            const productosReales = (dbMarket.stock_vendedora || []).map(
              (stock: any) => {
                const prodMaestro = stock.productos_mercado || {};
                return {
                  id: prodMaestro.id
                    ? prodMaestro.id.toString()
                    : stock.id.toString(),
                  name: prodMaestro.nombre_producto
                    ? prodMaestro.nombre_producto.trim()
                    : "Producto",
                  price: stock.precio_actual,
                  available: stock.disponible,
                };
              },
            );

            // Clasificación visual y estilizado para separar carnes de hortalizas
            const esCarne = dbMarket.sector
              ?.toLowerCase()
              .includes("carne");
            const colorEstetico = esCarne ? "#ef4444" : "#0a6e34";
            const imagenEstetica = esCarne
              ? "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500&auto=format&fit=crop&q=60"
              : "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60";

            const mercadoInfo = dbMarket.mercados || {};
            const nombreMercado = mercadoInfo.nombre || "Mercado Central";

            return {
              id: dbMarket.id.toString(),
              name: dbMarket.nombre_puesto || "Puesto de Venta",
              description:
                (esCarne
                  ? "Carnes frescas de primera calidad"
                  : "Frutas y verduras frescas del productor"),
              category: dbMarket.sector || (esCarne ? "Carnes" : "Verduras"),
              marketLocation: nombreMercado,
              isOpen: dbMarket.esta_abierto !== undefined ? dbMarket.esta_abierto : true,
              image: imagenEstetica,
              imageUrl: imagenEstetica,
              color: colorEstetico,
              products: productosReales,
              rating: dbMarket.calificacion_promedio || (4.5 + ((index * 0.1) % 0.5)),
              reviews: [],
            };
          },
        );

        setMarkets(todosLosMercadosSincronizados);
      } catch (error) {
        console.error("Error cargando mercados en HomeClient:", error);
      }
    };

    syncWithDatabase();
  }, []);

  const [favoriteMarketIds, setFavoriteMarketIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("favoriteMarkets");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [overpriceReports, setOverpriceReports] = useState<any[]>([]);

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

  const handleUpdatePrice = (
    marketId: string,
    productId: string,
    newPrice: number,
  ) => {
    setMarkets((prev) =>
      prev.map((market) =>
        market.id === marketId
          ? {
              ...market,
              products: market.products.map((p) =>
                p.id === productId ? { ...p, price: newPrice } : p,
              ),
            }
          : market,
      ),
    );
  };

  const handleToggleStock = (marketId: string, productId: string) => {
    setMarkets((prev) =>
      prev.map((market) =>
        market.id === marketId
          ? {
              ...market,
              products: market.products.map((p) =>
                p.id === productId ? { ...p, available: !p.available } : p,
              ),
            }
          : market,
      ),
    );
  };

  const handleAddReview = (
    marketId: string,
    rating: number,
    comment: string,
  ) => {
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
          updatedReviews.reduce((acc, r) => acc + r.rating, 0) /
          updatedReviews.length;
        return {
          ...market,
          reviews: updatedReviews,
          rating: Number(newRating.toFixed(1)),
        };
      }),
    );
  };

  const handleToggleFavorite = (marketId: string) => {
    setFavoriteMarketIds((prev) => {
      const next = prev.includes(marketId)
        ? prev.filter((id) => id !== marketId)
        : [...prev, marketId];
      localStorage.setItem("favoriteMarkets", JSON.stringify(next));
      return next;
    });
  };

  const handleReportOverprice = (
    marketId: string,
    report: { productName: string; reportedPrice: string; comment: string },
  ) => {
    const newReport = {
      marketId,
      ...report,
      timestamp: new Date().toISOString(),
    };
    setOverpriceReports((prev) => [...prev, newReport]);
  };

  // ========== MEMOS ==========
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

  const categories = useMemo(
    () => [...new Set(markets.map((m) => m.category || "General"))].sort(),
    [markets],
  );

  const marketLocations = useMemo(
    () =>
      [
        ...new Set(markets.map((m) => m.marketLocation || "Mercado Central")),
      ].sort(),
    [markets],
  );

  const finalMarkets = useMemo(() => {
    let filtered = markets.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat =
        selectedCategory === "all" || m.category === selectedCategory;
      const matchesLoc =
        selectedMarketLocation === "all" ||
        m.marketLocation === selectedMarketLocation;
      const matchesOpen = !showOpenOnly || m.isOpen;
      const matchesFav = !showFavoritesOnly || favoriteMarketIds.includes(m.id);
      return (
        matchesSearch && matchesCat && matchesLoc && matchesOpen && matchesFav
      );
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "rating":
          return a.rating - b.rating;
        case "rating-desc":
          return b.rating - a.rating;
        default:
          return 0;
      }
    });
    return filtered;
  }, [
    markets,
    searchTerm,
    selectedCategory,
    selectedMarketLocation,
    showOpenOnly,
    showFavoritesOnly,
    favoriteMarketIds,
    sortBy,
  ]);

  // ========== VISTAS DE AUTENTICACIÓN ==========
  if (currentView === "login")
    return <LoginView onViewChange={handleViewChange} />;
  if (currentView === "registro")
    return <RegisterView onViewChange={handleViewChange} />;
  if (currentView === "recuperar")
    return <RecoverView onViewChange={handleViewChange} />;
  if (currentView === "verificar")
    return <VerifyView onViewChange={handleViewChange} />;
  if (currentView === "perfil")
    return <ProfileView onViewChange={handleViewChange} />;

  // ========== PANEL DE VENDEDOR ==========
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
              onMarkRestocked={(productId) =>
                handleToggleStock(market.id, productId)
              }
              // ── FLUJO DE REGISTRO UNIFICADO Y ENLAZADO AL ROUTER DE STOCK CORRECTO ──
              // ── FLUJO DE REGISTRO ALINEADO AL ROUTER DE TU MAIN.PY ──
              onRegisterProduct={async (name, price) => {
                if (!name.trim() || !price) return;

                const nombreFormateado =
                  name.trim().charAt(0).toUpperCase() +
                  name.trim().slice(1).toLowerCase();
                const precioNumerico = parseFloat(price.toString());

                try {
                  // 🎯 CORRECCIÓN: Apuntamos al prefijo /api/prices que define tu app.include_router
                  const response = await fetch(
                    "http://localhost:8000/api/prices/update",
                    {
                      // ✅ Ruta exacta alineada al backend
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        puesto_id: parseInt(market.id, 10),
                        producto_id: 0, // Mandamos 0 para activar la condicional de inserción en tu backend
                        nombre_producto: nombreFormateado,
                        precio_actual: precioNumerico,
                      }),
                    },
                  );

                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error(
                      "Error devuelto por FastAPI en el registro:",
                      errorData,
                    );
                    throw new Error("Error interno en el servidor");
                  }

                  const resData = await response.json();
                  const idAsignado =
                    resData && resData.producto_id
                      ? resData.producto_id.toString()
                      : `p-${Date.now()}`;

                  setMarkets((prev) =>
                    prev.map((m) => {
                      if (m.id !== market.id) return m;
                      return {
                        ...m,
                        products: [
                          ...m.products,
                          {
                            id: idAsignado,
                            name: nombreFormateado,
                            price: precioNumerico,
                            available: true,
                          },
                        ],
                      };
                    }),
                  );
                } catch (e) {
                  console.error(
                    "🚨 Fallback activado - Error en el flujo de registro:",
                    e,
                  );

                  const idTemporal = `tmp-${Date.now()}`;
                  setMarkets((prev) =>
                    prev.map((m) => {
                      if (m.id !== market.id) return m;

                      const yaExiste = m.products.some(
                        (p) =>
                          p.name.toLowerCase() ===
                          nombreFormateado.toLowerCase(),
                      );
                      if (yaExiste) return m;

                      return {
                        ...m,
                        products: [
                          ...m.products,
                          {
                            id: idTemporal,
                            name: nombreFormateado,
                            price: precioNumerico,
                            available: true,
                          },
                        ],
                      };
                    }),
                  );
                }
              }}
              onToggleStock={(productId) =>
                handleToggleStock(market.id, productId)
              }
              // ── ACTUALIZACIÓN VISUAL INMEDIATA AL NOTIFICAR AGOTADO ──
              onNotifyStock={(productId) => {
                // Forzamos el estado 'available: false' localmente en React
                // para que el consumidor lo vea inmediatamente en su MarketCard
                setMarkets((prev) =>
                  prev.map((m) =>
                    m.id === market.id
                      ? {
                          ...m,
                          products: m.products.map((p) =>
                            p.id === productId ? { ...p, available: false } : p,
                          ),
                        }
                      : m,
                  ),
                );
                console.log(
                  `📢 Producto ${productId} marcado como agotado y notificado al sistema.`,
                );
              }}
              priceHistory={priceHistory}
              averagePrices={averagePrices}
              referencePrices={market.products.reduce(
                (acc, p) => {
                  const nameKey = p.name.trim();
                  acc[nameKey] =
                    (p as any).refPrice !== undefined
                      ? (p as any).refPrice
                      : p.price;
                  return acc;
                },
                {} as Record<string, number>,
              )}
            />
          </div>
        </div>
      );
    }
  }

  // ========== LISTA DE PUESTOS DEL VENDEDOR ==========
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
                  <h1 className="mb-0 text-white drop-shadow-lg">
                    🏪 Panel de Vendedor
                  </h1>
                  <p className="text-white/90 text-lg">
                    Gestiona tus puestos y precios
                  </p>
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
                  <span className="text-sm font-bold text-white">
                    {currentUser.name}
                  </span>
                  <Avatar className="w-11 h-11 border-2 border-white shadow-lg">
                    <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                      <span className="font-bold text-white">
                        {currentUser.avatar}
                      </span>
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
            <p className="text-gray-600">
              Selecciona un puesto para gestionar precios y stock
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map((market) => (
              <div
                key={market.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow border-l-4"
                style={{ borderLeftColor: market.color }}
                onClick={() => setSelectedVendorMarket(market.id)}
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={market.image}
                    alt={market.name}
                    className="w-full h-full object-cover"
                  />
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
                  <p className="text-sm text-gray-600 mb-4">
                    {market.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {market.products.length} productos
                    </span>
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

  // ========== VISTA COMPRADOR (HOME, MAPA, AI) ==========
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background pb-20">
        <Navbar
          currentView={currentView}
          onViewChange={handleViewChange}
          sessionUser={sessionUser}
        />

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
                  {selectedMarketLocation !== "all" && (
                    <span className="ml-2 text-orange-600">
                      en {selectedMarketLocation}
                    </span>
                  )}
                  {showFavoritesOnly && (
                    <span className="ml-2 text-orange-600">
                      (solo favoritos)
                    </span>
                  )}
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
              />
            </>
          )}

          {currentView === "map" && (
            <MapView markets={finalMarkets} userLocation={userLocation} />
          )}

          {currentView === "ai" && (
            <div className="flex flex-col gap-12">
              <AIBasket markets={markets} />
              <SavedBaskets markets={markets} />
            </div>
          )}
        </div>
      </div>
    </ToastProvider>
  );
}
