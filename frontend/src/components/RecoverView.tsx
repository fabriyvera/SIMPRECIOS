'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { AppView } from '@/types';

interface RecoverViewProps {
  onViewChange: (view: AppView) => void;
}

export default function RecoverView({ onViewChange }: RecoverViewProps) {
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
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-center mb-2">
          Recuperar Contraseña
        </h2>
        <p className="text-center text-gray-500 mb-8 font-medium">Próximamente el formulario...</p>
      </div>
    </div>
  );
}