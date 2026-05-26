"use client";

import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AppView } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { getUserProfile, createUserProfile } from "@/services/api/auth";

interface LoginViewProps {
  onViewChange: (view: AppView) => void;
}

export function LoginView({ onViewChange }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        // Obtener o crear perfil directamente en Supabase
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('rol')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) console.error("Error al obtener perfil:", profileError);

        if (!profile) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            nombre_completo: data.user.user_metadata?.nombre_completo || data.user.email,
            rol: 'Comprador',
            es_verificado: false,
          });
        }

        alert("✅ Sesión iniciada");
        onViewChange(profile?.rol === 'Vendedora' ? 'vendor' : 'home');
      }
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative">
      <button
        onClick={() => onViewChange("home")}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-orange-600 transition-colors font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm">Volver al inicio</span>
      </button>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-center mb-2 pb-1">
          SIMPRECIOS
        </h2>
        <p className="text-center text-gray-500 mb-8 font-medium">
          Ingresa a tu cuenta
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Correo o Teléfono
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-gray-50 focus:bg-white"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-gray-50 focus:bg-white"
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onViewChange("recuperar")}
              className="text-sm font-bold text-orange-500 hover:text-pink-500 transition-colors cursor-pointer"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:opacity-90 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-md transition-opacity"
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600">
          ¿No tienes cuenta?{" "}
          <button
            onClick={() => onViewChange("registro")}
            className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 font-extrabold hover:opacity-80 cursor-pointer"
          >
            Regístrate aquí
          </button>
        </div>
      </div>
    </div>
  );
}
