'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Store, Lock, Save, Mail } from 'lucide-react';
import { AppView } from '@/types';
import { createClient } from '@/utils/supabase/client';

interface ProfileViewProps {
  onViewChange: (view: AppView) => void;
}

export function ProfileView({ onViewChange }: ProfileViewProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState<string>('comprador');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(''); // Estado para el correo
  const [market, setMarket] = useState('');
  const [standNumber, setStandNumber] = useState('');
  const [sector, setSector] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const usuarioId = session.user.id;
        
        // Guardamos el correo de la sesión de Supabase
        setEmail(session.user.email || '');
        
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("nombre_completo, telefono, rol")
          .eq("id", usuarioId)
          .single();

        if (profileError) throw profileError;

        if (profileData) {
          setName(profileData.nombre_completo || "");
          setPhone(profileData.telefono || "");
          setRol(profileData.rol || "comprador");
          
          if (profileData.rol === "Vendedora" || profileData.rol === "caserita") {
            const { data: puestoData, error: puestoError } = await supabase
              .from("puestos_venta")
              .select("nombre_puesto, nro_puesto, sector")
              .eq("vendedora_id", usuarioId)
              .maybeSingle(); // Cambiado a maybeSingle por si no tiene puesto aún
            
            // Si el puesto ya existe, cargamos los datos
            if (puestoData) {
              setMarket(puestoData.nombre_puesto || "");
              setStandNumber(puestoData.nro_puesto || "");
              setSector(puestoData.sector || "");
            }
          }
        }
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarPerfil();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const usuarioId = session.user.id;
      
      // Lógica de Contraseñas
      if (newPassword || confirmNewPassword) {
        if (newPassword !== confirmNewPassword) {
          alert('⚠️ Las contraseñas nuevas no coinciden.');
          setLoading(false);
          return;
        }
        if (!currentPassword) {
          alert('⚠️ Debes ingresar tu contraseña actual para cambiarla.');
          setLoading(false);
          return;
        }
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: session.user.email!,
          password: currentPassword,
        });

        if (authError) {
          alert("❌ La contraseña actual es incorrecta.");
          setLoading(false);
          return;
        }

        const { error: updatePassError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updatePassError) throw updatePassError;
      }
      
      // Actualizar Profiles (Datos personales)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nombre_completo: name,
          telefono: phone,
        })
        .eq("id", usuarioId);

      if (profileError) throw profileError;
      
      // LÓGICA DE CREAR O ACTUALIZAR EL PUESTO DE LA CASERITA
      if (rol === "Vendedora" || rol === "caserita") {
        // Verificamos primero si ya tiene un registro en puestos_venta
        const { data: puestoExistente } = await supabase
          .from("puestos_venta")
          .select("id")
          .eq("vendedora_id", usuarioId)
          .maybeSingle();

        if (puestoExistente) {
          // Si existe, lo ACTUALIZAMOS
          const { error: updatePuestoError } = await supabase
            .from("puestos_venta")
            .update({
              nombre_puesto: market,
              nro_puesto: standNumber,
              sector: sector,
            })
            .eq("vendedora_id", usuarioId);
          if (updatePuestoError) throw updatePuestoError;
        } else {
          // Si NO existe, lo CREAMOS
          const { error: insertPuestoError } = await supabase
            .from("puestos_venta")
            .insert({
              vendedora_id: usuarioId,
              nombre_puesto: market,
              nro_puesto: standNumber,
              sector: sector,
              esta_abierto: false, // Por defecto cerrado
            });
          if (insertPuestoError) throw insertPuestoError;
        }
      }

      alert('✅ ¡Perfil actualizado con éxito!');
      onViewChange('home');
      
    } catch(error: any) {
      alert("❌ Error al guardar los cambios: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-orange-600 font-bold animate-pulse text-lg">Cargando tus datos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
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
          
          {/* Badge del rol */}
          <div className="mb-8 flex justify-center">
             <span className="inline-block bg-orange-100 text-orange-800 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
               Rol Actual: {rol}
             </span>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            <div className="flex flex-col items-center -mt-4">
               <div className="w-28 h-28 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                   <span className="text-4xl font-bold text-white">
                     {name ? name.charAt(0).toUpperCase() : "U"}
                   </span>
               </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                <User className="w-5 h-5 text-orange-500" /> Datos Personales
              </h3>
              
              {/* Cajas de Nombre y Teléfono (Editables) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-gray-50 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Celular</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-gray-50 focus:bg-white transition-colors" placeholder="Ej: 71234567" />
                </div>
              </div>

              {/* Caja de Correo (Solo Lectura) */}
              <div className="pt-2">
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" /> Correo Electrónico (Acceso)
                </label>
                <input 
                  type="email" 
                  value={email} 
                  disabled 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed outline-none" 
                  title="El correo con el que inicias sesión no se puede modificar aquí"
                />
              </div>
            </div>

            {(rol === 'Vendedora' || rol === 'caserita') && (
              <div className="space-y-4 p-5 bg-pink-50 rounded-xl border border-pink-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <h3 className="text-lg font-bold text-pink-800 flex items-center gap-2 border-b border-pink-200 pb-2">
                  <Store className="w-5 h-5" /> Datos del Negocio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Puesto</label>
                    <input type="text" value={market} onChange={(e) => setMarket(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-white" placeholder="Ej. Doña Mary" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nro Puesto</label>
                    {/* INYECCIÓN DE ALEXIA: Bloqueamos letras y espacios, solo permite números */}
                    <input 
                      type="text" 
                      value={standNumber} 
                      onChange={(e) => setStandNumber(e.target.value.replace(/\D/g, ''))} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-white" 
                      placeholder="Ej. 24" 
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Sector</label>
                    <input type="text" value={sector} onChange={(e) => setSector(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none bg-white" placeholder="Ej. Carnes" />
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

            <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-md transition-opacity mt-4">
              <Save className="w-5 h-5" /> Guardar Cambios
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}