"use client";

import { useState } from "react";
import { Star, Clock, MessageSquare, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Market } from "@/types";

interface MarketCardProps {
  market: Market;
  onAddReview: (marketId: string, rating: number, comment: string) => void;
}

export function MarketCard({ market, onAddReview }: MarketCardProps) {
  const [showProducts, setShowProducts] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [showAddReview, setShowAddReview] = useState(false);

  const handleSubmitReview = () => {
    if (newRating > 0 && newComment.trim()) {
      onAddReview(market.id, newRating, newComment);
      setNewRating(0);
      setNewComment("");
      setShowAddReview(false);
    }
  };

  const availableProducts = market.products.filter((p) => p.available);

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:scale-[1.02]" style={{ borderColor: market.color }}>
      <div className="relative h-48 overflow-hidden">
        <img src={market.image} alt={market.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <Badge className="absolute top-3 right-3 text-white font-bold shadow-lg" style={{ backgroundColor: market.isOpen ? "#4caf50" : "#f44336" }}>
          {market.isOpen ? "🟢 ABIERTO" : "🔴 CERRADO"}
        </Badge>
        <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/95 rounded-full px-3 py-1.5 shadow-lg">
          <MapPin className="w-3.5 h-3.5 text-orange-600" />
          <span className="text-xs font-medium text-gray-700">{market.marketLocation}</span>
        </div>
      </div>

      <CardHeader className="pb-3" style={{ borderLeftWidth: "4px", borderLeftColor: market.color }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-bold mb-1 text-lg" style={{ color: market.color }}>{market.name}</h3>
            <Badge variant="secondary" className="text-xs">{market.category}</Badge>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-lg">{market.rating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-muted-foreground">({market.reviews.length} reseñas)</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        <p className="text-sm leading-relaxed">{market.description}</p>
        <div className="flex items-center gap-2 text-sm bg-blue-50 rounded-lg px-3 py-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-900">{market.hours}</span>
        </div>

        {/* Products */}
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
            {showProducts ? <ChevronUp className="w-5 h-5" style={{ color: market.color }} /> : <ChevronDown className="w-5 h-5" style={{ color: market.color }} />}
          </Button>
          {showProducts && (
            <div className="space-y-2 pt-1">
              {availableProducts.length > 0 ? availableProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 rounded-lg shadow-sm border-l-4 bg-white" style={{ borderLeftColor: market.color }}>
                  <span className="text-sm font-medium">{product.name}</span>
                  <span className="text-sm font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${market.color}20`, color: market.color }}>
                    Bs. {product.price.toFixed(2)}
                  </span>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-4 italic">No hay productos disponibles</p>}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-3 h-auto rounded-xl"
            style={{ backgroundColor: showReviews ? `${market.color}15` : "transparent" }}
            onClick={() => setShowReviews(!showReviews)}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" style={{ color: market.color }} />
              <span className="text-sm font-bold" style={{ color: market.color }}>💬 Comentarios ({market.reviews.length})</span>
            </div>
            {showReviews ? <ChevronUp className="w-5 h-5" style={{ color: market.color }} /> : <ChevronDown className="w-5 h-5" style={{ color: market.color }} />}
          </Button>
          {showReviews && (
            <div className="space-y-3 pt-1">
              {market.reviews.map((review) => (
                <div key={review.id} className="p-3 rounded-lg border-l-4 bg-gradient-to-r from-white to-gray-50 shadow-sm" style={{ borderLeftColor: market.color }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-9 h-9 border-2" style={{ borderColor: market.color }}>
                        <div className="w-full h-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: market.color }}>
                          <span className="text-sm">{review.userName.charAt(0).toUpperCase()}</span>
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
              {market.reviews.length === 0 && <p className="text-sm text-muted-foreground text-center py-4 italic">Sé el primero en comentar 🎉</p>}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-4">
        {!showAddReview ? (
          <Button className="w-full font-bold shadow-md text-white" style={{ backgroundColor: market.color }} onClick={() => setShowAddReview(true)}>
            ⭐ Agregar mi opinión
          </Button>
        ) : (
          <div className="w-full space-y-3 p-4 rounded-xl border-2" style={{ borderColor: market.color, backgroundColor: `${market.color}05` }}>
            <div className="space-y-2">
              <label className="text-sm font-bold">Tu calificación ⭐</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setNewRating(star)} className="hover:scale-125 transition-transform">
                    <Star className={`w-8 h-8 ${star <= newRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">Tu comentario 💭</label>
              <Textarea
                placeholder="Cuéntanos tu experiencia en este puesto..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="border-2 focus:ring-2"
                style={{ borderColor: market.color }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmitReview} disabled={newRating === 0 || !newComment.trim()} className="flex-1 font-bold text-white" style={{ backgroundColor: market.color }}>
                Publicar 🚀
              </Button>
              <Button variant="outline" className="border-2" style={{ borderColor: market.color, color: market.color }}
                onClick={() => { setShowAddReview(false); setNewRating(0); setNewComment(""); }}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
