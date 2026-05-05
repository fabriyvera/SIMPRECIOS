"use client";

import { useState } from "react";
import {
  Star,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  MapPin,
  Heart,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { PriceComparison } from "./PriceComparison";
import { PriceValidator } from "./PriceValidator";
import { Market } from "@/types";


type PriceVerification = "correct" | "incorrect" | null;

interface OverpriceReport {
  productName: string;
  reportedPrice: string;
  comment: string;
}

interface MarketCardProps {
  market: Market;

  /** HU-14 */
  onAddReview: (marketId: string, rating: number, comment: string) => void;

  /** HU-17 */
  isFavorite?: boolean;
  onToggleFavorite?: (marketId: string) => void;

  /** HU-15 */
  onVerifyPrice?: (
    marketId: string,
    productId: string,
    isCorrect: boolean
  ) => void;

  /** HU-16 */
  onReportOverprice?: (marketId: string, report: OverpriceReport) => void;
}

export function MarketCard({
  market,
  onAddReview,
  isFavorite = false,
  onToggleFavorite,
  onVerifyPrice,
  onReportOverprice,
}: MarketCardProps) {
  // ── estados originales ──────────────────────
  const [showProducts, setShowProducts] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [showAddReview, setShowAddReview] = useState(false);

  // ── HU-17: favorito ────────────────────────
  const [favorite, setFavorite] = useState(isFavorite);

  // ── HU-15: verificación de precios ─────────
  const [priceVerifications, setPriceVerifications] = useState<
    Record<string, PriceVerification>
  >({});
  const [showVerify, setShowVerify] = useState(false);

  // ── HU-16: denuncia de sobreprecio ─────────
  const [showReport, setShowReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportForm, setReportForm] = useState<OverpriceReport>({
    productName: "",
    reportedPrice: "",
    comment: "",
  });

  const availableProducts = market.products.filter((p) => p.available);

  // ── handlers ────────────────────────────────

  /** HU-14 */
  const handleSubmitReview = () => {
    if (newRating > 0 && newComment.trim()) {
      onAddReview(market.id, newRating, newComment);
      setNewRating(0);
      setNewComment("");
      setShowAddReview(false);
    }
  };

  /** HU-17 */
  const handleToggleFavorite = () => {
    const next = !favorite;
    setFavorite(next);
    onToggleFavorite?.(market.id);
  };

  /** HU-15 */
  const handleVerifyPrice = (productId: string, isCorrect: boolean) => {
    setPriceVerifications((prev) => ({
      ...prev,
      [productId]: isCorrect ? "correct" : "incorrect",
    }));
    onVerifyPrice?.(market.id, productId, isCorrect);
  };

  /** HU-16 */
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

  // ── helpers visuales ────────────────────────

  const verifiedCount = Object.values(priceVerifications).filter(
    (v) => v === "correct"
  ).length;
  const totalVerified = Object.keys(priceVerifications).length;
  const transparencyScore =
    totalVerified > 0 ? Math.round((verifiedCount / totalVerified) * 100) : null;

  const transparencyColor =
    transparencyScore === null
      ? "#9e9e9e"
      : transparencyScore >= 70
      ? "#4caf50"
      : transparencyScore >= 40
      ? "#ff9800"
      : "#f44336";

  // ────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────

  return (
    <Card
      className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:scale-[1.02]"
      style={{ borderColor: market.color }}
    >
      {/* ── Imagen ─────────────────────────────── */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={market.image}
          alt={market.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Estado abierto/cerrado */}
        <Badge
          className="absolute top-3 right-3 text-white font-bold shadow-lg"
          style={{ backgroundColor: market.isOpen ? "#4caf50" : "#f44336" }}
        >
          {market.isOpen ? "ABIERTO" : "CERRADO"}
        </Badge>

        {/* Ubicación */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/95 rounded-full px-3 py-1.5 shadow-lg">
          <MapPin className="w-3.5 h-3.5 text-orange-600" />
          <span className="text-xs font-medium text-gray-700">
            {market.marketLocation}
          </span>
        </div>

        {/* ── HU-17: botón favorito ──────────────── */}
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

      {/* ── Encabezado ─────────────────────────── */}
      <CardHeader
        className="pb-3"
        style={{ borderLeftWidth: "4px", borderLeftColor: market.color }}
      >
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
            {/* Calificación general */}
            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-lg">{market.rating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({market.reviews.length} reseñas)
            </span>

            {/* ── HU-15: indicador de transparencia ─ */}
            {transparencyScore !== null && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white mt-1"
                style={{ backgroundColor: transparencyColor }}
              >
                <ShieldCheck className="w-3 h-3" />
                {transparencyScore}% verificado
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {/* ── Contenido ──────────────────────────── */}
      <CardContent className="space-y-3 pb-3">
        <p className="text-sm leading-relaxed">{market.description}</p>

        <div className="flex items-center gap-2 text-sm bg-blue-50 rounded-lg px-3 py-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-900">{market.hours}</span>
        </div>

        {/* ── Productos ──────────────────────────── */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-3 h-auto rounded-xl"
            style={{
              backgroundColor: showProducts ? `${market.color}15` : "transparent",
            }}
            onClick={() => setShowProducts(!showProducts)}
          >
            <span className="text-sm font-bold" style={{ color: market.color }}>
              🛒 Productos disponibles ({availableProducts.length})
            </span>
            {showProducts ? (
              <ChevronUp className="w-5 h-5" style={{ color: market.color }} />
            ) : (
              <ChevronDown className="w-5 h-5" style={{ color: market.color }} />
            )}
          </Button>

          {showProducts && (
            <div className="space-y-2 pt-1">
              {availableProducts.length > 0 ? (
                availableProducts.map((product) => {
                  const verification = priceVerifications[product.id];
                  return (
                    <div
                      key={product.id}
                      className="p-3 rounded-lg shadow-sm border-l-4 bg-white"
                      style={{ borderLeftColor: market.color }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{product.name}</span>
                        <span
                          className="text-sm font-bold px-2.5 py-1 rounded-full"
                          style={{
                            backgroundColor: `${market.color}20`,
                            color: market.color,
                          }}
                        >
                          Bs. {product.price.toFixed(2)}
                        </span>
                      </div>

                      {/* ── HU-15: verificar precio por producto ─── */}
                      {showVerify && (
                        <div className="mt-2 flex items-center gap-2">
                          {verification === null || verification === undefined ? (
                            <>
                              <span className="text-xs text-muted-foreground">
                                ¿Coincide con el precio real?
                              </span>
                              <button
                                onClick={() =>
                                  handleVerifyPrice(product.id, true)
                                }
                                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Sí
                              </button>
                              <button
                                onClick={() =>
                                  handleVerifyPrice(product.id, false)
                                }
                                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                              >
                                <XCircle className="w-3 h-3" /> No
                              </button>
                            </>
                          ) : (
                            <span
                              className={`flex items-center gap-1 text-xs font-semibold ${
                                verification === "correct"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {verification === "correct" ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Precio verificado
                                </>
                              ) : (
                                <>
                                  <ShieldX className="w-3.5 h-3.5" />
                                  Precio no coincide
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 italic">
                  No hay productos disponibles
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── HU-15: botón activar verificación ─────── */}
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 text-sm font-semibold"
          style={{
            borderColor: market.color,
            color: showVerify ? "white" : market.color,
            backgroundColor: showVerify ? market.color : "transparent",
          }}
          onClick={() => {
            setShowVerify(!showVerify);
            if (!showVerify) setShowProducts(true);
          }}
        >
          <ShieldCheck className="w-4 h-4" />
          {showVerify ? "Ocultar verificación" : "Verificar transparencia"}
        </Button>

        {/* ── HU-16: denuncia de sobreprecio ─────────── */}
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

            {/* Producto */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">
                Producto *
              </label>
              <select
                className="w-full text-sm border border-orange-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={reportForm.productName}
                onChange={(e) =>
                  setReportForm((f) => ({ ...f, productName: e.target.value }))
                }
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

            {/* Precio cobrado */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">
                Precio cobrado (Bs.) *
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="ej. 55.00"
                className="w-full text-sm border border-orange-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={reportForm.reportedPrice}
                onChange={(e) =>
                  setReportForm((f) => ({ ...f, reportedPrice: e.target.value }))
                }
              />
            </div>

            {/* Comentario */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">
                Comentario (opcional)
              </label>
              <Textarea
                placeholder="Describe brevemente lo que ocurrió..."
                value={reportForm.comment}
                onChange={(e) =>
                  setReportForm((f) => ({ ...f, comment: e.target.value }))
                }
                rows={2}
                className="border border-orange-300 focus:ring-2 focus:ring-orange-400 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmitReport}
                disabled={
                  !reportForm.productName.trim() || !reportForm.reportedPrice.trim()
                }
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

        {/* ── Comentarios (HU-14 incluido) ────────── */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-3 h-auto rounded-xl"
            style={{
              backgroundColor: showReviews ? `${market.color}15` : "transparent",
            }}
            onClick={() => setShowReviews(!showReviews)}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" style={{ color: market.color }} />
              <span className="text-sm font-bold" style={{ color: market.color }}>
                Comentarios ({market.reviews.length})
              </span>
            </div>
            {showReviews ? (
              <ChevronUp className="w-5 h-5" style={{ color: market.color }} />
            ) : (
              <ChevronDown className="w-5 h-5" style={{ color: market.color }} />
            )}
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
                      <Avatar
                        className="w-9 h-9 border-2"
                        style={{ borderColor: market.color }}
                      >
                        <div
                          className="w-full h-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: market.color }}
                        >
                          <span className="text-sm">
                            {review.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold">{review.userName}</p>
                        <p className="text-xs text-muted-foreground">{review.date}</p>
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
                <p className="text-sm text-muted-foreground text-center py-4 italic">
                  Sé el primero en comentar 
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* ── HU-14: agregar calificación de atención ─── */}
      <CardFooter className="pt-0 pb-4">
        {!showAddReview ? (
          <Button
            className="w-full font-bold shadow-md text-white"
            style={{ backgroundColor: market.color }}
            onClick={() => setShowAddReview(true)}
          >
            Calificar atención
          </Button>
        ) : (
          <div
            className="w-full space-y-3 p-4 rounded-xl border-2"
            style={{
              borderColor: market.color,
              backgroundColor: `${market.color}05`,
            }}
          >
            <p className="text-sm font-bold" style={{ color: market.color }}>
              Califica la atención de este puesto
            </p>
            <p className="text-xs text-muted-foreground -mt-2">
              Tu calificación ayuda a otros compradores a elegir mejor.
            </p>

            {/* Estrellas */}
            <div className="space-y-1">
              <label className="text-sm font-semibold">Calificación</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className="hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= newRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
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

            {/* Comentario */}
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
    </Card>
  );
}