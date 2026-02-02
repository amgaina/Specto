import { useState, useCallback } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Camera,
    Trash2,
    Eye,
    Grid,
    List,
    Bird,
    MapPin,
    Hash,
    Home,
    Edit,
    Save,
    CheckCircle2,
} from "lucide-react";

interface ImageFile {
    id: string;
    name: string;
    size: string;
    uploadedAt: Date;
    preview: string;
    species?: string;
    location?: string;
    birdCount?: number;
    nestCount?: number;
    colonyName?: string;
    notes?: string;
    isLabeled: boolean;
}

const SPECIES_OPTIONS = [
    "Brown Pelican",
    "Great Egret",
    "Roseate Spoonbill",
    "Royal Tern",
    "Laughing Gull",
    "Black Skimmer",
    "Great Blue Heron",
    "Snowy Egret",
    "Tricolored Heron",
    "White Ibis",
];

const COLONY_OPTIONS = [
    "Rabbit Island",
    "Queen Bess Island",
    "Mangrove Cay",
    "Wine Island",
    "Felicity Island",
    "Raccoon Island",
    "Grand Terre",
    "Last Island",
];

export default function AdminImages() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [isDragging, setIsDragging] = useState(false);
    const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
    const [labelDialogOpen, setLabelDialogOpen] = useState(false);
    const [images, setImages] = useState<ImageFile[]>([
        {
            id: "1",
            name: "aerial_colony_001.jpg",
            size: "8.2 MB",
            uploadedAt: new Date(Date.now() - 3600000),
            preview: "/image_1.png",
            species: "Brown Pelican",
            location: "Rabbit Island",
            birdCount: 245,
            nestCount: 89,
            colonyName: "Rabbit Island Colony A",
            isLabeled: true,
        },
        {
            id: "2",
            name: "marsh_survey_012.jpg",
            size: "6.8 MB",
            uploadedAt: new Date(Date.now() - 7200000),
            preview: "/image_2.png",
            species: "Great Egret",
            location: "Queen Bess Island",
            birdCount: 128,
            nestCount: 45,
            colonyName: "Queen Bess Colony",
            isLabeled: true,
        },
        {
            id: "3",
            name: "nesting_site_045.jpg",
            size: "7.4 MB",
            uploadedAt: new Date(Date.now() - 10800000),
            preview: "/image_3.png",
            isLabeled: false,
        },
        {
            id: "4",
            name: "colony_overview_088.jpg",
            size: "9.1 MB",
            uploadedAt: new Date(Date.now() - 14400000),
            preview: "/image_4.png",
            species: "Royal Tern",
            location: "Wine Island",
            birdCount: 312,
            nestCount: 156,
            colonyName: "Wine Island Tern Colony",
            isLabeled: true,
        },
    ]);

    // Form state for labeling
    const [labelForm, setLabelForm] = useState({
        species: "",
        location: "",
        birdCount: "",
        nestCount: "",
        colonyName: "",
        notes: "",
    });

    const handleFiles = useCallback((files: File[]) => {
        const formatSize = (bytes: number): string => {
            if (bytes < 1024) return bytes + " B";
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
            return (bytes / (1024 * 1024)).toFixed(1) + " MB";
        };

        const newImages: ImageFile[] = files
            .filter((file) => file.type.startsWith("image/"))
            .map((file) => ({
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                size: formatSize(file.size),
                uploadedAt: new Date(),
                preview: URL.createObjectURL(file),
                isLabeled: false,
            }));

        setImages((prev) => [...newImages, ...prev]);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const files = Array.from(e.dataTransfer.files);
            handleFiles(files);
        },
        [handleFiles]
    );

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const deleteImage = (id: string) => {
        setImages((prev) => prev.filter((img) => img.id !== id));
    };

    const openLabelDialog = (image: ImageFile) => {
        setSelectedImage(image);
        setLabelForm({
            species: image.species || "",
            location: image.location || "",
            birdCount: image.birdCount?.toString() || "",
            nestCount: image.nestCount?.toString() || "",
            colonyName: image.colonyName || "",
            notes: image.notes || "",
        });
        setLabelDialogOpen(true);
    };

    const saveLabels = () => {
        if (!selectedImage) return;

        setImages((prev) =>
            prev.map((img) =>
                img.id === selectedImage.id
                    ? {
                        ...img,
                        species: labelForm.species || undefined,
                        location: labelForm.location || undefined,
                        birdCount: labelForm.birdCount ? parseInt(labelForm.birdCount) : undefined,
                        nestCount: labelForm.nestCount ? parseInt(labelForm.nestCount) : undefined,
                        colonyName: labelForm.colonyName || undefined,
                        notes: labelForm.notes || undefined,
                        isLabeled: !!(labelForm.species || labelForm.birdCount || labelForm.colonyName),
                    }
                    : img
            )
        );
        setLabelDialogOpen(false);
        setSelectedImage(null);
    };

    const labeledCount = images.filter((img) => img.isLabeled).length;
    const unlabeledCount = images.length - labeledCount;

    return (
        <div className="min-h-screen bg-background">
            <AdminHeader />

            <main className="container mx-auto px-4 lg:px-8 pt-24 pb-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Image Gallery & Labeling</h1>
                        <p className="text-muted-foreground">
                            Upload and label aerial survey images with species, counts, and colony data
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-3">
                            <Badge variant="secondary" className="gap-1.5 py-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                {labeledCount} Labeled
                            </Badge>
                            <Badge variant="outline" className="gap-1.5 py-1.5">
                                <Edit className="h-3.5 w-3.5 text-amber-500" />
                                {unlabeledCount} Need Labels
                            </Badge>
                        </div>
                        {/* View Toggle */}
                        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                            <Button
                                variant={viewMode === "grid" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("grid")}
                            >
                                <Grid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("list")}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Upload Zone */}
                <Card className="glass-card mb-8">
                    <CardContent className="p-6">
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${isDragging
                                ? "border-primary bg-primary/10"
                                : "border-border/50 hover:border-border hover:bg-muted/30"
                                }`}
                        >
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileInput}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />

                            <div className="flex flex-col items-center gap-3">
                                <Camera
                                    className={`h-10 w-10 ${isDragging ? "text-primary" : "text-muted-foreground"}`}
                                />
                                <div>
                                    <p className="font-medium">
                                        {isDragging ? "Drop images here" : "Upload Survey Images"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Drag & drop or click to browse (JPG, PNG, TIFF)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Image Gallery */}
                {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((image) => (
                            <Card
                                key={image.id}
                                className={`overflow-hidden group cursor-pointer transition-all hover:shadow-lg ${!image.isLabeled ? "ring-2 ring-amber-500/50" : ""
                                    }`}
                                onClick={() => openLabelDialog(image)}
                            >
                                <div className="aspect-square relative overflow-hidden">
                                    <img
                                        src={image.preview}
                                        alt={image.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {/* Status Badge */}
                                    <div className="absolute top-2 left-2">
                                        {image.isLabeled ? (
                                            <Badge className="bg-green-500/90 text-white gap-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Labeled
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-amber-500/90 text-white gap-1">
                                                <Edit className="h-3 w-3" />
                                                Needs Label
                                            </Badge>
                                        )}
                                    </div>
                                    {/* Hover Actions */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                                        <Button size="sm" className="gap-2">
                                            <Edit className="h-4 w-4" />
                                            Edit Labels
                                        </Button>
                                        <div className="flex gap-2">
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="h-8 w-8"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                }}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="destructive"
                                                className="h-8 w-8"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteImage(image.id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                {/* Info */}
                                <CardContent className="p-3">
                                    <p className="text-sm font-medium truncate mb-1">{image.name}</p>
                                    {image.isLabeled ? (
                                        <div className="space-y-1 text-xs text-muted-foreground">
                                            {image.species && (
                                                <div className="flex items-center gap-1">
                                                    <Bird className="h-3 w-3" />
                                                    {image.species}
                                                </div>
                                            )}
                                            {image.birdCount !== undefined && (
                                                <div className="flex items-center gap-1">
                                                    <Hash className="h-3 w-3" />
                                                    {image.birdCount} birds, {image.nestCount || 0} nests
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-amber-500">Click to add labels</p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="glass-card">
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/50">
                                {images.map((image) => (
                                    <div
                                        key={image.id}
                                        className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                                        onClick={() => openLabelDialog(image)}
                                    >
                                        <div className="relative">
                                            <img
                                                src={image.preview}
                                                alt={image.name}
                                                className="w-20 h-20 object-cover rounded-lg"
                                            />
                                            {!image.isLabeled && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-background" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{image.name}</p>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                                {image.species && (
                                                    <span className="flex items-center gap-1">
                                                        <Bird className="h-3.5 w-3.5" />
                                                        {image.species}
                                                    </span>
                                                )}
                                                {image.colonyName && (
                                                    <span className="flex items-center gap-1">
                                                        <Home className="h-3.5 w-3.5" />
                                                        {image.colonyName}
                                                    </span>
                                                )}
                                                {image.birdCount !== undefined && (
                                                    <span className="flex items-center gap-1">
                                                        <Hash className="h-3.5 w-3.5" />
                                                        {image.birdCount} birds
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {image.isLabeled ? (
                                            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                                                Labeled
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                                                Needs Label
                                            </Badge>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openLabelDialog(image);
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteImage(image.id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {images.length === 0 && (
                    <div className="text-center py-16">
                        <Camera className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No images yet</h3>
                        <p className="text-muted-foreground">Upload survey images to get started</p>
                    </div>
                )}
            </main>

            {/* Label Dialog */}
            <Dialog open={labelDialogOpen} onOpenChange={setLabelDialogOpen}>
                <DialogContent className="max-w-2xl">
                    {selectedImage && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Edit className="h-5 w-5" />
                                    Label Image
                                </DialogTitle>
                                <DialogDescription>
                                    Add species, counts, and colony information for this image
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid md:grid-cols-2 gap-6 py-4">
                                {/* Image Preview */}
                                <div>
                                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted mb-3">
                                        <img
                                            src={selectedImage.preview}
                                            alt={selectedImage.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <p className="text-sm font-medium truncate">{selectedImage.name}</p>
                                    <p className="text-xs text-muted-foreground">{selectedImage.size}</p>
                                </div>

                                {/* Label Form */}
                                <div className="space-y-4">
                                    {/* Species */}
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Bird className="h-4 w-4" />
                                            Species
                                        </Label>
                                        <Select
                                            value={labelForm.species}
                                            onValueChange={(v) => setLabelForm({ ...labelForm, species: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select species" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SPECIES_OPTIONS.map((species) => (
                                                    <SelectItem key={species} value={species}>
                                                        {species}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Colony Name */}
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Home className="h-4 w-4" />
                                            Colony Name
                                        </Label>
                                        <Select
                                            value={labelForm.colonyName}
                                            onValueChange={(v) => setLabelForm({ ...labelForm, colonyName: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select colony" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {COLONY_OPTIONS.map((colony) => (
                                                    <SelectItem key={colony} value={colony}>
                                                        {colony}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Bird & Nest Counts */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Hash className="h-4 w-4" />
                                                Bird Count
                                            </Label>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                value={labelForm.birdCount}
                                                onChange={(e) =>
                                                    setLabelForm({ ...labelForm, birdCount: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Home className="h-4 w-4" />
                                                Nest Count
                                            </Label>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                value={labelForm.nestCount}
                                                onChange={(e) =>
                                                    setLabelForm({ ...labelForm, nestCount: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            Location / GPS
                                        </Label>
                                        <Input
                                            placeholder="e.g., 29.2108° N, 89.2620° W"
                                            value={labelForm.location}
                                            onChange={(e) =>
                                                setLabelForm({ ...labelForm, location: e.target.value })
                                            }
                                        />
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-2">
                                        <Label>Notes (Optional)</Label>
                                        <Textarea
                                            placeholder="Additional observations..."
                                            value={labelForm.notes}
                                            onChange={(e) => setLabelForm({ ...labelForm, notes: e.target.value })}
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setLabelDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={saveLabels} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    Save Labels
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
