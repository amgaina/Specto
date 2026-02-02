import { useState, useCallback } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
    Camera,
    Upload,
    MapPin,
    Calendar,
    Bird,
    CheckCircle2,
    Star,
    Trash2,
    AlertCircle,
    Info,
} from "lucide-react";

interface UploadedPhoto {
    id: string;
    file: File;
    preview: string;
    species?: string;
    location?: string;
    notes?: string;
    status: "pending" | "uploading" | "success" | "error";
    credits?: number;
}

export default function PublicUpload() {
    const [isDragging, setIsDragging] = useState(false);
    const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    const handleFiles = useCallback((files: File[]) => {
        const imageFiles = files.filter((f) => f.type.startsWith("image/"));

        const newPhotos: UploadedPhoto[] = imageFiles.map((file) => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: URL.createObjectURL(file),
            status: "pending" as const,
        }));

        setPhotos((prev) => [...prev, ...newPhotos]);
        if (newPhotos.length > 0 && !selectedPhoto) {
            setSelectedPhoto(newPhotos[0].id);
        }
    }, [selectedPhoto]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(Array.from(e.dataTransfer.files));
    }, [handleFiles]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const updatePhoto = (id: string, updates: Partial<UploadedPhoto>) => {
        setPhotos((prev) =>
            prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
        );
    };

    const deletePhoto = (id: string) => {
        setPhotos((prev) => prev.filter((p) => p.id !== id));
        if (selectedPhoto === id) {
            setSelectedPhoto(photos.find((p) => p.id !== id)?.id || null);
        }
    };

    const submitPhotos = async () => {
        const pendingPhotos = photos.filter((p) => p.status === "pending");

        for (const photo of pendingPhotos) {
            updatePhoto(photo.id, { status: "uploading" });

            // Simulate upload
            await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

            // Calculate credits (5 base + 5 bonus if species identified)
            const credits = 5 + (photo.species ? 5 : 0);
            updatePhoto(photo.id, { status: "success", credits });
        }

        // Update user credits in localStorage
        const stored = localStorage.getItem("specto-user");
        if (stored) {
            const user = JSON.parse(stored);
            const totalNewCredits = pendingPhotos.reduce((sum, p) => {
                const photo = photos.find((ph) => ph.id === p.id);
                return sum + (photo?.credits || 5);
            }, 0);
            user.credits = (user.credits || 0) + totalNewCredits;
            localStorage.setItem("specto-user", JSON.stringify(user));
        }
    };

    const selected = photos.find((p) => p.id === selectedPhoto);
    const pendingCount = photos.filter((p) => p.status === "pending").length;
    const successCount = photos.filter((p) => p.status === "success").length;

    return (
        <div className="min-h-screen bg-background">
            <PublicHeader />

            <main className="container mx-auto px-4 lg:px-8 pt-24 pb-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Upload Wildlife Photos</h1>
                    <p className="text-muted-foreground">
                        Share your wildlife sightings and earn credits for conservation!
                    </p>
                </div>

                {/* Credit Info Banner */}
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30">
                    <div className="flex items-start gap-3">
                        <Star className="h-5 w-5 text-amber-500 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-amber-500">Earn Credits!</h3>
                            <p className="text-sm text-muted-foreground">
                                <strong>5 credits</strong> per photo uploaded • <strong>+5 bonus</strong> if you identify the species
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Upload Zone & Photo List */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Upload Zone */}
                        <Card className="glass-card">
                            <CardContent className="p-4">
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${isDragging
                                            ? "border-green-500 bg-green-500/10"
                                            : "border-border/50 hover:border-green-500/50 hover:bg-muted/30"
                                        }`}
                                >
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileInput}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <Camera className={`h-10 w-10 mx-auto mb-3 ${isDragging ? "text-green-500" : "text-muted-foreground"}`} />
                                    <p className="font-medium">Drop photos here</p>
                                    <p className="text-sm text-muted-foreground">or click to browse</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Photo List */}
                        {photos.length > 0 && (
                            <Card className="glass-card">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Your Photos ({photos.length})</CardTitle>
                                </CardHeader>
                                <CardContent className="p-2">
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                        {photos.map((photo) => (
                                            <div
                                                key={photo.id}
                                                onClick={() => setSelectedPhoto(photo.id)}
                                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedPhoto === photo.id
                                                        ? "bg-green-500/20 ring-1 ring-green-500/30"
                                                        : "hover:bg-muted/50"
                                                    }`}
                                            >
                                                <img
                                                    src={photo.preview}
                                                    alt=""
                                                    className="w-12 h-12 object-cover rounded-lg"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{photo.file.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {photo.species || "Species not identified"}
                                                    </p>
                                                </div>
                                                {photo.status === "success" && (
                                                    <Badge className="bg-green-500/20 text-green-500 text-xs">
                                                        +{photo.credits}
                                                    </Badge>
                                                )}
                                                {photo.status === "uploading" && (
                                                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Photo Details */}
                    <Card className="glass-card lg:col-span-2">
                        {selected ? (
                            <>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Photo Details</CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() => deletePhoto(selected.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Preview */}
                                    <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                                        <img
                                            src={selected.preview}
                                            alt=""
                                            className="w-full h-full object-contain"
                                        />
                                    </div>

                                    {selected.status === "success" ? (
                                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
                                            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                            <h3 className="font-semibold text-green-500">Upload Successful!</h3>
                                            <p className="text-sm text-muted-foreground">
                                                You earned <strong className="text-amber-500">+{selected.credits} credits</strong>
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                    <Bird className="h-4 w-4" />
                                                    Species (Optional)
                                                </Label>
                                                <Select
                                                    value={selected.species || ""}
                                                    onValueChange={(v) => updatePhoto(selected.id, { species: v })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select species" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="brown-pelican">Brown Pelican</SelectItem>
                                                        <SelectItem value="great-egret">Great Egret</SelectItem>
                                                        <SelectItem value="roseate-spoonbill">Roseate Spoonbill</SelectItem>
                                                        <SelectItem value="royal-tern">Royal Tern</SelectItem>
                                                        <SelectItem value="laughing-gull">Laughing Gull</SelectItem>
                                                        <SelectItem value="black-skimmer">Black Skimmer</SelectItem>
                                                        <SelectItem value="great-blue-heron">Great Blue Heron</SelectItem>
                                                        <SelectItem value="unknown">Unknown / Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Info className="h-3 w-3" />
                                                    +5 bonus credits if species identified!
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    Location (Optional)
                                                </Label>
                                                <Input
                                                    placeholder="e.g., Rabbit Island"
                                                    value={selected.location || ""}
                                                    onChange={(e) => updatePhoto(selected.id, { location: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-2 sm:col-span-2">
                                                <Label>Notes (Optional)</Label>
                                                <Textarea
                                                    placeholder="Any additional observations..."
                                                    value={selected.notes || ""}
                                                    onChange={(e) => updatePhoto(selected.id, { notes: e.target.value })}
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </>
                        ) : (
                            <CardContent className="flex flex-col items-center justify-center h-[500px] text-center">
                                <Camera className="h-16 w-16 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Photos Selected</h3>
                                <p className="text-muted-foreground max-w-sm">
                                    Upload wildlife photos to get started. You'll earn credits for each contribution!
                                </p>
                            </CardContent>
                        )}
                    </Card>
                </div>

                {/* Submit Section */}
                {photos.length > 0 && (
                    <Card className="glass-card mt-6">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">Ready to submit?</p>
                                    <p className="text-sm text-muted-foreground">
                                        {pendingCount} photo{pendingCount !== 1 ? "s" : ""} pending •{" "}
                                        {successCount} uploaded
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Estimated credits</p>
                                        <p className="text-xl font-bold text-amber-500">
                                            +{photos.filter((p) => p.status === "pending").reduce((sum, p) => sum + 5 + (p.species ? 5 : 0), 0)}
                                        </p>
                                    </div>
                                    <Button
                                        size="lg"
                                        onClick={submitPhotos}
                                        disabled={pendingCount === 0}
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Submit {pendingCount} Photo{pendingCount !== 1 ? "s" : ""}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
