import { useState, useCallback } from "react";
import { ManagerHeader } from "@/components/layout/ManagerHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Wand2, Bird, Loader2, AlertCircle, ImageIcon } from "lucide-react";
import { predictImage, type PredictionResult } from "@/lib/gradioService";

type AnalysisState = "idle" | "analyzing" | "done" | "error";

export default function ManagerImageAnalysis() {
    const [state, setState] = useState<AnalysisState>("idle");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [result, setResult] = useState<PredictionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<Array<PredictionResult & { fileName: string; timestamp: Date }>>([]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setResult(null);
        setError(null);
        setState("idle");
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setResult(null);
        setError(null);
        setState("idle");
    }, []);

    const handleAnalyze = async () => {
        if (!selectedFile) return;
        setState("analyzing");
        setError(null);

        try {
            const prediction = await predictImage(selectedFile);
            setResult(prediction);
            setState("done");
            setHistory(prev => [
                { ...prediction, fileName: selectedFile.name, timestamp: new Date() },
                ...prev.slice(0, 9),
            ]);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to connect to ML backend";
            setError(msg);
            setState("error");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <ManagerHeader />

            <main className="container mx-auto px-4 lg:px-8 pt-12 pb-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Image Analysis</h1>
                    <p className="text-muted-foreground">
                        AI-powered bird and nest counting from aerial survey images — powered by CSRNet density estimation
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Upload + Analyze Section */}
                    <div className="space-y-6">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Upload className="h-5 w-5" />
                                    Analyze Aerial Image
                                </CardTitle>
                                <CardDescription>
                                    Upload a colony aerial photo for automated bird and nest counting
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <label
                                    className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer block"
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt="Selected"
                                            className="max-h-64 mx-auto rounded-lg object-contain"
                                        />
                                    ) : (
                                        <>
                                            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                            <p className="font-medium mb-1">Drop image here or click to browse</p>
                                            <p className="text-sm text-muted-foreground">
                                                Supports JPG, PNG, TIFF up to 50MB
                                            </p>
                                        </>
                                    )}
                                </label>
                                {selectedFile && (
                                    <p className="text-xs text-muted-foreground mt-2 text-center">
                                        {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                                    </p>
                                )}
                                <Button
                                    className="w-full mt-4"
                                    onClick={handleAnalyze}
                                    disabled={!selectedFile || state === "analyzing"}
                                >
                                    {state === "analyzing" ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Analyzing (may take 30s if Space is waking up)...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="h-4 w-4 mr-2" />
                                            Count Birds & Nests
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Error */}
                        {state === "error" && error && (
                            <Card className="border-destructive/50">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-destructive">Analysis Failed</p>
                                            <p className="text-sm text-muted-foreground mt-1">{error}</p>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                The HuggingFace Space may be sleeping. It takes ~30s to wake up. Try again.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Results */}
                        {state === "done" && result && (
                            <Card className="glass-card border-primary/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Bird className="h-5 w-5 text-primary" />
                                        Prediction Results
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-primary/10 rounded-xl p-4 text-center">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                                Birds
                                            </p>
                                            <p className="text-2xl font-bold text-primary">
                                                {result.birdCount}
                                            </p>
                                        </div>
                                        <div className="bg-blue-500/10 rounded-xl p-4 text-center">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                                Nests
                                            </p>
                                            <p className="text-2xl font-bold text-blue-500">
                                                {result.nestCount}
                                            </p>
                                        </div>
                                    </div>
                                    <pre className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 whitespace-pre-wrap">
                                        {result.modelInfo}
                                    </pre>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Visualization + History */}
                    <div className="space-y-6">
                        {/* Density Visualization */}
                        {state === "done" && result?.visualization && (
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ImageIcon className="h-5 w-5" />
                                        Density Heatmap
                                    </CardTitle>
                                    <CardDescription>
                                        Spatial density map showing bird and nest concentrations
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <img
                                        src={result.visualization}
                                        alt="Density visualization"
                                        className="w-full rounded-lg"
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Analysis History */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Recent Analyses</CardTitle>
                                <CardDescription>
                                    {history.length > 0
                                        ? `${history.length} image${history.length > 1 ? "s" : ""} analyzed this session`
                                        : "Upload an image to get started"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {history.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Bird className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">No analyses yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {history.map((h, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
                                            >
                                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                    <Bird className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{h.fileName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {h.birdCount} birds | {h.nestCount} nests
                                                    </p>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground shrink-0">
                                                    {h.timestamp.toLocaleTimeString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
