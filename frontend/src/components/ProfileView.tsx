'use client';

import React, { useState } from 'react';
import { ArrowLeft, Camera, User, Store, Lock, Save } from 'lucide-react';
import { AppView } from '@/types';

interface ProfileViewProps {
  onViewChange: (view: AppView) => void;
}

export function ProfileView({ onViewChange }: ProfileViewProps) {
  const [mockRole, setMockRole] = useState<'comprador' | 'vendedora'>('comprador');

  const [name, setName] = useState('Usuario Prueba'); 
  const [email, setEmail] = useState('correo@ejemplo.com');
  const [bio, setBio] = useState('Amante de las buenas parrilladas.');
  const [market, setMarket] = useState('Mercado Rodríguez');
  const [standNumber, setStandNumber] = useState('Puesto 24');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword || confirmNewPassword) {
      if (newPassword !== confirmNewPassword) {
        alert('⚠️ Las contraseñas nuevas no coinciden.');
        return;
      }
      if (!currentPassword) {
        alert('⚠️ Debes ingresar tu contraseña actual para cambiarla.');
        return;
      }
    }

    alert('✅ ¡Perfil actualizado con éxito!');
    console.log('Datos guardados:', { name, email, bio, mockRole, market, standNumber });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-6 text-white shadow-md relative h-32">
        <button
          onClick={() => onViewChange("home")}
          className="absolute top-6 left-4 flex items-center gap-2 text-white hover:text-orange-200 transition-colors font-medium cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-16 relative">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          
          <div className="mb-8 p-4 bg-gray-100 rounded-xl border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center sm:text-left">Modo Prueba (Vista):</span>
            <div className="flex gap-2">
              <button onClick={() => setMockRole('comprador')} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${mockRole === 'comprador' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-300 hover:bg-gray-50'}`}>Comprador</button>
              <button onClick={() => setMockRole('vendedora')} className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${mockRole === 'vendedora' ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-300 hover:bg-gray-50'}`}>Caserita</button>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            
            <div className="flex flex-col items-center -mt-4">
              <div className="relative">
                <div className="w-28 h-28 bg-gray-100 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
                <button type="button" className="absolute bottom-1 right-1 bg-orange-500 p-2.5 rounded-full text-white shadow-md hover:bg-orange-600 transition-colors cursor-pointer">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs font-bold text-gray-400 mt-3 uppercase tracking-wider">Cambiar Foto</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                <User className="w-5 h-5 text-orange-500" /> Datos Personales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-gray-50 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Correo / Celular</label>
                  <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-gray-50 focus:bg-white transition-colors" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción / Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-gray-50 focus:bg-white transition-colors" placeholder="Cuenta un poco sobre ti..." />
              </div>
            </div>

            {mockRole === 'vendedora' && (
              <div className="space-y-4 p-5 bg-pink-50 rounded-xl border border-pink-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <h3 className="text-lg font-bold text-pink-800 flex items-center gap-2 border-b border-pink-200 pb-2">
                  <Store className="w-5 h-5" /> Datos del Negocio
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Mercado</label>
                    <select value={market} onChange={(e) => setMarket(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-white">
                      <option value="Mercado Rodríguez">Mercado Rodríguez</option>
                      <option value="Mercado Lanza">Mercado Lanza</option>
                      <option value="Mercado Achumani">Mercado Achumani</option>
                      <option value="Mercado Miraflores">Mercado Miraflores</option>
                      <option value="Mercado Camacho">Mercado Camacho</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Número de Puesto</label>
                    <input type="text" value={standNumber} onChange={(e) => setStandNumber(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-white" placeholder="Ej. Puesto 24" />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                <Lock className="w-5 h-5 text-gray-500" /> Seguridad de Cuenta
              </h3>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña Actual</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-gray-50 focus:bg-white transition-colors" placeholder="Solo si deseas cambiarla..." />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nueva Contraseña</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-gray-50 focus:bg-white transition-colors" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Confirmar Nueva</label>
                  <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-gray-50 focus:bg-white transition-colors" placeholder="••••••••" />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-md transition-opacity mt-4">
              <Save className="w-5 h-5" /> Guardar Cambios
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}