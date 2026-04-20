"use client";

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
          <div className="flex items-center gap-2 bg-white/20 rounded-full pl-2 pr-1 py-1 backdrop-blur-sm">
            <span className="text-xs font-bold text-white hidden sm:block">{currentUser.name}</span>
            <Avatar className="w-8 h-8 border-2 border-white shadow-lg">
              <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{currentUser.avatar}</span>
              </div>
            </Avatar>
          </div>
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
