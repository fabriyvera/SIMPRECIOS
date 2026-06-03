"use client";

import React, { useEffect, useState } from "react";
import { Calendar, AlertTriangle, Star, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { API, buildUrl } from "@/config/api";

interface InteraccionUnificada {
  tipo: "calificacion" | "denuncia";
  interaccion_id: number;
  puesto_id: number;
  usuario_id: string | null;
  puntuacion: number | null;
  texto: string | null;
  fecha: string;
  precio_detectado: number | null;
  estado: string | null;
}

interface ListaInteraccionesPuestoResponse {
  puesto_id: number;
  total_calificaciones: number;
  promedio_estrellas: number;
  total_denuncias: number;
  denuncias_pendientes: number;
  interacciones: InteraccionUnificada[];
}

interface CommentsSectionProps {
  puestoId: number;
  className?: string;
}

export function CommentsSection({
  puestoId,
  className = "",
}: CommentsSectionProps) {
  const [interacciones, setInteracciones] =
    useState<ListaInteraccionesPuestoResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<
    "todas" | "calificacion" | "denuncia"
  >("todas");

  useEffect(() => {
    cargarInteracciones();
  }, [puestoId, filtroTipo]);

  const cargarInteracciones = async () => {
    try {
      setCargando(true);
      const params = new URLSearchParams();
      if (filtroTipo !== "todas") {
        params.append("tipo", filtroTipo);
      }

      const url = buildUrl(API.ENDPOINTS.OBTENER_INTERACCIONES_PUESTO, {
        puesto_id: puestoId,
      });

      const response = await fetch(
        `${url}?${params}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Error al cargar interacciones");
      }

      const data: ListaInteraccionesPuestoResponse = await response.json();
      setInteracciones(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      console.error("Error cargando interacciones:", err);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className={`${className} flex justify-center items-center py-8`}>
        <p className="text-gray-500">Cargando comentarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex justify-center items-center py-8`}>
        <p className="text-red-500 text-sm">Error: {error}</p>
      </div>
    );
  }

  if (!interacciones || interacciones.interacciones.length === 0) {
    return (
      <div className={`${className} flex justify-center items-center py-8`}>
        <p className="text-gray-500 text-sm">No hay comentarios aún</p>
      </div>
    );
  }

  const filtroInteracciones = interacciones.interacciones.filter((i) => {
    if (filtroTipo === "todas") return true;
    return i.tipo === filtroTipo;
  });

  return (
    <div className={className}>
      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Card className="p-3 bg-blue-50">
          <p className="text-xs text-gray-600 font-medium">Calificaciones</p>
          <p className="text-lg font-bold text-blue-600">
            {interacciones.total_calificaciones}
          </p>
          {interacciones.promedio_estrellas > 0 && (
            <p className="text-xs text-yellow-600 flex items-center gap-1">
              <Star size={12} className="fill-yellow-400" />
              {interacciones.promedio_estrellas.toFixed(1)}
            </p>
          )}
        </Card>

        <Card className="p-3 bg-red-50">
          <p className="text-xs text-gray-600 font-medium">Denuncias</p>
          <p className="text-lg font-bold text-red-600">
            {interacciones.total_denuncias}
          </p>
          {interacciones.denuncias_pendientes > 0 && (
            <p className="text-xs text-orange-600 flex items-center gap-1">
              <AlertTriangle size={12} />
              {interacciones.denuncias_pendientes} pendientes
            </p>
          )}
        </Card>

        <Card className="p-3 bg-purple-50">
          <p className="text-xs text-gray-600 font-medium">Total</p>
          <p className="text-lg font-bold text-purple-600">
            {interacciones.interacciones.length}
          </p>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["todas", "calificacion", "denuncia"] as const).map((tipo) => (
          <button
            key={tipo}
            onClick={() => setFiltroTipo(tipo)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filtroTipo === tipo
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {tipo === "todas" && "Todas"}
            {tipo === "calificacion" && "Calificaciones"}
            {tipo === "denuncia" && "Denuncias"}
          </button>
        ))}
      </div>

      {/* Lista de Interacciones */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filtroInteracciones.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-4">
            No hay {filtroTipo === "todas" ? "comentarios" : filtroTipo + "s"}{" "}
            para mostrar
          </p>
        ) : (
          filtroInteracciones.map((interaccion) => (
            <Card
              key={`${interaccion.tipo}-${interaccion.interaccion_id}`}
              className={`p-4 border-l-4 transition-colors ${
                interaccion.tipo === "calificacion"
                  ? "border-l-yellow-500 bg-yellow-50 hover:bg-yellow-100"
                  : "border-l-red-500 bg-red-50 hover:bg-red-100"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {interaccion.tipo === "calificacion" ? (
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < (interaccion.puntuacion || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertTriangle size={14} />
                      <span className="text-xs font-bold">DENUNCIA</span>
                    </div>
                  )}
                </div>

                {interaccion.tipo === "denuncia" && (
                  <Badge
                    variant={
                      interaccion.estado === "Pendiente"
                        ? "destructive"
                        : interaccion.estado === "Revisado"
                          ? "secondary"
                          : "outline"
                    }
                    className="text-xs"
                  >
                    {interaccion.estado}
                  </Badge>
                )}
              </div>

              {/* Contenido */}
              <div className="mb-2">
                {interaccion.texto && (
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {interaccion.texto}
                  </p>
                )}
              </div>

              {/* Detalles */}
              <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                <div className="flex items-center gap-1">
                  <User size={12} />
                  <span className="truncate">
                    {interaccion.usuario_id
                      ? interaccion.usuario_id.slice(0, 8)
                      : "Anónimo"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>
                    {new Date(interaccion.fecha).toLocaleDateString("es-VE", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {interaccion.tipo === "denuncia" &&
                  interaccion.precio_detectado && (
                    <div className="font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                      Bs. {interaccion.precio_detectado.toFixed(2)}
                    </div>
                  )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
