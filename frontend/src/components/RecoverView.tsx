'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function RecoverPage() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Frontend de recuperación listo para:', email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-orange-600 mb-2">Recuperar Acceso</h2>
        <p className="text-center text-gray-500 mb-6">Ingresa tu correo o teléfono y te enviaremos un código para restablecer tu contraseña.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo o Teléfono</label>
            <input 
              type="text" 
              value={email} onChange={(e) => setEmail(e.target.value)}
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 outline-none"
            />
          </div>
          
          <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg">
            Enviar Código
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="text-gray-500 hover:text-orange-600 font-medium">
            Volver al Inicio de Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}