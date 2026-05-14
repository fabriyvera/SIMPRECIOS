'use client';

import React, { useState } from 'react';
import { ArrowLeft, User, Store } from 'lucide-react';
import { AppView } from '@/types';

interface RegisterViewProps {
  onViewChange: (view: AppView) => void;
}

export function RegisterView({ onViewChange }: RegisterViewProps) {
  const [role, setRole] = useState<'comprador' | 'vendedora'>('comprador');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [market, setMarket] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('⚠️ Las contraseñas no coinciden. Por favor, verifica.');
      return;
    }

    if (role === 'vendedora' && !market) {
      alert('⚠️ Por favor, selecciona a qué mercado perteneces.');
      return;
    }

    if (role === 'comprador') {
      console.log('Registrando Comprador:', { role, name, email, password });
    } else {
      console.log('Registrando Caserita:', { role, name, email, password, market });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative py-12">
      
      <button 
        onClick={() => onViewChange("home")} 
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-orange-600 transition-colors font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm">Volver al inicio</span>
      </button>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mt-8 sm:mt-0">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-center mb-2">
          Crear Cuenta
        </h2>
        <p className="text-center text-gray-500 mb-6 font-medium">Únete a SIMPRECIOS</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="flex gap-3 mb-6">
            <button type="button" onClick={() => setRole('comprador')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl font-bold transition-all border-2 ${role === 'comprador' ? 'border-orange-500 text-orange-600 bg-orange-50' : 'border-gray-100 text-gray-400 bg-white hover:border-gray-200'}`}>
              <User className="w-5 h-5" />
              Comprador
            </button>
            <button type="button" onClick={() => setRole('vendedora')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl font-bold transition-all border-2 ${role === 'vendedora' ? 'border-pink-500 text-pink-600 bg-pink-50' : 'border-gray-100 text-gray-400 bg-white hover:border-gray-200'}`}>
              <Store className="w-5 h-5" />
              Casera
            </button>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-gray-50 focus:bg-white" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Correo o Teléfono</label>
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-gray-50 focus:bg-white" />
          </div>
          
          {role === 'vendedora' && (
            <div className="p-4 bg-pink-50 rounded-xl border border-pink-100 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-bold text-pink-800 mb-1">Mercado al que pertenece</label>
              <select value={market} onChange={(e) => setMarket(e.target.value)} required className="w-full px-4 py-3 border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none transition-all bg-white text-sm">
                <option value="">Seleccione un mercado...</option>
                <option value="Mercado Rodríguez">Mercado Rodríguez</option>
                <option value="Mercado Lanza">Mercado Lanza</option>
                <option value="Mercado Achumani">Mercado Achumani</option>
                <option value="Mercado Miraflores">Mercado Miraflores</option>
                <option value="Mercado Camacho">Mercado Camacho</option>
                <option value="Mercado Uruguay">Mercado Uruguay</option>
                <option value="Otro">Otro...</option>
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-gray-50 focus:bg-white" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Confirmar Contraseña</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-gray-50 focus:bg-white" />
          </div>
          
          <button type="submit" className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:opacity-90 text-white font-bold py-3.5 rounded-xl shadow-md transition-opacity mt-4">
            Registrarme
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <button 
            onClick={() => onViewChange("login")} 
            className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 font-extrabold hover:opacity-80 cursor-pointer"
          >
            Inicia sesión
          </button>
        </div>
      </div>
    </div>
  );
}