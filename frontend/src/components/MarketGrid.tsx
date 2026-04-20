import { Market } from "@/types";
import { MarketCard } from "@/components/MarketCard";

interface MarketGridProps {
  markets: Market[];
  onAddReview: (marketId: string, rating: number, comment: string) => void;
}

export function MarketGrid({ markets, onAddReview }: MarketGridProps) {
  if (markets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se encontraron puestos de mercado con los filtros seleccionados</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} onAddReview={onAddReview} />
      ))}
    </div>
  );
}
