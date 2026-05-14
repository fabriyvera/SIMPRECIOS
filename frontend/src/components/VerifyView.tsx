'use client';

import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { AppView } from '@/types';

interface VerifyViewProps {
  onViewChange: (view: AppView) => void;
}

export function VerifyView({ onViewChange }: VerifyViewProps) {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      console.log('Código verificado Frontend:', code);
      alert('¡Cuenta verificada con éxito! Bienvenido a SIMPRECIOS.');
      // Simulamos que ya verificó y lo mandamos a la pantalla de Login
      onViewChange('login');
    } else {
      alert('⚠️ Por favor ingresa el código completo de 6 dígitos.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative py-12">
      <button
        onClick={() => onViewChange("registro")}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-orange-600 transition-colors font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm">Volver al registro</span>
      </button>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-orange-100 p-4 rounded-full">
            <ShieldCheck className="w-10 h-10 text-orange-500" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 mb-2">
          Verifica tu cuenta
        </h2>
        <p className="text-gray-500 mb-8 font-medium">
          Ingresa el código de 6 dígitos que enviamos a tu celular o correo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              maxLength={6}
              value={code}
              /* Esto asegura que solo se puedan escribir números */
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="••••••"
              className="w-full text-center text-3xl tracking-widest px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all bg-gray-50 focus:bg-white"
              required
            />
          </div>

          <button type="submit" className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:opacity-90 text-white font-bold py-3.5 rounded-xl shadow-md transition-opacity">
            Verificar Código
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-600">
          ¿No recibiste el código?{' '}
          <button className="text-orange-500 font-extrabold hover:opacity-80 cursor-pointer">
            Reenviar
          </button>
        </div>
      </div>
    </div>
  );
}