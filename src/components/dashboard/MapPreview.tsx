import { useState } from "react";
import { MapPin, ZoomIn, ZoomOut, Layers, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ColonyMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  species: string;
  population: number;
  status: "active" | "declining" | "stable";
}

const mockColonies: ColonyMarker[] = [
  { id: "1", name: "Rabbit Island Colony", lat: 29.2, lng: -89.5, species: "Brown Pelican", population: 2450, status: "active" },
  { id: "2", name: "Isle au Pitre", lat: 29.4, lng: -89.8, species: "Great Egret", population: 890, status: "stable" },
  { id: "3", name: "Queen Bess Island", lat: 29.3, lng: -90.1, species: "Mixed Colony", population: 3200, status: "active" },
  { id: "4", name: "Elmer's Island", lat: 29.1, lng: -90.0, species: "Roseate Spoonbill", population: 420, status: "declining" },
  { id: "5", name: "Grand Isle", lat: 29.2, lng: -89.9, species: "Royal Tern", population: 1650, status: "stable" },
];

export function MapPreview() {
  const [selectedColony, setSelectedColony] = useState<ColonyMarker | null>(null);
  const [zoom, setZoom] = useState(100);

  return (
    <div className="glass-card overflow-hidden">
      {/* Map Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div>
          <h3 className="font-display font-semibold">Louisiana Coastal Colonies</h3>
          <p className="text-sm text-muted-foreground">Real-time colony monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(50, zoom - 25))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
          <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(200, zoom + 25))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Layers className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Map Area */}
      <div className="relative h-[400px] bg-gradient-to-b from-secondary/50 to-background map-grid overflow-hidden">
        {/* Stylized Louisiana Coast Outline */}
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 400 300"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M50,150 Q100,120 150,140 T250,130 Q300,125 350,150 L350,250 Q300,240 250,250 T150,245 Q100,240 50,250 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary/40"
          />
          <path
            d="M80,160 Q120,150 160,160 T240,155 Q280,150 320,165"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-muted-foreground/30"
            strokeDasharray="4 4"
          />
        </svg>

        {/* Colony Markers */}
        {mockColonies.map((colony, index) => (
          <button
            key={colony.id}
            onClick={() => setSelectedColony(colony)}
            className={cn(
              "absolute transform -translate-x-1/2 -translate-y-1/2 group",
              "transition-all duration-300 hover:scale-110 focus:outline-none"
            )}
            style={{
              left: `${20 + (index * 15)}%`,
              top: `${30 + (index % 3) * 20}%`,
            }}
          >
            <div className={cn(
              "relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
              colony.status === "active" && "bg-success/20 border-success",
              colony.status === "stable" && "bg-primary/20 border-primary",
              colony.status === "declining" && "bg-destructive/20 border-destructive",
              selectedColony?.id === colony.id && "ring-4 ring-primary/30 scale-125"
            )}>
              <MapPin className={cn(
                "h-4 w-4",
                colony.status === "active" && "text-success",
                colony.status === "stable" && "text-primary",
                colony.status === "declining" && "text-destructive"
              )} />
              {colony.status === "active" && (
                <span className="absolute inset-0 rounded-full bg-success/40 animate-ping" />
              )}
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                {colony.name}
              </div>
            </div>
          </button>
        ))}

        {/* Selected Colony Info Panel */}
        {selectedColony && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 glass-card p-4 animate-scale-in">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-display font-semibold">{selectedColony.name}</h4>
                <p className="text-sm text-muted-foreground">{selectedColony.species}</p>
              </div>
              <button
                onClick={() => setSelectedColony(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Population</p>
                <p className="font-display font-bold text-lg">{selectedColony.population.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                  selectedColony.status === "active" && "bg-success/20 text-success",
                  selectedColony.status === "stable" && "bg-primary/20 text-primary",
                  selectedColony.status === "declining" && "bg-destructive/20 text-destructive"
                )}>
                  {selectedColony.status}
                </span>
              </div>
            </div>
            <Button variant="hero" size="sm" className="w-full mt-4">
              View Details
            </Button>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 glass-card p-3 hidden md:block">
          <p className="text-xs font-medium text-muted-foreground mb-2">Colony Status</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span>Active Growth</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>Stable</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              <span>Declining</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
