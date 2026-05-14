"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, MapPin, Sparkles, Store } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AppView } from "@/types";

interface NavbarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  currentUser: { name: string; avatar: string };
  isVendorMode: boolean;
  onToggleVendorMode: () => void;
}

export function Navbar({ currentView, onViewChange, currentUser, isVendorMode, onToggleVendorMode }: NavbarProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navItems = [
    { id: "home" as const, icon: Home, label: "Inicio" },
    { id: "map" as const, icon: MapPin, label: "Buscar" },
    { id: "ai" as const, icon: Sparkles, label: "IA" },
    { id: "vendor" as const, icon: Store, label: "Vendedor" },
  ];

  return (
    <>
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white py-4 px-4 shadow-lg sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold mb-0 text-white drop-shadow-lg">🏪 Mercados Locales</h1>
              <p className="text-xs text-white/80">Bolivia</p>
            </div>
          </div>
          {/* --- INICIO DEL MÓDULO DE GESTIÓN DE USUARIOS --- */}
          {isLoggedIn ? (
            <div className="relative group">
              <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-full pl-2 pr-1 py-1 backdrop-blur-sm cursor-pointer">
                <span className="text-xs font-bold text-white hidden sm:block">{currentUser.name}</span>
                <Avatar className="w-8 h-8 border-2 border-white shadow-lg">
                  <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{currentUser.avatar}</span>
                  </div>
                </Avatar>
              </button>

              {/* Menú Desplegable (Dropdown) */}
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-xl py-1 z-50 hidden group-hover:block border border-gray-100">
                <button onClick={() => onViewChange("perfil" as AppView)} className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                  Mi Perfil
                </button>
                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="block w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onViewChange("login" as AppView)}
                className="text-xs font-bold text-white hover:text-white/80 transition-colors drop-shadow-md cursor-pointer"
              >
                {/* BOTÓN TEMPORAL PARA PROBAR EL PERFIL */}
            <button 
              onClick={() => onViewChange("perfil")} 
              className="text-sm font-extrabold text-orange-500 hover:text-pink-500 transition-colors mr-4"
            >
               Mi Perfil (Prueba)
            </button>

                Ingresar
              </button>
              <button
                onClick={() => onViewChange("registro" as AppView)}
                className="bg-white text-orange-600 text-xs font-bold px-4 py-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Registrarse
              </button>
            </div>
          )}
          {/* --- FIN DE MÓDULO DE GESTIÓN DE USUARIOS --- */}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const isActive = currentView === item.id || (item.id === "vendor" && isVendorMode);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => item.id === "vendor" ? onToggleVendorMode() : onViewChange(item.id)}
                className={`flex flex-col items-center justify-center gap-1 transition-all ${isActive ? "text-orange-600" : "text-gray-500"}`}
              >
                <div className={`relative transition-transform ${isActive ? "scale-110" : ""}`}>
                  <Icon className={`w-6 h-6 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
                  {isActive && <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-600 rounded-full" />}
                </div>
                <span className={`text-xs font-medium ${isActive ? "font-bold" : ""}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
