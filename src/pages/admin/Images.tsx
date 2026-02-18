import { useState } from "react";
import { usePipeline, type LabeledImage } from "@/context/PipelineContext";
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
    Bot,
} from "lucide-react";

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

export default function AdminImages({ embedded = false }: { embedded?: boolean }) {
    const { galleryImages, updateLabels } = usePipeline();
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
    const [labelDialogOpen, setLabelDialogOpen] = useState(false);

    // Form state for labeling
    const [labelForm, setLabelForm] = useState({
        species: "",
        location: "",
        birdCount: "",
        nestCount: "",
        colonyName: "",
        notes: "",
    });

    const selectedImage = galleryImages.find((i) => i.id === selectedImageId) || null;

    const isLabeled = (img: LabeledImage) =>
        !!(img.species || img.colonyName || img.aiBirdCount);

    const openLabelDialog = (image: LabeledImage) => {
        setSelectedImageId(image.id);
        // Pre-fill with existing labels; use AI counts as defaults if human counts aren't set
        const aiBirds = image.aiBirdCount ? image.aiBirdCount.split(" ")[0] : "";
        const aiNests = image.aiNestCount ? image.aiNestCount.split(" ")[0] : "";
        setLabelForm({
            species: image.species || "",
            location: image.location || "",
            birdCount: aiBirds,
            nestCount: aiNests,
            colonyName: image.colonyName || "",
            notes: image.notes || "",
        });
        setLabelDialogOpen(true);
    };

    const saveLabelsHandler = () => {
        if (!selectedImage) return;
        updateLabels(selectedImage.id, {
            species: labelForm.species || undefined,
            location: labelForm.location || undefined,
            colonyName: labelForm.colonyName || undefined,
            notes: labelForm.notes || undefined,
        });
        setLabelDialogOpen(false);
        setSelectedImageId(null);
    };

    const labeledCount = galleryImages.filter(isLabeled).length;
    const unlabeledCount = galleryImages.length - labeledCount;

    const content = (
        <div>
                {!embedded && (
                    <div className="mb-4">
                        <h1 className="text-xl font-bold mb-1">Image Gallery</h1>
                        <p className="text-sm text-muted-foreground">Label aerial survey images with species and colony data</p>
                    </div>
                )}

                {/* Compact toolbar */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />{labeledCount} labeled</span>
                        <span className="text-border">|</span>
                        <span className="flex items-center gap-1"><Edit className="h-3 w-3 text-amber-500" />{unlabeledCount} unlabeled</span>
                        <span className="text-border">|</span>
                        <span>{galleryImages.length} total approved</span>
                    </div>
                    <div className="flex items-center gap-0.5 p-0.5 bg-muted rounded">
                        <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" className="h-6 w-6 p-0" onClick={() => setViewMode("grid")}>
                            <Grid className="h-3 w-3" />
                        </Button>
                        <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" className="h-6 w-6 p-0" onClick={() => setViewMode("list")}>
                            <List className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {/* Image Gallery */}
                {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {galleryImages.map((image) => {
                            const labeled = isLabeled(image);
                            return (
                            <Card
                                key={image.id}
                                className={`overflow-hidden group cursor-pointer transition-all hover:shadow-lg ${!labeled ? "ring-2 ring-amber-500/50" : ""
                                    }`}
                                onClick={() => openLabelDialog(image)}
                            >
                                <div className="aspect-square relative overflow-hidden">
                                    <img
                                        src={image.imageUrl}
                                        alt={image.fileName}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {/* Status Badges */}
                                    <div className="absolute top-2 left-2 flex items-center gap-1">
                                        {labeled ? (
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
                                        {image.aiStatus === "done" && (
                                            <Badge className="bg-blue-500/90 text-white gap-1">
                                                <Bot className="h-3 w-3" />
                                                AI
                                            </Badge>
                                        )}
                                    </div>
                                    {/* Hover Actions */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                                        <Button size="sm" className="gap-2">
                                            <Edit className="h-4 w-4" />
                                            Edit Labels
                                        </Button>
                                    </div>
                                </div>
                                {/* Info */}
                                <CardContent className="p-3">
                                    <p className="text-sm font-medium truncate mb-1">{image.fileName}</p>
                                    <div className="space-y-1 text-xs text-muted-foreground">
                                        {image.species && (
                                            <div className="flex items-center gap-1">
                                                <Bird className="h-3 w-3" />
                                                {image.species}
                                            </div>
                                        )}
                                        {image.aiBirdCount && (
                                            <div className="flex items-center gap-1">
                                                <Bot className="h-3 w-3 text-blue-400" />
                                                {image.aiBirdCount.split(" ")[0]} birds
                                            </div>
                                        )}
                                        {!image.species && !image.aiBirdCount && (
                                            <p className="text-amber-500">Click to add labels</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="glass-card">
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/50">
                                {galleryImages.map((image) => {
                                    const labeled = isLabeled(image);
                                    return (
                                    <div
                                        key={image.id}
                                        className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                                        onClick={() => openLabelDialog(image)}
                                    >
                                        <div className="relative">
                                            <img
                                                src={image.imageUrl}
                                                alt={image.fileName}
                                                className="w-20 h-20 object-cover rounded-lg"
                                            />
                                            {!labeled && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-background" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{image.fileName}</p>
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
                                                {image.aiBirdCount && (
                                                    <span className="flex items-center gap-1">
                                                        <Bot className="h-3.5 w-3.5 text-blue-400" />
                                                        {image.aiBirdCount.split(" ")[0]} birds
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {labeled ? (
                                                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                                                    Labeled
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                                                    Needs Label
                                                </Badge>
                                            )}
                                            {image.aiStatus === "done" && (
                                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1">
                                                    <Bot className="h-3 w-3" />
                                                    AI
                                                </Badge>
                                            )}
                                        </div>
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
                                    </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {galleryImages.length === 0 && (
                    <div className="text-center py-16">
                        <Camera className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No approved images yet</h3>
                        <p className="text-muted-foreground">Approve photos in the Review tab to see them here</p>
                    </div>
                )}

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
                                {/* Image Preview + AI info */}
                                <div className="space-y-3">
                                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                                        <img
                                            src={selectedImage.imageUrl}
                                            alt={selectedImage.fileName}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <p className="text-sm font-medium truncate">{selectedImage.fileName}</p>

                                    {/* AI heatmap if available */}
                                    {selectedImage.aiVisualization && (
                                        <div className="rounded-lg overflow-hidden border border-blue-500/20">
                                            <p className="text-xs text-muted-foreground px-2 py-1 bg-blue-500/10 flex items-center gap-1">
                                                <Bot className="h-3 w-3" />
                                                AI Density Heatmap
                                            </p>
                                            <img
                                                src={selectedImage.aiVisualization}
                                                alt="AI density heatmap"
                                                className="w-full object-contain"
                                            />
                                        </div>
                                    )}

                                    {/* AI counts summary */}
                                    {selectedImage.aiStatus === "done" && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-2 rounded-lg bg-blue-500/10 text-center">
                                                <p className="text-xs text-muted-foreground"><Bot className="h-3 w-3 inline mr-1" />Birds</p>
                                                <p className="font-bold text-blue-400">{selectedImage.aiBirdCount?.split(" ")[0] || "—"}</p>
                                            </div>
                                            <div className="p-2 rounded-lg bg-blue-500/10 text-center">
                                                <p className="text-xs text-muted-foreground"><Bot className="h-3 w-3 inline mr-1" />Nests</p>
                                                <p className="font-bold text-blue-400">{selectedImage.aiNestCount?.split(" ")[0] || "—"}</p>
                                            </div>
                                        </div>
                                    )}
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

                                    {/* AI-suggested counts (read-only display) */}
                                    {selectedImage.aiStatus === "done" && (
                                        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                                <Bot className="h-3 w-3 text-blue-400" />
                                                AI-suggested counts (from density model)
                                            </p>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Birds:</span>{" "}
                                                    <span className="font-medium">{selectedImage.aiBirdCount || "—"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Nests:</span>{" "}
                                                    <span className="font-medium">{selectedImage.aiNestCount || "—"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

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
                                <Button onClick={saveLabelsHandler} className="gap-2">
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

    if (embedded) return content;

    return (
        <div className="min-h-screen bg-background">
            <AdminHeader />
            <main className="container mx-auto px-4 lg:px-8 pt-12 pb-12">
                {content}
            </main>
        </div>
    );
}
