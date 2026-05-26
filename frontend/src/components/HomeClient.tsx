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
  serverRole?: string; // 🌟 Prop inyectada por page.tsx para evitar el parpadeo
}

export default function HomeClient({ initialMarkets, serverRole }: HomeClientProps) {
  // ── 🎯 INSTANCIA DE SUPABASE ACCESIBLE EN TODO EL COMPONENTE ──
  const supabase = createClient();

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Arreglo de administración exclusivo del panel administrativo
  const [vendorMarkets, setVendorMarkets] = useState<Market[]>([]);

  // 🌟 ESTADOS INICIALIZADOS DE FORMA INMEDIATA SEGÚN EL SERVIDOR PARA EVITAR RENDERIZADOS ERRÓNEOS
  const [userRole, setUserRole] = useState<"Vendedora" | "Comprador">(
    serverRole === "Vendedora" ? "Vendedora" : "Comprador"
  );
  const [currentView, setCurrentView] = useState<AppView>(
    serverRole === "Vendedora" ? "vendor" : "home"
  );
  const [isVendorMode, setIsVendorMode] = useState(
    serverRole === "Vendedora" ? true : false
  );
  
  const [selectedVendorMarket, setSelectedVendorMarket] = useState<string | null>(null);

  // ── 🎯 CONTROLADOR CENTRALIZADO DE IDENTIDAD Y AUTENTICACIÓN (CON FORZADO DE VISTA POST-REFRESH) ──
  useEffect(() => {
    const getAuthUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userId = session.user.id;
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('rol, nombre_completo')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) console.error("Error al obtener perfil:", profileError);
        
        if (profile) {
          // Si el usuario es comerciante, disparamos la petición inmediata a tu prices.py
          if (profile.rol === "Vendedora") {
            try {
              const response = await fetch(`http://localhost:8000/api/prices/vendor-puestos/${userId}`);
              if (response.ok) {
                const puestosData = await response.json();
                if (puestosData && puestosData.length > 0) {
                  setVendorMarkets(puestosData);
                }
              }
            } catch (apiError) {
              console.error("🚨 Error al precargar puestos en getAuthUser:", apiError);
            }
            
            // 🌟 DETECCIÓN DE REFRESH CLIENT-SIDE: Sincronización secundaria de estados de vista correctos
            setCurrentView("vendor");
            setIsVendorMode(true);
          } else {
            setCurrentView("home");
            setIsVendorMode(false);
          }

          setSessionUser({
            id: userId,
            email: session.user.email || '',
            rol: profile.rol,
            user_metadata: { 
              full_name: profile.nombre_completo
            },
          } as any);
          
          setUserRole(profile.rol);
        } else {
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
            } as any);
            setUserRole(newProfile.rol);
            setCurrentView("home");
            setIsVendorMode(false);
          }
        }
      } else {
        setSessionUser(null);
        setUserRole('Comprador');
        setVendorMarkets([]);
        setCurrentView("home");
        setIsVendorMode(false);
      }
      setInitialLoadComplete(true);
    };

    getAuthUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        getAuthUser();
      } else if (event === 'SIGNED_OUT') {
        setSessionUser(null);
        setUserRole('Comprador');
        setCurrentView('home');
        setIsVendorMode(false);
        setVendorMarkets([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [markets, setMarkets] = useState<Market[]>(
    initialMarkets && initialMarkets.length > 0 ? initialMarkets : INITIAL_MARKETS,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMarketLocation, setSelectedMarketLocation] = useState("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => setUserLocation({ lat: -16.5, lng: -68.15 }),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 },
    );
  }, []);

  // ── 🎯 SINCED DB CONSUMIDOR: CARGA COMPLETA IMPERMEABLE DE RESPALDO RELACIONAL ──
  useEffect(() => {
    const syncWithDatabase = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/stock/markets");
        if (!response.ok) throw new Error("Error al consultar el backend");

        const dbData = await response.json();
        if (!dbData || dbData.length === 0) return;

        const todosLosMercadosSincronizados = dbData.map(
          (dbMarket: any, index: number) => {
            const productosReales = (dbMarket.stock_vendedora || []).map(
              (stock: any) => {
                const prodMaestro = stock.productos_mercado || {};
                return {
                  id: prodMaestro.id ? prodMaestro.id.toString() : stock.id.toString(),
                  name: prodMaestro.nombre_producto ? prodMaestro.nombre_producto.trim() : "Producto",
                  price: stock.precio_actual,
                  available: stock.disponible,
                };
              },
            );

            const esCarne = dbMarket.sector?.toLowerCase().includes("carne");
            const colorEstetico = esCarne ? "#ef4444" : "#0a6e34";
            const imagenEstetica = esCarne
              ? "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500&auto=format&fit=crop&q=60"
              : "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60";

            const infoMercado = dbMarket.mercados || dbMarket.mercado || {};
            const nombreMercado = infoMercado.nombre || "Mercado Central";

            return {
              id: dbMarket.id.toString(),
              vendedora_id: dbMarket.vendedora_id, // 🌟 Clave: Inyectamos el mapeo de backend corregido de stock.py
              name: dbMarket.nombre_puesto || "Puesto de Venta",
              description: esCarne ? "Carnes frescas de primera calidad" : "Frutas y verduras frescas del productor",
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

        // 🌟 CAPA DE PROTECCIÓN COMPLEMENTARIA EN LA REEVALUACIÓN ASÍNCRO DE LA SESIÓN DEL CLIENTE
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const currentUserId = session.user.id;
          
          // Solicitamos a prices de forma aislada e independiente pasando el UUID reactivo
          const resVendor = await fetch(`http://localhost:8000/api/prices/vendor-puestos/${currentUserId}`);
          if (resVendor.ok) {
            const puestosRealesBackend = await resVendor.json();
            if (puestosRealesBackend && puestosRealesBackend.length > 0) {
              setVendorMarkets(puestosRealesBackend);
              return; // Fin de flujo exitoso
            }
          }
          
          // Fallback manual de emergencia por UUID sobre el catálogo maestro recién mapeado
          const localesFiltrados = todosLosMercadosSincronizados.filter(
            (m: any) => m.vendedora_id === currentUserId
          );
          if (localesFiltrados.length > 0) {
            setVendorMarkets(localesFiltrados);
          }
        }

      } catch (error) {
        console.error("Error cargando mercados en HomeClient:", error);
      }
    };

    syncWithDatabase();
  }, [sessionUser?.id]); // ── 🎯 CORRECCIÓN CLAVE: Se vuelve a sincronizar automáticamente al cambiar de vendedora ──

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

  const handleUpdatePrice = (marketId: string, productId: string, newPrice: number) => {
    const updateInList = (list: Market[]) => list.map((m) => m.id === marketId ? {
      ...m,
      products: m.products.map((p) => p.id === productId ? { ...p, price: newPrice } : p)
    } : m);

    setMarkets((prev) => updateInList(prev));
    setVendorMarkets((prev) => updateInList(prev));
  };

  const handleToggleStock = (marketId: string, productId: string) => {
    const toggleInList = (list: Market[]) => list.map((m) => m.id === marketId ? {
      ...m,
      products: m.products.map((p) => p.id === productId ? { ...p, available: !p.available } : p)
    } : m);

    setMarkets((prev) => toggleInList(prev));
    setVendorMarkets((prev) => toggleInList(prev));
  };

  const handleAddReview = (marketId: string, rating: number, comment: string) => {
    setMarkets((prev) =>
      prev.map((market) => {
        if (market.id !== marketId) return market;
        const nombreVendedorSeguro = sessionUser?.user_metadata?.full_name || "Usuario";
        const newReview = {
          id: `r${Date.now()}`,
          userName: nombreVendedorSeguro,
          rating,
          comment,
          date: new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }),
        };
        const updatedReviews = [...market.reviews, newReview];
        const newRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length;
        return { ...market, reviews: updatedReviews, rating: Number(newRating.toFixed(1)) };
      }),
    );
  };

  const handleToggleFavorite = (marketId: string) => {
    setFavoriteMarketIds((prev) => {
      const next = prev.includes(marketId) ? prev.filter((id) => id !== marketId) : [...prev, marketId];
      localStorage.setItem("favoriteMarkets", JSON.stringify(next));
      return next;
    });
  };

  const handleReportOverprice = (marketId: string, report: any) => {
    setOverpriceReports((prev) => [...prev, { marketId, ...report, timestamp: new Date().toISOString() }]);
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
        if (!history[product.name]) history[product.name] = generatePriceHistory(product.price);
      });
    });
    return history;
  }, [markets]);

  const categories = useMemo(() => [...new Set(markets.map((m) => m.category || "General"))].sort(), [markets]);
  const marketLocations = useMemo(() => [...new Set(markets.map((m) => m.marketLocation || "Mercado Central"))].sort(), [markets]);

  const finalMarkets = useMemo(() => {
    let filtered = markets.filter((m) => {
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.description.toLowerCase().includes(searchTerm.toLowerCase());
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

  // ── 🎯 LÓGICA DE DETECCIÓN HÍBRIDA MULTI-ESCUDO COMPLETAMENTE GENÉRICA ──
  const vendorFilteredMarkets = useMemo(() => {
    if (!sessionUser?.id) return [];
    
    const currentUserId = sessionUser.id;

    // 1. Prioridad 1: Respuesta limpia estructurada de prices.py por base de datos
    if (vendorMarkets && vendorMarkets.length > 0) {
      return vendorMarkets;
    }

    // 2. Prioridad 2: Fallback relacional directo por UUID sobre el catálogo maestro de stock.py
    if (markets && markets.length > 0) {
      const deRespaldo = markets.filter((m: any) => m.vendedora_id === currentUserId);
      if (deRespaldo.length > 0) return deRespaldo;
    }

    return [];
  }, [vendorMarkets, markets, sessionUser?.id]);

  // ── 🌟 ESCUDO PROTECTOR ANTIPARPADEO PARA LA DEFENSA DE GRADO ──
  // Si la sesión aún no termina de hidratarse asíncronamente en el cliente, congelamos el renderizado
  // en una pantalla neutral de carga para que nunca se dibuje la interfaz errónea por accidente.
  if (!initialLoadComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-sm font-semibold text-gray-500 animate-pulse">
            Iniciando entorno seguro de SIMPRECIOS...
          </p>
        </div>
      </div>
    );
  }

  // ========== VISTAS DE AUTENTICACIÓN ==========
  if (currentView === "login") return <LoginView onViewChange={handleViewChange} />;
  if (currentView === "registro") return <RegisterView onViewChange={handleViewChange} />;
  if (currentView === "recuperar") return <RecoverView onViewChange={handleViewChange} />;
  if (currentView === "verificar") return <VerifyView onViewChange={handleViewChange} />;
  if (currentView === "perfil") return <ProfileView onViewChange={handleViewChange} />;

  // ========== PANEL DE VENDEDOR ==========
  if (isVendorMode && selectedVendorMarket) {
    const market = vendorFilteredMarkets.find((m) => m.id === selectedVendorMarket);
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
              onUpdatePrice={(productId, newPrice) => handleUpdatePrice(market.id, productId, newPrice)}
              onMarkRestocked={(productId) => handleToggleStock(market.id, productId)}
              onDeleteProduct={(productId) => {
                setMarkets((prev) => prev.map((m) => m.id === market.id ? { ...m, products: m.products.filter((p) => p.id !== productId) } : m));
                setVendorMarkets((prev) => prev.map((m) => m.id === market.id ? { ...m, products: m.products.filter((p) => p.id !== productId) } : m));
              }}
              onRegisterProduct={async (name, price) => {
                if (!name.trim() || !price) return;
                const nombreFormateado = name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();
                const precioNumerico = parseFloat(price.toString());

                try {
                  const response = await fetch("http://localhost:8000/api/prices/update", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      puesto_id: parseInt(market.id, 10),
                      producto_id: 0,
                      nombre_producto: nombreFormateado,
                      precio_actual: precioNumerico,
                    }),
                  });

                  if (!response.ok) throw new Error("Error interno en el servidor");
                  const resData = await response.json();
                  const idAsignado = resData && resData.producto_id ? resData.producto_id.toString() : `p-${Date.now()}`;

                  const addProduct = (list: Market[]) => list.map((m) => m.id === market.id ? {
                    ...m, products: [...m.products, { id: idAsignado, name: nombreFormateado, price: precioNumerico, available: true }]
                  } : m);

                  setMarkets((prev) => addProduct(prev));
                  setVendorMarkets((prev) => addProduct(prev));
                } catch (e) {
                  console.error("🚨 Fallback de registro:", e);
                }
              }}
              onToggleStock={(productId) => handleToggleStock(market.id, productId)}
              onNotifyStock={(productId) => {
                const triggerNotify = (list: Market[]) => list.map((m) => m.id === market.id ? {
                  ...m, products: m.products.map((p) => p.id === productId ? { ...p, available: false } : p)
                } : m);
                setMarkets((prev) => triggerNotify(prev));
                setVendorMarkets((prev) => triggerNotify(prev));
              }}
              priceHistory={priceHistory}
              averagePrices = {averagePrices}
              referencePrices={market.products.reduce((acc, p) => {
                acc[p.name.trim()] = (p as any).refPrice !== undefined ? (p as any).refPrice : p.price;
                return acc;
              }, {} as Record<string, number>)}
            />
          </div>
        </div>
      );
    }
  }

  // ========== LISTA DE PUESTOS DEL VENDEDOR ==========
  if (isVendorMode) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Navbar currentView={currentView} onViewChange={handleViewChange} sessionUser={sessionUser} />

        <div className="container mx-auto px-4 py-8">
          {/* ── 🎯 ENCABEZADO MODIFICADO: SE REMOVIÓ EL BOTÓN DE CAMBIO DE ROL PARA LA DEFENSA ── */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Mis Puestos</h2>
              <p className="text-sm text-gray-600">
                Selecciona un puesto para gestionar precios, productos y alertas de stock
              </p>
            </div>
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
                ⚠️ No tienes ningún puesto asignado a tu cuenta actualmente en la base de datos.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========== VISTA COMPRADOR (HOME, MAPA, AI) ==========
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
              />
            </>
          )}

          {currentView === "map" && <MapView markets={finalMarkets} userLocation={userLocation} />}
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