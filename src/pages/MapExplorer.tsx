import { useState } from "react";
import { Header } from "@/components/layout/Header";
import {
  MapPin,
  Layers,
  Filter,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  ChevronDown,
  Bird,
  Target,
  Calendar,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Colony {
  id: string;
  name: string;
  species: string[];
  population: number;
  status: "active" | "stable" | "declining" | "unknown";
  lastSurvey: string;
  coordinates: { lat: number; lng: number };
}

const colonies: Colony[] = [
  {
    id: "1",
    name: "Rabbit Island Colony",
    species: ["Brown Pelican", "Double-crested Cormorant"],
    population: 2450,
    status: "active",
    lastSurvey: "2024-03-15",
    coordinates: { lat: 29.2, lng: -89.5 },
  },
  {
    id: "2",
    name: "Queen Bess Island",
    species: ["Brown Pelican", "Great Egret", "Roseate Spoonbill"],
    population: 3200,
    status: "active",
    lastSurvey: "2024-03-12",
    coordinates: { lat: 29.3, lng: -90.1 },
  },
  {
    id: "3",
    name: "Isle au Pitre",
    species: ["Great Egret", "Snowy Egret", "Little Blue Heron"],
    population: 890,
    status: "stable",
    lastSurvey: "2024-02-28",
    coordinates: { lat: 29.4, lng: -89.8 },
  },
  {
    id: "4",
    name: "Elmer's Island",
    species: ["Roseate Spoonbill", "White Ibis"],
    population: 420,
    status: "declining",
    lastSurvey: "2024-03-01",
    coordinates: { lat: 29.1, lng: -90.0 },
  },
  {
    id: "5",
    name: "Grand Isle Rookery",
    species: ["Royal Tern", "Sandwich Tern", "Black Skimmer"],
    population: 1650,
    status: "stable",
    lastSurvey: "2024-03-10",
    coordinates: { lat: 29.2, lng: -89.9 },
  },
];

export default function MapExplorer() {
  const [selectedColony, setSelectedColony] = useState<Colony | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoom, setZoom] = useState(100);

  const filteredColonies = colonies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.species.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16 h-screen flex">
        {/* Sidebar */}
        <aside className="w-80 border-r border-border/50 bg-card/30 backdrop-blur-xl flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search colonies or species..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border/50 rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-border/50">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  showFilters && "rotate-180"
                )}
              />
            </button>
            {showFilters && (
              <div className="mt-4 space-y-3 animate-fade-in">
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {["active", "stable", "declining"].map((status) => (
                      <button
                        key={status}
                        className={cn(
                          "px-2 py-1 text-xs rounded-full border capitalize",
                          status === "active" &&
                            "border-success/50 text-success bg-success/10",
                          status === "stable" &&
                            "border-primary/50 text-primary bg-primary/10",
                          status === "declining" &&
                            "border-destructive/50 text-destructive bg-destructive/10"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Year Range
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      placeholder="From"
                      className="w-full px-2 py-1 bg-background/50 border border-border/50 rounded text-sm"
                    />
                    <span className="text-muted-foreground">–</span>
                    <input
                      type="number"
                      placeholder="To"
                      className="w-full px-2 py-1 bg-background/50 border border-border/50 rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Colony List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <p className="text-xs text-muted-foreground mb-2">
              {filteredColonies.length} colonies found
            </p>
            {filteredColonies.map((colony) => (
              <button
                key={colony.id}
                onClick={() => setSelectedColony(colony)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all",
                  selectedColony?.id === colony.id
                    ? "bg-primary/10 border-primary/30"
                    : "bg-background/30 border-border/50 hover:bg-secondary/50"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{colony.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {colony.species.slice(0, 2).join(", ")}
                      {colony.species.length > 2 &&
                        ` +${colony.species.length - 2}`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full capitalize",
                      colony.status === "active" &&
                        "bg-success/20 text-success",
                      colony.status === "stable" &&
                        "bg-primary/20 text-primary",
                      colony.status === "declining" &&
                        "bg-destructive/20 text-destructive"
                    )}
                  >
                    {colony.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Bird className="h-3 w-3" />
                    {colony.population.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(colony.lastSurvey).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Map Area */}
        <div className="flex-1 relative">
          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <div className="glass-card p-1 flex flex-col gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(Math.min(200, zoom + 25))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(Math.max(50, zoom - 25))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
            <div className="glass-card p-1 flex flex-col gap-1">
              <Button variant="ghost" size="icon">
                <Layers className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Map Content */}
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-background map-grid">
            {/* Louisiana Coast SVG */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 800 600"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Water */}
              <rect width="100%" height="100%" fill="hsl(196 30% 15%)" />

              {/* Coastline */}
              <path
                d="M0,300 Q100,280 200,290 T400,280 Q500,275 600,290 T800,285 L800,600 L0,600 Z"
                fill="hsl(196 23% 20%)"
                stroke="hsl(38 92% 60% / 0.3)"
                strokeWidth="2"
              />

              {/* Land details */}
              <path
                d="M150,320 Q180,310 220,325 T280,315 Q300,320 320,330"
                fill="none"
                stroke="hsl(196 15% 35%)"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
              <path
                d="M400,295 Q450,285 500,300 T580,290"
                fill="none"
                stroke="hsl(196 15% 35%)"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
            </svg>

            {/* Colony Markers */}
            {colonies.map((colony, index) => (
              <button
                key={colony.id}
                onClick={() => setSelectedColony(colony)}
                className={cn(
                  "absolute transform -translate-x-1/2 -translate-y-1/2 group transition-all duration-300",
                  selectedColony?.id === colony.id ? "z-20 scale-125" : "z-10"
                )}
                style={{
                  left: `${15 + index * 16}%`,
                  top: `${35 + (index % 3) * 12}%`,
                }}
              >
                <div
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                    colony.status === "active" &&
                      "bg-success/20 border-success",
                    colony.status === "stable" &&
                      "bg-primary/20 border-primary",
                    colony.status === "declining" &&
                      "bg-destructive/20 border-destructive",
                    selectedColony?.id === colony.id &&
                      "ring-4 ring-primary/40"
                  )}
                >
                  <MapPin
                    className={cn(
                      "h-5 w-5",
                      colony.status === "active" && "text-success",
                      colony.status === "stable" && "text-primary",
                      colony.status === "declining" && "text-destructive"
                    )}
                  />
                  {colony.status === "active" && (
                    <span className="absolute inset-0 rounded-full bg-success/30 animate-ping" />
                  )}
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg">
                    {colony.name}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Selected Colony Detail Panel */}
          {selectedColony && (
            <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 glass-card animate-scale-in">
              <div className="p-4 border-b border-border/50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-lg">
                      {selectedColony.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Last surveyed:{" "}
                      {new Date(selectedColony.lastSurvey).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedColony(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Population</p>
                    <p className="font-display text-2xl font-bold">
                      {selectedColony.population.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-sm font-medium capitalize mt-1",
                        selectedColony.status === "active" &&
                          "bg-success/20 text-success",
                        selectedColony.status === "stable" &&
                          "bg-primary/20 text-primary",
                        selectedColony.status === "declining" &&
                          "bg-destructive/20 text-destructive"
                      )}
                    >
                      {selectedColony.status}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Species Present
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedColony.species.map((species) => (
                      <span
                        key={species}
                        className="px-2 py-1 text-xs bg-secondary rounded-full"
                      >
                        {species}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="hero" className="flex-1">
                    <Target className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    History
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 glass-card p-3 hidden lg:block">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Colony Status
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="h-3 w-3 rounded-full bg-success" />
                <span>Active Growth</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="h-3 w-3 rounded-full bg-primary" />
                <span>Stable</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="h-3 w-3 rounded-full bg-destructive" />
                <span>Declining</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
