import { useState } from "react";
import { Scan, Bird, Egg, Target, Sparkles, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Detection {
  id: string;
  type: "bird" | "nest" | "egg";
  x: number;
  y: number;
  confidence: number;
  label: string;
}

const mockDetections: Detection[] = [
  { id: "1", type: "bird", x: 25, y: 30, confidence: 0.96, label: "Brown Pelican" },
  { id: "2", type: "bird", x: 45, y: 25, confidence: 0.94, label: "Brown Pelican" },
  { id: "3", type: "nest", x: 35, y: 55, confidence: 0.89, label: "Active Nest" },
  { id: "4", type: "bird", x: 65, y: 40, confidence: 0.92, label: "Great Egret" },
  { id: "5", type: "nest", x: 55, y: 65, confidence: 0.87, label: "Active Nest" },
  { id: "6", type: "egg", x: 40, y: 70, confidence: 0.85, label: "Eggs (3)" },
  { id: "7", type: "bird", x: 75, y: 55, confidence: 0.91, label: "Roseate Spoonbill" },
];

export function ImageAnalysisPreview() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetections, setShowDetections] = useState(true);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setShowDetections(false);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowDetections(true);
    }, 2000);
  };

  const stats = {
    birds: mockDetections.filter((d) => d.type === "bird").length,
    nests: mockDetections.filter((d) => d.type === "nest").length,
    eggs: mockDetections.filter((d) => d.type === "egg").length,
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Scan className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold">AI Image Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Click anywhere to detect birds & nests
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetections(!showDetections)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showDetections ? "Hide" : "Show"}
          </Button>
          <Button variant="hero" size="sm" onClick={handleAnalyze}>
            <Sparkles className="h-4 w-4 mr-2" />
            Analyze
          </Button>
        </div>
      </div>

      {/* Image Area */}
      <div className="relative aspect-video bg-gradient-to-br from-secondary to-background overflow-hidden">
        {/* Placeholder Image Background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        
        {/* Simulated Aerial View */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground/50">
            <Bird className="h-16 w-16 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Aerial Survey Image</p>
            <p className="text-xs">Queen Bess Island - 2024</p>
          </div>
        </div>

        {/* Analysis Scanning Effect */}
        {isAnalyzing && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-primary/5" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Analyzing image...</span>
              </div>
            </div>
          </div>
        )}

        {/* Detection Markers */}
        {showDetections && !isAnalyzing && mockDetections.map((detection) => (
          <button
            key={detection.id}
            onClick={() => setSelectedDetection(detection)}
            className={cn(
              "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200",
              "hover:scale-125 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full"
            )}
            style={{ left: `${detection.x}%`, top: `${detection.y}%` }}
          >
            <div className={cn(
              "relative flex h-8 w-8 items-center justify-center rounded-full border-2 animate-scale-in",
              detection.type === "bird" && "bg-primary/20 border-primary",
              detection.type === "nest" && "bg-success/20 border-success",
              detection.type === "egg" && "bg-warning/20 border-warning",
              selectedDetection?.id === detection.id && "ring-4 ring-offset-2 ring-offset-background"
            )}>
              {detection.type === "bird" && <Bird className="h-4 w-4 text-primary" />}
              {detection.type === "nest" && <Target className="h-4 w-4 text-success" />}
              {detection.type === "egg" && <Egg className="h-4 w-4 text-warning" />}
            </div>
          </button>
        ))}

        {/* Selected Detection Info */}
        {selectedDetection && (
          <div className="absolute bottom-4 left-4 glass-card p-3 animate-scale-in max-w-xs">
            <div className="flex items-center gap-2 mb-1">
              {selectedDetection.type === "bird" && <Bird className="h-4 w-4 text-primary" />}
              {selectedDetection.type === "nest" && <Target className="h-4 w-4 text-success" />}
              {selectedDetection.type === "egg" && <Egg className="h-4 w-4 text-warning" />}
              <span className="font-medium">{selectedDetection.label}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Confidence:</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${selectedDetection.confidence * 100}%` }}
                />
              </div>
              <span>{(selectedDetection.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-3 divide-x divide-border/50 border-t border-border/50">
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Bird className="h-4 w-4 text-primary" />
            <span className="font-display text-2xl font-bold">{stats.birds}</span>
          </div>
          <p className="text-xs text-muted-foreground">Birds Detected</p>
        </div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Target className="h-4 w-4 text-success" />
            <span className="font-display text-2xl font-bold">{stats.nests}</span>
          </div>
          <p className="text-xs text-muted-foreground">Active Nests</p>
        </div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Egg className="h-4 w-4 text-warning" />
            <span className="font-display text-2xl font-bold">{stats.eggs}</span>
          </div>
          <p className="text-xs text-muted-foreground">Egg Clusters</p>
        </div>
      </div>
    </div>
  );
}
