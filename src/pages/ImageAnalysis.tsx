import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import {
  Upload,
  Scan,
  Bird,
  Target,
  Egg,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Detection {
  id: string;
  type: "bird" | "nest" | "egg";
  label: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const sampleDetections: Detection[] = [
  { id: "1", type: "bird", label: "Brown Pelican", confidence: 0.96, x: 20, y: 25, width: 8, height: 10 },
  { id: "2", type: "bird", label: "Brown Pelican", confidence: 0.94, x: 35, y: 20, width: 7, height: 9 },
  { id: "3", type: "nest", label: "Active Nest", confidence: 0.91, x: 28, y: 50, width: 12, height: 10 },
  { id: "4", type: "bird", label: "Great Egret", confidence: 0.89, x: 55, y: 35, width: 6, height: 12 },
  { id: "5", type: "nest", label: "Active Nest", confidence: 0.87, x: 48, y: 60, width: 10, height: 8 },
  { id: "6", type: "egg", label: "Eggs (3)", confidence: 0.85, x: 50, y: 65, width: 6, height: 4 },
  { id: "7", type: "bird", label: "Roseate Spoonbill", confidence: 0.92, x: 72, y: 45, width: 8, height: 11 },
  { id: "8", type: "bird", label: "Brown Pelican", confidence: 0.88, x: 82, y: 30, width: 7, height: 9 },
];

export default function ImageAnalysis() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [showDetections, setShowDetections] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setDetections([]);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setDetections([]);
    setTimeout(() => {
      setIsAnalyzing(false);
      setDetections(sampleDetections);
    }, 2500);
  };

  const handleReset = () => {
    setUploadedImage(null);
    setDetections([]);
    setSelectedDetection(null);
  };

  const stats = {
    birds: detections.filter((d) => d.type === "bird").length,
    nests: detections.filter((d) => d.type === "nest").length,
    eggs: detections.filter((d) => d.type === "egg").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>Tools</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">Image Analysis</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              AI-Powered Image Analysis
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Upload aerial survey images to automatically detect and label birds,
              nests, and breeding features using advanced computer vision.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Main Analysis Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Image Upload / Analysis Area */}
              <div className="glass-card overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    {uploadedImage && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setZoom(Math.max(50, zoom - 25))}
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground w-12 text-center">
                          {zoom}%
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setZoom(Math.min(200, zoom + 25))}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-6 bg-border/50 mx-2" />
                        <Button variant="ghost" size="sm" onClick={handleReset}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {detections.length > 0 && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDetections(!showDetections)}
                        >
                          {showDetections ? "Hide Labels" : "Show Labels"}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </>
                    )}
                    {uploadedImage && detections.length === 0 && !isAnalyzing && (
                      <Button variant="hero" onClick={handleAnalyze}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Analyze Image
                      </Button>
                    )}
                  </div>
                </div>

                {/* Image Area */}
                <div
                  className={cn(
                    "relative min-h-[500px] transition-colors",
                    !uploadedImage && "cursor-pointer",
                    isDragging && "bg-primary/5 border-2 border-dashed border-primary/50"
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => !uploadedImage && document.getElementById("file-input")?.click()}
                >
                  {!uploadedImage ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                      <div className="relative mb-6">
                        <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <Upload className="h-10 w-10 text-primary" />
                        </div>
                        <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-xl -z-10" />
                      </div>
                      <h3 className="font-display text-xl font-semibold mb-2">
                        Upload Survey Image
                      </h3>
                      <p className="text-muted-foreground text-center max-w-md mb-4">
                        Drag and drop an aerial photograph, or click to browse.
                        Supports JPEG, PNG, and TIFF formats.
                      </p>
                      <Button variant="outline">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Browse Files
                      </Button>
                      <input
                        id="file-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setUploadedImage(event.target?.result as string);
                              setDetections([]);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="relative overflow-hidden bg-secondary/30">
                      {/* Placeholder for uploaded image */}
                      <div
                        className="relative w-full min-h-[500px] bg-gradient-to-br from-secondary to-background map-grid"
                        style={{ transform: `scale(${zoom / 100})` }}
                      >
                        {/* Simulated aerial view background */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                          <div className="text-center">
                            <Bird className="h-24 w-24 mx-auto mb-4" />
                            <p className="text-lg">Aerial Survey Image</p>
                          </div>
                        </div>

                        {/* Analyzing overlay */}
                        {isAnalyzing && (
                          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-30">
                            <div className="text-center">
                              <div className="relative h-16 w-16 mx-auto mb-4">
                                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                <Scan className="absolute inset-0 m-auto h-6 w-6 text-primary" />
                              </div>
                              <p className="font-medium">Analyzing image...</p>
                              <p className="text-sm text-muted-foreground">
                                Detecting birds, nests, and eggs
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Detection boxes */}
                        {showDetections &&
                          detections.map((detection) => (
                            <button
                              key={detection.id}
                              onClick={() => setSelectedDetection(detection)}
                              className={cn(
                                "absolute border-2 rounded transition-all cursor-pointer",
                                detection.type === "bird" &&
                                  "border-primary bg-primary/10 hover:bg-primary/20",
                                detection.type === "nest" &&
                                  "border-success bg-success/10 hover:bg-success/20",
                                detection.type === "egg" &&
                                  "border-warning bg-warning/10 hover:bg-warning/20",
                                selectedDetection?.id === detection.id &&
                                  "ring-2 ring-offset-2 ring-offset-background"
                              )}
                              style={{
                                left: `${detection.x}%`,
                                top: `${detection.y}%`,
                                width: `${detection.width}%`,
                                height: `${detection.height}%`,
                              }}
                            >
                              <span
                                className={cn(
                                  "absolute -top-6 left-0 text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap",
                                  detection.type === "bird" &&
                                    "bg-primary text-primary-foreground",
                                  detection.type === "nest" &&
                                    "bg-success text-success-foreground",
                                  detection.type === "egg" &&
                                    "bg-warning text-warning-foreground"
                                )}
                              >
                                {detection.label}
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Results Summary */}
                {detections.length > 0 && (
                  <div className="grid grid-cols-3 divide-x divide-border/50 border-t border-border/50">
                    <div className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Bird className="h-5 w-5 text-primary" />
                        <span className="font-display text-3xl font-bold">
                          {stats.birds}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Birds Detected
                      </p>
                    </div>
                    <div className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Target className="h-5 w-5 text-success" />
                        <span className="font-display text-3xl font-bold">
                          {stats.nests}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Active Nests
                      </p>
                    </div>
                    <div className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Egg className="h-5 w-5 text-warning" />
                        <span className="font-display text-3xl font-bold">
                          {stats.eggs}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Egg Clusters
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Detection Details */}
              {selectedDetection && (
                <div className="glass-card p-4 animate-scale-in">
                  <h3 className="font-display font-semibold mb-4">
                    Detection Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center",
                          selectedDetection.type === "bird" &&
                            "bg-primary/20 text-primary",
                          selectedDetection.type === "nest" &&
                            "bg-success/20 text-success",
                          selectedDetection.type === "egg" &&
                            "bg-warning/20 text-warning"
                        )}
                      >
                        {selectedDetection.type === "bird" && (
                          <Bird className="h-5 w-5" />
                        )}
                        {selectedDetection.type === "nest" && (
                          <Target className="h-5 w-5" />
                        )}
                        {selectedDetection.type === "egg" && (
                          <Egg className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{selectedDetection.label}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {selectedDetection.type}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Confidence Score
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              selectedDetection.confidence >= 0.9
                                ? "bg-success"
                                : selectedDetection.confidence >= 0.8
                                ? "bg-primary"
                                : "bg-warning"
                            )}
                            style={{
                              width: `${selectedDetection.confidence * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {(selectedDetection.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* All Detections List */}
              {detections.length > 0 && (
                <div className="glass-card p-4">
                  <h3 className="font-display font-semibold mb-4">
                    All Detections ({detections.length})
                  </h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {detections.map((detection) => (
                      <button
                        key={detection.id}
                        onClick={() => setSelectedDetection(detection)}
                        className={cn(
                          "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
                          selectedDetection?.id === detection.id
                            ? "bg-primary/10"
                            : "hover:bg-secondary/50"
                        )}
                      >
                        <div
                          className={cn(
                            "h-8 w-8 rounded flex items-center justify-center flex-shrink-0",
                            detection.type === "bird" &&
                              "bg-primary/20 text-primary",
                            detection.type === "nest" &&
                              "bg-success/20 text-success",
                            detection.type === "egg" &&
                              "bg-warning/20 text-warning"
                          )}
                        >
                          {detection.type === "bird" && (
                            <Bird className="h-4 w-4" />
                          )}
                          {detection.type === "nest" && (
                            <Target className="h-4 w-4" />
                          )}
                          {detection.type === "egg" && (
                            <Egg className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {detection.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(detection.confidence * 100).toFixed(0)}% confidence
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="glass-card p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm mb-1">Analysis Tips</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Use high-resolution aerial images for best results</li>
                      <li>• Clear weather conditions improve accuracy</li>
                      <li>• Click on any detection to see details</li>
                      <li>• Export results for further analysis</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
