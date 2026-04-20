"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin } from "lucide-react";

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  categories: string[];
  showOpenOnly: boolean;
  onShowOpenOnlyChange: (value: boolean) => void;
  selectedMarketLocation: string;
  onMarketLocationChange: (value: string) => void;
  marketLocations: string[];
}

export function SearchAndFilter({
  searchTerm, onSearchChange, selectedCategory, onCategoryChange,
  sortBy, onSortChange, categories, showOpenOnly, onShowOpenOnlyChange,
  selectedMarketLocation, onMarketLocationChange, marketLocations,
}: SearchAndFilterProps) {
  return (
    <div className="flex flex-col gap-4 mb-6 p-4 bg-white rounded-2xl shadow-md border-2 border-orange-200">
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-bold mb-2 flex items-center gap-2 text-orange-700">
            <MapPin className="w-4 h-4" />
            Selecciona el Mercado
          </label>
          <Select value={selectedMarketLocation} onValueChange={onMarketLocationChange}>
            <SelectTrigger className="w-full border-2 border-orange-300 focus:ring-orange-500 bg-orange-50">
              <SelectValue placeholder="Todos los mercados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🏪 Todos los Mercados</SelectItem>
              {marketLocations.map((location) => (
                <SelectItem key={location} value={location}>📍 {location}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-600 w-5 h-5" />
            <Input
              placeholder="Buscar puestos de mercado..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-11 border-2 border-orange-200 focus:ring-orange-500 bg-orange-50/50"
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-[180px] border-2 border-blue-300 focus:ring-blue-500 bg-blue-50">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🏷️ Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-[180px] border-2 border-purple-300 focus:ring-purple-500 bg-purple-50">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">📝 Nombre A-Z</SelectItem>
                <SelectItem value="name-desc">📝 Nombre Z-A</SelectItem>
                <SelectItem value="rating">⭐ Calificación Baja-Alta</SelectItem>
                <SelectItem value="rating-desc">⭐ Calificación Alta-Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2.5 border-2 border-green-200">
        <input
          type="checkbox"
          id="showOpenOnly"
          checked={showOpenOnly}
          onChange={(e) => onShowOpenOnlyChange(e.target.checked)}
          className="w-4 h-4 rounded border-green-400 text-green-600 focus:ring-green-500"
        />
        <label htmlFor="showOpenOnly" className="text-sm font-bold cursor-pointer text-green-800 flex items-center gap-2">
          🟢 Mostrar solo puestos abiertos
        </label>
      </div>
    </div>
  );
}
