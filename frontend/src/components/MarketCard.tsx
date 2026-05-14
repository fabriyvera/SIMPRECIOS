"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Star,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  MapPin,
  Heart,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar } from "./ui/avatar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PriceComparison } from "./PriceComparison";
import { PriceValidator } from "./PriceValidator";
import { Market, PriceHistory } from "@/types";

interface OverpriceReport {
  productName: string;
  reportedPrice: string;
  comment: string;
}

interface MarketCardProps {
  market: Market;
  onAddReview: (marketId: string, rating: number, comment: string) => void;
  allMarkets: Market[];
  priceHistory: Record<string, PriceHistory[]>;
  averagePrices: Record<string, number>;
  referencePrices: Record<string, number>;
  isFavorite?: boolean;
  onToggleFavorite?: (marketId: string) => void;
  onReportOverprice?: (marketId: string, report: OverpriceReport) => void;
}

export function MarketCard({
  market,
  onAddReview,
  allMarkets,
  priceHistory,
  averagePrices,
  referencePrices,
  isFavorite = false,
  onToggleFavorite,
  onReportOverprice,
}: MarketCardProps) {
  // Estados generales
  const [showProducts, setShowProducts] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [showAddReview, setShowAddReview] = useState(false);

  // Historial, comparación, validador
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<string | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showValidatorModal, setShowValidatorModal] = useState(false);
  const [selectedProductForComparison, setSelectedProductForComparison] = useState<{ name: string; price: number } | null>(null);

  // Favorito
  const [favorite, setFavorite] = useState(isFavorite);
  useEffect(() => {
    setFavorite(isFavorite);
  }, [isFavorite]);

  // Denuncia de sobreprecio
  const [showReport, setShowReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportForm, setReportForm] = useState<OverpriceReport>({
    productName: "",
    reportedPrice: "",
    comment: "",
  });

  const availableProducts = market.products.filter((p) => p.available);

  // Cálculo de confiabilidad (transparencia) general del puesto
  const transparencyScore = useMemo(() => {
    if (availableProducts.length === 0) return null;
    let sumDeviations = 0;
    for (const product of availableProducts) {
      const marketAvg = averagePrices[product.name];
      if (marketAvg && marketAvg > 0) {
        const deviation = Math.abs(product.price - marketAvg) / marketAvg;
        sumDeviations += deviation;
      }
    }
    const avgDeviation = sumDeviations / availableProducts.length;
    // Mientras menor desviación, mayor confianza. Convertimos a porcentaje inverso.
    let score = Math.max(0, Math.min(100, Math.round((1 - avgDeviation) * 100)));
    if (isNaN(score)) score = 100;
    return score;
  }, [availableProducts, averagePrices]);

  const transparencyColor =
    transparencyScore === null
      ? "#9e9e9e"
      : transparencyScore >= 70
      ? "#4caf50"
      : transparencyScore >= 40
      ? "#ff9800"
      : "#f44336";

  const handleToggleFavorite = () => {
    const next = !favorite;
    setFavorite(next);
    onToggleFavorite?.(market.id);
  };

  const handleSubmitReview = () => {
    if (newRating > 0 && newComment.trim()) {
      onAddReview(market.id, newRating, newComment);
      setNewRating(0);
      setNewComment("");
      setShowAddReview(false);
    }
  };

  const handleSubmitReport = () => {
    if (!reportForm.productName.trim() || !reportForm.reportedPrice.trim()) return;
    onReportOverprice?.(market.id, reportForm);
    setReportSent(true);
    setTimeout(() => {
      setReportSent(false);
      setShowReport(false);
      setReportForm({ productName: "", reportedPrice: "", comment: "" });
    }, 2500);
  };

  const handleVerifyTransparency = () => {
    if (transparencyScore !== null) {
      alert(`🔍 Confiabilidad del puesto: ${transparencyScore}%\nBasado en la consistencia de sus precios respecto al mercado.`);
    } else {
      alert("No hay suficientes productos para calcular la confiabilidad.");
    }
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:scale-[1.02]"
      style={{ borderColor: market.color }}
    >
      {/* Imagen y badges */}
      <div className="relative h-48 overflow-hidden">
        <img src={market.image} alt={market.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        <Badge
          className="absolute top-3 right-3 text-white font-bold shadow-lg"
          style={{ backgroundColor: market.isOpen ? "#4caf50" : "#f44336" }}
        >
          {market.isOpen ? "🟢 ABIERTO" : "🔴 CERRADO"}
        </Badge>

        <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/95 rounded-full px-3 py-1.5 shadow-lg">
          <MapPin className="w-3.5 h-3.5 text-orange-600" />
          <span className="text-xs font-medium text-gray-700">{market.marketLocation}</span>
        </div>

        <button
          onClick={handleToggleFavorite}
          title={favorite ? "Quitar de favoritos" : "Guardar en favoritos"}
          className="absolute top-3 left-3 p-2 rounded-full bg-white/90 shadow-md hover:scale-110 transition-transform"
        >
          <Heart
            className="w-5 h-5 transition-colors"
            style={{
              fill: favorite ? "#e53935" : "transparent",
              color: favorite ? "#e53935" : "#9e9e9e",
            }}
          />
        </button>
      </div>

      {/* Header */}
      <CardHeader className="pb-3" style={{ borderLeftWidth: "4px", borderLeftColor: market.color }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-bold mb-1 text-lg" style={{ color: market.color }}>
              {market.name}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {market.category}
            </Badge>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-lg">{market.rating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-muted-foreground">({market.reviews.length} reseñas)</span>

            {transparencyScore !== null && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white mt-1"
                style={{ backgroundColor: transparencyColor }}
              >
                <ShieldCheck className="w-3 h-3" />
                {transparencyScore}% confiable
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        <p className="text-sm leading-relaxed">{market.description}</p>

        <div className="flex items-center gap-2 text-sm bg-blue-50 rounded-lg px-3 py-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-900">{market.hours}</span>
        </div>

        {/* Productos */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-3 h-auto rounded-xl"
            style={{ backgroundColor: showProducts ? `${market.color}15` : "transparent" }}
            onClick={() => setShowProducts(!showProducts)}
          >
            <span className="text-sm font-bold" style={{ color: market.color }}>
              🛒 Productos disponibles ({availableProducts.length})
            </span>
            {showProducts ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>

          {showProducts && (
            <div className="space-y-2 pt-1">
              {availableProducts.map((product) => (
                <div key={product.id} className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg border-l-4 bg-white shadow-sm" style={{ borderLeftColor: market.color }}>
                    <span className="text-sm font-medium flex-1">{product.name}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-bold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: `${market.color}20`, color: market.color }}
                      >
                        Bs. {product.price.toFixed(2)}
                      </span>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={() =>
                          setSelectedProductForHistory(selectedProductForHistory === product.id ? null : product.id)
                        }
                      >
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={() => {
                          setSelectedProductForComparison({ name: product.name, price: product.price });
                          setShowComparisonModal(true);
                        }}
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={() => {
                          setSelectedProductForComparison({ name: product.name, price: product.price });
                          setShowValidatorModal(true);
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {selectedProductForHistory === product.id && priceHistory?.[product.name] && (
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <h5 className="font-bold mb-3 flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4" style={{ color: market.color }} /> Tendencia - {product.name}
                      </h5>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={priceHistory[product.name]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={50} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip
                            formatter={(value: any) => [`Bs. ${Number(value).toFixed(2)}`, "Precio"]}
                            labelStyle={{ fontWeight: "bold", fontSize: "12px" }}
                          />
                          <Line type="monotone" dataKey="price" stroke={market.color} strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="bg-white p-2 rounded border">
                          <p className="text-gray-500">Mínimo</p>
                          <p className="font-bold">
                            Bs. {Math.min(...(priceHistory[product.name]?.map((h) => h.price) || [0])).toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <p className="text-gray-500">Promedio</p>
                          <p className="font-bold">
                            Bs.{" "}
                            {(
                              (priceHistory[product.name]?.reduce((a, b) => a + b.price, 0) || 0) /
                              (priceHistory[product.name]?.length || 1)
                            ).toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <p className="text-gray-500">Máximo</p>
                          <p className="font-bold">
                            Bs. {Math.max(...(priceHistory[product.name]?.map((h) => h.price) || [0])).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Denuncias */}
        {!showReport && !reportSent && (
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 text-sm font-semibold text-orange-600 border-orange-400 hover:bg-orange-50"
            onClick={() => setShowReport(true)}
          >
            <AlertTriangle className="w-4 h-4" />
            Denunciar sobreprecio
          </Button>
        )}

        {reportSent && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Denuncia enviada. ¡Gracias por contribuir!
          </div>
        )}

        {showReport && !reportSent && (
          <div className="space-y-3 p-4 rounded-xl border-2 border-orange-400 bg-orange-50">
            <p className="text-sm font-bold text-orange-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Denunciar sobreprecio
            </p>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Producto *</label>
              <select
                className="w-full text-sm border border-orange-300 rounded-lg px-3 py-2 bg-white"
                value={reportForm.productName}
                onChange={(e) => setReportForm((f) => ({ ...f, productName: e.target.value }))}
              >
                <option value="">Selecciona un producto</option>
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} — Bs. {p.price.toFixed(2)} (publicado)
                  </option>
                ))}
                <option value="otro">Otro producto</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Precio cobrado (Bs.) *</label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="ej. 55.00"
                className="w-full text-sm border border-orange-300 rounded-lg px-3 py-2 bg-white"
                value={reportForm.reportedPrice}
                onChange={(e) => setReportForm((f) => ({ ...f, reportedPrice: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Comentario (opcional)</label>
              <Textarea
                placeholder="Describe brevemente lo que ocurrió..."
                value={reportForm.comment}
                onChange={(e) => setReportForm((f) => ({ ...f, comment: e.target.value }))}
                rows={2}
                className="border border-orange-300"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSubmitReport}
                disabled={!reportForm.productName.trim() || !reportForm.reportedPrice.trim()}
                className="flex-1 font-bold text-white bg-orange-500 hover:bg-orange-600"
              >
                Enviar denuncia
              </Button>
              <Button
                variant="outline"
                className="border-2 border-orange-400 text-orange-600"
                onClick={() => {
                  setShowReport(false);
                  setReportForm({ productName: "", reportedPrice: "", comment: "" });
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Reseñas */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-3 h-auto rounded-xl"
            style={{ backgroundColor: showReviews ? `${market.color}15` : "transparent" }}
            onClick={() => setShowReviews(!showReviews)}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" style={{ color: market.color }} />
              <span className="text-sm font-bold" style={{ color: market.color }}>
                Comentarios ({market.reviews.length})
              </span>
            </div>
            {showReviews ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>

          {showReviews && (
            <div className="space-y-3 pt-1">
              {market.reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-3 rounded-lg border-l-4 bg-gradient-to-r from-white to-gray-50 shadow-sm"
                  style={{ borderLeftColor: market.color }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-9 h-9 border-2" style={{ borderColor: market.color }}>
                        <div
                          className="w-full h-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: market.color }}
                        >
                          {review.userName.charAt(0).toUpperCase()}
                        </div>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold">{review.userName}</p>
                        <p className="text-xs text-muted-foreground">{review.date || "Reciente"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold">{review.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed pl-11">{review.comment}</p>
                </div>
              ))}
              {market.reviews.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 italic">Sé el primero en comentar</p>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Footer con dos botones: Calificar atención y Verificar transparencia */}
      <CardFooter className="pt-0 pb-4 flex gap-2">
        {!showAddReview ? (
          <>
            <Button
              className="flex-1 font-bold shadow-md text-white"
              style={{ backgroundColor: market.color }}
              onClick={() => setShowAddReview(true)}
            >
              ⭐ Calificar atención
            </Button>
            <Button
              className="flex-1 font-bold shadow-md border-2"
              style={{ borderColor: market.color, color: market.color }}
              variant="outline"
              onClick={handleVerifyTransparency}
            >
              <ShieldCheck className="w-4 h-4 mr-1" />
              Verificar transparencia
            </Button>
          </>
        ) : (
          <div
            className="w-full space-y-3 p-4 rounded-xl border-2"
            style={{ borderColor: market.color, backgroundColor: `${market.color}05` }}
          >
            <p className="text-sm font-bold" style={{ color: market.color }}>
              Califica la atención de este puesto
            </p>
            <p className="text-xs text-muted-foreground -mt-2">
              Tu calificación ayuda a otros compradores a elegir mejor.
            </p>
            <div className="space-y-1">
              <label className="text-sm font-semibold">Calificación</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setNewRating(star)} className="hover:scale-125 transition-transform">
                    <Star
                      className={`w-8 h-8 ${
                        star <= newRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {newRating > 0 && (
                <p className="text-xs text-muted-foreground">
                  {["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"][newRating]}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">Tu experiencia 💭</label>
              <Textarea
                placeholder="¿Cómo fue la atención? ¿El trato fue amable? ¿El producto era fresco?..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="border-2 focus:ring-2"
                style={{ borderColor: market.color }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSubmitReview}
                disabled={newRating === 0 || !newComment.trim()}
                className="flex-1 font-bold text-white"
                style={{ backgroundColor: market.color }}
              >
                Publicar
              </Button>
              <Button
                variant="outline"
                className="border-2"
                style={{ borderColor: market.color, color: market.color }}
                onClick={() => {
                  setShowAddReview(false);
                  setNewRating(0);
                  setNewComment("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardFooter>

      {/* Modales */}
      {selectedProductForComparison && (
        <>
          <PriceComparison
            isOpen={showComparisonModal}
            onClose={() => {
              setShowComparisonModal(false);
              setSelectedProductForComparison(null);
            }}
            productName={selectedProductForComparison.name}
            currentPrice={selectedProductForComparison.price}
            currentMarket={market}
            allMarkets={allMarkets}
          />
          <PriceValidator
            isOpen={showValidatorModal}
            onClose={() => {
              setShowValidatorModal(false);
              setSelectedProductForComparison(null);
            }}
            productName={selectedProductForComparison.name}
            currentPrice={selectedProductForComparison.price}
            referencePrice={referencePrices?.[selectedProductForComparison.name] || selectedProductForComparison.price}
            averagePrice={averagePrices?.[selectedProductForComparison.name] || selectedProductForComparison.price}
            marketColor={market.color}
          />
        </>
      )}
    </Card>
  );
}