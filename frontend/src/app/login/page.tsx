'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login Frontend listo con:', email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-orange-600 mb-2">SIMPRECIOS</h2>
        <p className="text-center text-gray-500 mb-8">Ingresa a tu cuenta</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo o Teléfono</label>
            <input 
              type="text" 
              value={email} onChange={(e) => setEmail(e.target.value)}
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 outline-none"
              placeholder="correo@ejemplo.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              value={password} onChange={(e) => setPassword(e.target.value)}
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end">
            <Link href="/recuperar" className="text-sm text-orange-600 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          
          <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition-colors">
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="text-orange-600 hover:underline font-bold">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
}