"use client";

import { Home, MapPin, Sparkles, Store, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AppView, SessionUser } from "@/types";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from '@/utils/supabase/client';

interface NavbarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  sessionUser: SessionUser | null; // ya no necesitamos currentUser
}

export function Navbar({
  currentView,
  onViewChange,
  sessionUser,
}: NavbarProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userInitial, setUserInitial] = useState("");
  
  // INYECCIÓN DE ALEXIA: Estado para controlar si el menú está abierto o cerrado firmemente
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();
  const navItems = [
    { id: "home" as const, icon: Home, label: "Inicio" },
    { id: "map" as const, icon: MapPin, label: "Buscar" },
    { id: "ai" as const, icon: Sparkles, label: "IA" },
  ];

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        const name = session.user.user_metadata?.nombre_completo || "Usuario";
        setUserName(name);
        setUserInitial(name.charAt(0).toUpperCase());
      }
    };
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsLoggedIn(true);
        const name = session.user.user_metadata?.nombre_completo || "Usuario";
        setUserName(name);
        setUserInitial(name.charAt(0).toUpperCase());
      } else {
        setIsLoggedIn(false);
        setUserName("");
        setUserInitial("");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // INYECCIÓN DE ALEXIA: Cerrar el menú si el usuario hace clic afuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setIsMenuOpen(false); // Cerramos el menú al salir
    onViewChange("home"); 
  };

  const handleProfileClick = () => {
    setIsMenuOpen(false); // Cerramos el menú al ir al perfil
    onViewChange("perfil" as AppView);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white py-4 px-4 shadow-lg sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-lg font-bold mb-0 text-white drop-shadow-lg">
                Mercados Locales
              </h1>
              <p className="text-xs text-white/80">Bolivia</p>
            </div>
          </div>

          {/* INICIO MÓDULO DE GESTIÓN DE USUARIOS */}
          {isLoggedIn ? (
            // Agregamos el ref aquí para detectar clics fuera del menú
            <div className="relative" ref={menuRef}> 
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} // El botón ahora controla el estado
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-full pl-2 pr-1 py-1 backdrop-blur-sm cursor-pointer"
              >
                <span className="text-xs font-bold text-white hidden sm:block">
                  {userName}
                </span>
                <Avatar className="w-8 h-8 border-2 border-white shadow-lg">
                  <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {userInitial}
                    </span>
                  </div>
                </Avatar>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-xl py-1 z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={handleProfileClick}
                    className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                  >
                    Mi Perfil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onViewChange("login" as AppView)}
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

      {/* Barra inferior de navegación */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
        <div className="grid grid-cols-3 h-16">
          {navItems.map((item) => {
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
                <div
                  className={`relative transition-transform ${
                    isActive ? "scale-110" : ""
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`}
                  />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-orange-600 rounded-full" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${isActive ? "font-bold" : ""}`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}