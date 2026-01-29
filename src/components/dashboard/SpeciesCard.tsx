import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpeciesCardProps {
  name: string;
  scientificName: string;
  population: number;
  trend: "up" | "down" | "stable";
  trendValue: string;
  imageUrl?: string;
  color: string;
}

export function SpeciesCard({
  name,
  scientificName,
  population,
  trend,
  trendValue,
  imageUrl,
  color,
}: SpeciesCardProps) {
  return (
    <div className="glass-card glow-border p-4 group cursor-pointer hover:scale-[1.02] transition-transform duration-300">
      <div className="flex items-center gap-4">
        {/* Species Image/Icon */}
        <div
          className="relative h-16 w-16 rounded-xl overflow-hidden flex-shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-2xl"
              style={{ color }}
            >
              🦅
            </div>
          )}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: `linear-gradient(135deg, ${color}30, transparent)` }}
          />
        </div>

        {/* Species Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-semibold truncate">{name}</h4>
          <p className="text-sm text-muted-foreground italic truncate">
            {scientificName}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-display font-bold">
              {population.toLocaleString()}
            </span>
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full",
                trend === "up" && "bg-success/20 text-success",
                trend === "down" && "bg-destructive/20 text-destructive",
                trend === "stable" && "bg-muted text-muted-foreground"
              )}
            >
              {trend === "up" && <TrendingUp className="h-3 w-3" />}
              {trend === "down" && <TrendingDown className="h-3 w-3" />}
              {trend === "stable" && <Minus className="h-3 w-3" />}
              {trendValue}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
