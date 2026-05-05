'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [role, setRole] = useState<'comprador' | 'vendedora'>('comprador');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Registro Frontend listo:', { role, name, email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-orange-600 mb-2">Crear Cuenta</h2>
        <p className="text-center text-gray-500 mb-6">Únete a SIMPRECIOS</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setRole('comprador')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors border ${role === 'comprador' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              Comprador
            </button>
            <button
              type="button"
              onClick={() => setRole('vendedora')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors border ${role === 'vendedora' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              Casera
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo o Teléfono</label>
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 outline-none" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 outline-none" />
          </div>
          
          <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg mt-2">
            Registrarme
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta? <Link href="/login" className="text-orange-600 hover:underline font-bold">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}