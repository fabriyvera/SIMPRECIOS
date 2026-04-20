import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  rating: number;
  image: string;
  description: string;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(price);

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="aspect-square overflow-hidden">
        <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="line-clamp-2 flex-1 mr-2">{product.name}</h3>
          <Badge variant="secondary" className="shrink-0">{product.category}</Badge>
        </div>
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
          ))}
          <span className="text-sm text-muted-foreground ml-1">({product.rating})</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
        <span className="text-lg text-primary">{formatPrice(product.price)}</span>
      </CardContent>
    </Card>
  );
}
