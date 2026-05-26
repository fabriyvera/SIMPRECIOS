"use client";

import { useState } from "react";
import { Home, MapPin, Sparkles, Store, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AppView, SessionUser } from "@/types";
import { createClient } from '@/utils/supabase/client';

interface NavbarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  sessionUser: SessionUser | null;
}

export function Navbar({
  currentView,
  onViewChange,
  sessionUser,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const navItems = [
    { id: "home" as const, icon: Home, label: "Inicio" },
    { id: "map" as const, icon: MapPin, label: "Buscar" },
    { id: "ai" as const, icon: Sparkles, label: "IA" },
  ];

  const isLoggedIn = !!sessionUser;
  
  // 🎯 DETECTAMOS EL ROL PARA CAMBIAR EL ESTILO VISUAL DE LA BARRA
  const isVendorRole = sessionUser?.rol === "Vendedora";

  return (
    <>
      {/* Barra Superior Dinámica: Morada si es Vendedora, Naranja/Roja si es Comprador */}
      <div className={`py-4 px-4 shadow-lg sticky top-0 z-40 text-white transition-all ${
        isVendorRole 
          ? "bg-gradient-to-r from-purple-600 to-blue-600" 
          : "bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange("home")}>
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold mb-0 text-white drop-shadow-lg">
                {isVendorRole ? "🏪 Panel de Vendedor" : "🏪 Mercados Locales"}
              </h1>
              <p className="text-xs text-white/80">
                {isVendorRole ? "Gestión de puestos y precios" : "Bolivia"}
              </p>
            </div>
          </div>

          {/* Módulo de gestión de usuarios UNIFICADO con Menú Desplegable Funcional */}
          {isLoggedIn && sessionUser ? (
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-full pl-2 pr-1 py-1 backdrop-blur-sm cursor-pointer focus:outline-none"
              >
                <span className="text-xs font-bold text-white hidden sm:block">
                  {sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0]}
                </span>
                <Avatar className="w-8 h-8 border-2 border-white shadow-lg">
                  <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {(sessionUser.user_metadata?.full_name || sessionUser.email)?.[0]?.toUpperCase()}
                    </span>
                  </div>
                </Avatar>
              </button>

              {/* Menú Desplegable (Garantizado para Juana Quispe y Compradores) */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-xl py-1 z-50 border border-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => {
                      onViewChange("perfil" as AppView);
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
                  >
                    Mi Perfil
                  </button>
                  
                  {/* Se eliminó quirúrgicamente el botón rápido de intercambio cruzado de roles */}

                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer border-t border-gray-100"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onViewChange("login")}
                className="text-xs font-bold text-white hover:text-white/80 transition-colors drop-shadow-md cursor-pointer"
              >
                Ingresar
              </button>
              <button
                onClick={() => onViewChange("registro")}
                className="bg-white text-orange-600 text-xs font-bold px-4 py-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Registrarse
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barra inferior de navegación: SOLO SE MUESTRA SI NO ES VENDEDORA */}
      {!isVendorRole && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
          <div className="grid grid-cols-3 h-16">
            ={navItems.map((item) => {
              const isActive = currentView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex flex-col items-center justify-center gap-1 transition-all ${
                    isActive ? "text-orange-600" : "text-gray-500"
                  }`}
                >
                  <div className={`relative transition-transform ${isActive ? "scale-110" : ""}`}>
                    <Icon className={`w-6 h-6 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-600 rounded-full" />
                    )}
                  </div>
                  <span className={`text-xs font-medium ${isActive ? "font-bold" : ""}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}