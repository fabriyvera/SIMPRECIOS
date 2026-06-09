'use client';

import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AppView } from '@/types';
import { createClient } from '@/utils/supabase/client';

interface RecoverViewProps {
  onViewChange: (view: AppView) => void;
}

export function RecoverView({ onViewChange }: RecoverViewProps) {
  // Estados para guardar los datos
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Controla en qué paso estamos visualmente
  const [step, setStep] = useState<"solicitar" | "verificar_codigo" | "nueva_clave">("solicitar");

  const supabase = createClient();

  // Función 1: Pide a Supabase que envíe el código de 6 dígitos
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      alert("❌ Error: No pudimos enviar el código. Verifica tu correo.");
      console.error(error);
      return;
    }
    alert("✅ ¡Código enviado! Revisa tu bandeja de entrada.");
    setStep("verificar_codigo"); // Avanzamos al paso 2
  };

  // Función 2: Compara el código ingresado con el de Supabase
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // verifyOtp revisa el código y, si es correcto, te da acceso temporal
    const { error } = await supabase.auth.verifyOtp({
      email: email,
      token: otp,
      type: 'recovery'
    });

    if (error) {
      alert("❌ Código incorrecto o vencido. Intenta de nuevo.");
      console.error(error);
      return;
    }
    
    alert("✅ Código correcto. Ya puedes establecer tu nueva contraseña.");
    setStep("nueva_clave"); // Avanzamos al paso 3
  };

  // Función 3: Actualiza la clave y manda al usuario a su cuenta
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert("⚠️ Las contraseñas no coinciden.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      alert("❌ Error al actualizar la contraseña: " + error.message);
      return;
    }

    alert("✅ ¡Misión cumplida! Tu contraseña ha sido actualizada.");
    onViewChange("home"); // Entramos directo a la app
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative">
      <button 
        onClick={() => onViewChange("login")} 
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-orange-600 transition-colors font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm">Volver al Login</span>
      </button>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        
        {/* PASO 1: PEDIR CORREO */}
        {step === "solicitar" && (
          <>
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-center mb-2">
              Recuperar Contraseña
            </h2>
            <p className="text-center text-gray-500 mb-8 font-medium">
              Ingresa tu correo y te enviaremos un código de seguridad de 8 dígitos.
            </p>

            <form onSubmit={handleSendCode} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="tu@correo.com"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:opacity-90 text-white font-bold py-3.5 rounded-xl shadow-md transition-opacity cursor-pointer"
              >
                Enviar Código
              </button>
            </form>
          </>
        )}

        {/* PASO 2: INGRESAR EL CÓDIGO */}
        {step === "verificar_codigo" && (
          <>
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-center mb-2">
              Verificar Código
            </h2>
            <p className="text-center text-gray-500 mb-8 font-medium">
              Hemos enviado un código a <span className="font-bold text-gray-800">{email}</span>.
            </p>

            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Código de Seguridad
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={8}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-gray-50 focus:bg-white text-center text-xl tracking-[0.5em] font-bold"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:opacity-90 text-white font-bold py-3.5 rounded-xl shadow-md transition-opacity cursor-pointer"
              >
                Verificar y Continuar
              </button>
            </form>
          </>
        )}

        {/* PASO 3: NUEVA CONTRASEÑA */}
        {step === "nueva_clave" && (
          <>
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-center mb-2">
              Nueva Contraseña
            </h2>
            <p className="text-center text-gray-500 mb-8 font-medium">
              Crea una nueva contraseña segura para tu cuenta.
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Nueva Contraseña
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

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:opacity-90 text-white font-bold py-3.5 rounded-xl shadow-md transition-opacity cursor-pointer"
              >
                Guardar Contraseña
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}