"use client";

import { useState } from "react";
import { Star, Clock, MessageSquare, ChevronDown, ChevronUp, MapPin, TrendingUp, BarChart3, CheckCircle, Heart } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar } from "./ui/avatar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PriceComparison } from "./PriceComparison";
import { PriceValidator } from "./PriceValidator";
import { Market, PriceHistory } from "@/types";

interface MarketCardProps {
  market: Market;
  onAddReview: (marketId: string, rating: number, comment: string) => void;
  allMarkets: Market[];
  priceHistory: Record<string, PriceHistory[]>;
  averagePrices: Record<string, number>;
  referencePrices: Record<string, number>;
  onToggleFavorite: (marketId: string) => void;
}

export function MarketCard({
  market,
  onAddReview,
  allMarkets,
  priceHistory,
  averagePrices,
  referencePrices,
  onToggleFavorite
}: MarketCardProps) {
  const [showProducts, setShowProducts] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [showAddReview, setShowAddReview] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<string | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showValidatorModal, setShowValidatorModal] = useState(false);
  const [selectedProductForComparison, setSelectedProductForComparison] = useState<{ name: string; price: number } | null>(null);

  const handleSubmitReview = () => {
    if (newRating > 0 && newComment.trim()) {
      onAddReview(market.id, newRating, newComment);
      setNewRating(0);
      setNewComment("");
      setShowAddReview(false);
    }
  };

  const availableProducts = market.products.filter(p => p.available);

  return (
    <Card 
      className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:scale-[1.02] ${market.isFavorite ? 'ring-4 ring-yellow-400 shadow-yellow-200 shadow-lg' : ''}`} 
      style={{ borderColor: market.isFavorite ? '#facc15' : market.color }}
    >
      <div className="relative h-48 overflow-hidden">
        <img src={market.image} alt={market.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(market.id); }}
          className="absolute top-3 left-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
        >
          <Heart className={`w-5 h-5 ${market.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
        <Badge
          className="absolute top-3 right-3 text-white font-bold shadow-lg"
          style={{ backgroundColor: market.isOpen ? '#4caf50' : '#f44336' }}
        >
          {market.isOpen ? "🟢 ABIERTO" : "🔴 CERRADO"}
        </Badge>
        <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/95 rounded-full px-3 py-1.5 shadow-lg">
          <MapPin className="w-3.5 h-3.5 text-orange-600" />
          <span className="text-xs font-medium text-gray-700">{market.marketLocation}</span>
        </div>
      </div>

      <CardHeader className="pb-3" style={{ borderLeftWidth: '4px', borderLeftColor: market.color }}>
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

        {/* Sección de Productos */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-3 h-auto rounded-xl hover:bg-opacity-10"
            style={{ backgroundColor: showProducts ? `${market.color}15` : 'transparent' }}
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
                      <span className="text-sm font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${market.color}20`, color: market.color }}>
                        Bs. {product.price.toFixed(2)}
                      </span>
                      <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setSelectedProductForHistory(selectedProductForHistory === product.id ? null : product.id)}>
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setSelectedProductForComparison({ name: product.name, price: product.price }); setShowComparisonModal(true); }}>
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setSelectedProductForComparison({ name: product.name, price: product.price }); setShowValidatorModal(true); }}>
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Historial de Precios Blindado */}
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
                            formatter={(value: any) => [`Bs. ${Number(value).toFixed(2)}`, 'Precio']}
                            labelStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                          />
                          <Line type="monotone" dataKey="price" stroke={market.color} strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="bg-white p-2 rounded border">
                          <p className="text-gray-500">Mínimo</p>
                          <p className="font-bold">Bs. {Math.min(...(priceHistory[product.name]?.map(h => h.price) || [0])).toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <p className="text-gray-500">Promedio</p>
                          <p className="font-bold">Bs. {(priceHistory[product.name]?.reduce((a, b) => a + b.price, 0) / (priceHistory[product.name]?.length || 1)).toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <p className="text-gray-500">Máximo</p>
                          <p className="font-bold">Bs. {Math.max(...(priceHistory[product.name]?.map(h => h.price) || [0])).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección de Reseñas */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-3 h-auto rounded-xl"
            style={{ backgroundColor: showReviews ? `${market.color}15` : 'transparent' }}
            onClick={() => setShowReviews(!showReviews)}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" style={{ color: market.color }} />
              <span className="text-sm font-bold" style={{ color: market.color }}>Comentarios ({market.reviews.length})</span>
            </div>
            {showReviews ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>

          {showReviews && (
            <div className="space-y-3 pt-1">
              {market.reviews.map((review) => (
                <div key={review.id} className="p-3 rounded-lg border-l-4 bg-gray-50" style={{ borderLeftColor: market.color }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{review.userName}</span>
                    <div className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> <span className="text-xs">{review.rating}</span></div>
                  </div>
                  <p className="text-xs text-gray-600">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-4">
        {!showAddReview ? (
          <Button className="w-full font-bold text-white" style={{ backgroundColor: market.color }} onClick={() => setShowAddReview(true)}>⭐ Calificar Puesto</Button>
        ) : (
          <div className="w-full space-y-3 p-3 border-2 rounded-xl" style={{ borderColor: market.color }}>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-6 h-6 cursor-pointer ${s <= newRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} onClick={() => setNewRating(s)} />
              ))}
            </div>
            <Textarea placeholder="Tu opinión..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={2} className="text-sm" />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 text-white" style={{ backgroundColor: market.color }} onClick={handleSubmitReview}>Publicar</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddReview(false)}>X</Button>
            </div>
          </div>
        )}
      </CardFooter>

      {/* Modales con Blindaje de Datos */}
      {selectedProductForComparison && (
        <>
          <PriceComparison
            isOpen={showComparisonModal}
            onClose={() => { setShowComparisonModal(false); setSelectedProductForComparison(null); }}
            productName={selectedProductForComparison.name}
            currentPrice={selectedProductForComparison.price}
            currentMarket={market}
            allMarkets={allMarkets}
          />
          <PriceValidator
            isOpen={showValidatorModal}
            onClose={() => { setShowValidatorModal(false); setSelectedProductForComparison(null); }}
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