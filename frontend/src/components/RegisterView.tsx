'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Store } from 'lucide-react'; // Íconos para los roles

export default function RegisterPage() {
  const [role, setRole] = useState<'comprador' | 'vendedora'>('comprador');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Registro Frontend listo:', { role, name, email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative py-12">
      
      <button 
        onClick={() => router.back()} 
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
            <button
              type="button"
              onClick={() => setRole('comprador')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl font-bold transition-all border-2 ${
                role === 'comprador' 
                ? 'border-orange-500 text-orange-600 bg-orange-50' 
                : 'border-gray-100 text-gray-400 bg-white hover:border-gray-200'
              }`}
            >
              <User className="w-5 h-5" />
              Comprador
            </button>
            <button
              type="button"
              onClick={() => setRole('vendedora')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl font-bold transition-all border-2 ${
                role === 'vendedora' 
                ? 'border-pink-500 text-pink-600 bg-pink-50' 
                : 'border-gray-100 text-gray-400 bg-white hover:border-gray-200'
              }`}
            >
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
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-gray-50 focus:bg-white" />
          </div>
          
          <button type="submit" className="w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:opacity-90 text-white font-bold py-3.5 rounded-xl shadow-md transition-opacity mt-4">
            Registrarme
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 font-extrabold hover:opacity-80">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}