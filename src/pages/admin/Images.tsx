import { useState, useRef, useCallback, useEffect } from "react";
import { usePipeline, type LabeledImage } from "@/context/PipelineContext";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Camera,
    Bird,
    MapPin,
    Home,
    Edit,
    Save,
    CheckCircle2,
    Bot,
    Filter,
    ChevronLeft,
    ChevronRight,
    Eye,
    X,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Plus,
    Trash2,
    Crosshair,
    Maximize2,
    Minimize2,
    Info,
    Layers,
    Tag,
} from "lucide-react";
import { COLONIES, SPECIES } from "@/lib/mockDataGenerator";

const SPECIES_OPTIONS = SPECIES.map(s => s.name);
const COLONY_OPTIONS = COLONIES.map(c => c.name);

type FilterMode = "all" | "unlabeled" | "labeled";

interface Annotation {
    id: string;
    x: number; // 0-1 relative to image
    y: number;
    species: string;
    label?: string;
}

export default function AdminImages({ embedded = false }: { embedded?: boolean }) {
    const { galleryImages, updateLabels } = usePipeline();
    const [filter, setFilter] = useState<FilterMode>("all");
    const [editorOpen, setEditorOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Zoom/pan state
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
    const imageContainerRef = useRef<HTMLDivElement>(null);

    // Annotations
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [annotationMode, setAnnotationMode] = useState(false);
    const [activeAnnotationSpecies, setActiveAnnotationSpecies] = useState(SPECIES_OPTIONS[0]);

    // Label form
    const [speciesTags, setSpeciesTags] = useState<string[]>([]);
    const [primarySpecies, setPrimarySpecies] = useState("");
    const [colonyName, setColonyName] = useState("");
    const [location, setLocation] = useState("");
    const [notes, setNotes] = useState("");
    const [speciesInput, setSpeciesInput] = useState("");
    const [showSpeciesDropdown, setShowSpeciesDropdown] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);

    const isLabeled = (img: LabeledImage) => !!(img.species && img.colonyName);

    const filteredImages = galleryImages.filter(img => {
        if (filter === "unlabeled") return !isLabeled(img);
        if (filter === "labeled") return isLabeled(img);
        return true;
    });

    const labeledCount = galleryImages.filter(isLabeled).length;
    const unlabeledCount = galleryImages.length - labeledCount;

    const selectedImage = filteredImages[selectedIndex] || null;

    // Load form from selected image
    const loadForm = useCallback((img: LabeledImage | null) => {
        if (!img) return;
        setSpeciesTags(img.speciesTags || (img.species ? [img.species] : []));
        setPrimarySpecies(img.species || "");
        setColonyName(img.colonyName || "");
        setLocation(img.location || "");
        setNotes(img.notes || "");
        setAnnotations([]);
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setAnnotationMode(false);
    }, []);

    const openEditor = (index: number) => {
        setSelectedIndex(index);
        loadForm(filteredImages[index]);
        setEditorOpen(true);
    };

    const saveLabels = useCallback(() => {
        if (!selectedImage) return;
        const primary = primarySpecies || speciesTags[0] || undefined;
        updateLabels(selectedImage.id, {
            species: primary,
            speciesTags: speciesTags.length > 0 ? speciesTags : undefined,
            colonyName: colonyName || undefined,
            location: location || undefined,
            notes: notes || undefined,
        });
    }, [selectedImage, primarySpecies, speciesTags, colonyName, location, notes, updateLabels]);

    const navigate = useCallback((dir: 1 | -1) => {
        saveLabels();
        const next = selectedIndex + dir;
        if (next >= 0 && next < filteredImages.length) {
            setSelectedIndex(next);
            loadForm(filteredImages[next]);
        }
    }, [selectedIndex, filteredImages, saveLabels, loadForm]);

    const closeEditor = () => {
        saveLabels();
        setEditorOpen(false);
        setFullscreen(false);
    };

    // Zoom controls
    const handleZoomIn = () => setZoom(z => Math.min(z * 1.3, 8));
    const handleZoomOut = () => setZoom(z => Math.max(z / 1.3, 0.5));
    const handleResetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(z => Math.min(Math.max(z * delta, 0.5), 8));
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (annotationMode) return;
        if (zoom <= 1) return;
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    }, [annotationMode, zoom, pan]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isPanning) return;
        setPan({
            x: panStart.current.panX + (e.clientX - panStart.current.x),
            y: panStart.current.panY + (e.clientY - panStart.current.y),
        });
    }, [isPanning]);

    const handleMouseUp = useCallback(() => setIsPanning(false), []);

    // Annotation click
    const handleImageClick = useCallback((e: React.MouseEvent) => {
        if (!annotationMode || !imageContainerRef.current) return;
        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setAnnotations(prev => [...prev, {
            id: crypto.randomUUID(),
            x, y,
            species: activeAnnotationSpecies,
        }]);
    }, [annotationMode, activeAnnotationSpecies]);

    const removeAnnotation = (id: string) => {
        setAnnotations(prev => prev.filter(a => a.id !== id));
    };

    // Species tag management
    const addSpeciesTag = (species: string) => {
        if (!speciesTags.includes(species)) {
            const newTags = [...speciesTags, species];
            setSpeciesTags(newTags);
            if (!primarySpecies) setPrimarySpecies(species);
        }
        setSpeciesInput("");
        setShowSpeciesDropdown(false);
    };

    const removeSpeciesTag = (species: string) => {
        const newTags = speciesTags.filter(s => s !== species);
        setSpeciesTags(newTags);
        if (primarySpecies === species) setPrimarySpecies(newTags[0] || "");
    };

    const filteredSpeciesOptions = SPECIES_OPTIONS.filter(
        s => !speciesTags.includes(s) && s.toLowerCase().includes(speciesInput.toLowerCase())
    );

    // Keyboard shortcuts
    useEffect(() => {
        if (!editorOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); navigate(-1); }
            if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); navigate(1); }
            if (e.key === "Escape") closeEditor();
            if (e.key === "+" || e.key === "=") handleZoomIn();
            if (e.key === "-") handleZoomOut();
            if (e.key === "0") handleResetZoom();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [editorOpen, navigate]);

    // ==================== CARD GRID VIEW ====================
    const gridView = (
        <div>
            {!embedded && (
                <div className="mb-4">
                    <h1 className="text-xl font-bold mb-1">Image Labeling</h1>
                    <p className="text-sm text-muted-foreground">Add species and colony labels to approved images</p>
                </div>
            )}

            {/* Stats + filter bar */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />{labeledCount} labeled</span>
                    <span className="text-border">|</span>
                    <span className="flex items-center gap-1"><Edit className="h-3 w-3 text-amber-500" />{unlabeledCount} need labels</span>
                    <span className="text-border">|</span>
                    <span>{galleryImages.length} total</span>
                </div>
                <div className="flex items-center gap-1">
                    <Filter className="h-3 w-3 text-muted-foreground" />
                    {(["all", "unlabeled", "labeled"] as FilterMode[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-2 py-0.5 rounded text-xs transition-all ${filter === f ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            {f === "all" ? "All" : f === "unlabeled" ? "Needs Label" : "Done"}
                        </button>
                    ))}
                </div>
            </div>

            {filteredImages.length === 0 ? (
                <div className="text-center py-12">
                    <Camera className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                        {filter === "unlabeled" ? "All images are labeled!" : filter === "labeled" ? "No labeled images yet" : "No approved images yet"}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                        {filter !== "all"
                            ? <button onClick={() => setFilter("all")} className="text-primary hover:underline">Show all images</button>
                            : "Approve photos in the Review tab first"
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredImages.map((image, idx) => {
                        const labeled = isLabeled(image);
                        return (
                            <div
                                key={image.id}
                                onClick={() => openEditor(idx)}
                                className={`group relative rounded-lg border overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${
                                    labeled ? "border-green-500/30" : "border-amber-500/30 bg-amber-500/5"
                                }`}
                            >
                                <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                                    <img src={image.imageUrl} alt={image.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    <div className="absolute top-1.5 right-1.5">
                                        {labeled ? (
                                            <Badge className="bg-green-500/90 text-white border-0 gap-0.5 text-[10px] px-1.5 py-0">
                                                <CheckCircle2 className="h-2.5 w-2.5" />Done
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-amber-500/90 text-white border-0 gap-0.5 text-[10px] px-1.5 py-0">
                                                <Edit className="h-2.5 w-2.5" />Label
                                            </Badge>
                                        )}
                                    </div>
                                    {image.aiStatus === "done" && (
                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-4">
                                            <div className="flex items-center gap-2 text-[10px] text-white/90">
                                                <span className="flex items-center gap-0.5"><Bot className="h-2.5 w-2.5 text-blue-300" />{image.aiBirdCount?.split(" ")[0] || "—"} birds</span>
                                                <span className="flex items-center gap-0.5">{image.aiNestCount?.split(" ")[0] || "—"} nests</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
                                    </div>
                                </div>
                                <div className="p-2 space-y-1">
                                    <p className="text-xs font-medium truncate">{image.fileName}</p>
                                    <div className="flex flex-wrap gap-1">
                                        {image.speciesTags && image.speciesTags.length > 0 ? (
                                            <>
                                                <Badge variant="secondary" className="gap-0.5 text-[10px] px-1.5 py-0">
                                                    <Bird className="h-2.5 w-2.5 text-primary" />
                                                    {image.speciesTags[0]}
                                                </Badge>
                                                {image.speciesTags.length > 1 && (
                                                    <Badge variant="outline" className="text-[10px] px-1 py-0 text-muted-foreground">
                                                        +{image.speciesTags.length - 1}
                                                    </Badge>
                                                )}
                                            </>
                                        ) : image.species ? (
                                            <Badge variant="secondary" className="gap-0.5 text-[10px] px-1.5 py-0">
                                                <Bird className="h-2.5 w-2.5 text-primary" />{image.species}
                                            </Badge>
                                        ) : (
                                            <span className="text-[10px] text-amber-500 italic">Unidentified</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        {image.colonyName ? (
                                            <><Home className="h-2.5 w-2.5 text-green-500 shrink-0" /><span className="truncate">{image.colonyName}</span></>
                                        ) : image.location ? (
                                            <><MapPin className="h-2.5 w-2.5 shrink-0" /><span className="truncate">{image.location}</span></>
                                        ) : (
                                            <span className="text-muted-foreground/40">No location</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    // ==================== FULL-SCREEN LABEL EDITOR ====================
    const editorView = selectedImage && (
        <div className={`fixed inset-0 z-50 bg-background flex flex-col ${fullscreen ? "" : ""}`}>
            {/* Top toolbar */}
            <div className="h-11 border-b bg-card flex items-center justify-between px-3 shrink-0">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" onClick={closeEditor}>
                        <X className="h-3.5 w-3.5" />Close
                    </Button>
                    <span className="text-xs text-muted-foreground">|</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={selectedIndex <= 0} onClick={() => navigate(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-medium">{selectedIndex + 1} / {filteredImages.length}</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={selectedIndex >= filteredImages.length - 1} onClick={() => navigate(1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground ml-2 max-w-[200px] truncate">{selectedImage.fileName}</span>
                </div>

                <div className="flex items-center gap-1">
                    {/* Zoom controls */}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleZoomOut}><ZoomOut className="h-3.5 w-3.5" /></Button>
                    <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleZoomIn}><ZoomIn className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleResetZoom}><RotateCcw className="h-3.5 w-3.5" /></Button>
                    <span className="text-xs text-muted-foreground mx-1">|</span>
                    {/* Annotation toggle */}
                    <Button
                        variant={annotationMode ? "default" : "ghost"}
                        size="sm"
                        className="h-7 px-2 gap-1 text-xs"
                        onClick={() => setAnnotationMode(!annotationMode)}
                    >
                        <Crosshair className="h-3.5 w-3.5" />
                        {annotationMode ? "Placing..." : "Annotate"}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setFullscreen(!fullscreen)}>
                        {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    </Button>
                    <span className="text-xs text-muted-foreground mx-1">|</span>
                    <Button size="sm" className="h-7 px-3 gap-1" onClick={() => { saveLabels(); closeEditor(); }}>
                        <Save className="h-3.5 w-3.5" />Save
                    </Button>
                </div>
            </div>

            {/* Main content: image + sidebar */}
            <div className="flex-1 flex overflow-hidden">
                {/* Image viewport */}
                <div
                    className="flex-1 relative overflow-hidden bg-neutral-950 select-none"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ cursor: annotationMode ? "crosshair" : zoom > 1 ? (isPanning ? "grabbing" : "grab") : "default" }}
                >
                    <div
                        ref={imageContainerRef}
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: "center center",
                            transition: isPanning ? "none" : "transform 0.15s ease-out",
                        }}
                        onClick={handleImageClick}
                    >
                        <img
                            src={selectedImage.imageUrl}
                            alt={selectedImage.fileName}
                            className="max-w-full max-h-full object-contain"
                            draggable={false}
                        />
                        {/* Annotation markers */}
                        {annotations.map((a) => (
                            <div
                                key={a.id}
                                className="absolute"
                                style={{
                                    left: `${a.x * 100}%`,
                                    top: `${a.y * 100}%`,
                                    transform: `translate(-50%, -50%) scale(${1 / zoom})`,
                                }}
                            >
                                <div className="relative group/marker">
                                    <div className="w-5 h-5 rounded-full bg-red-500/80 border-2 border-white shadow-lg flex items-center justify-center">
                                        <Bird className="h-3 w-3 text-white" />
                                    </div>
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/marker:opacity-100 transition-opacity">
                                        {a.species}
                                    </div>
                                    <button
                                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-600 text-white opacity-0 group-hover/marker:opacity-100 transition-opacity flex items-center justify-center"
                                        onClick={(e) => { e.stopPropagation(); removeAnnotation(a.id); }}
                                    >
                                        <X className="h-2 w-2" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Heatmap overlay toggle */}
                    {selectedImage.aiVisualization && (
                        <div className="absolute bottom-3 left-3">
                            <HeatmapToggle src={selectedImage.aiVisualization} />
                        </div>
                    )}

                    {/* Zoom indicator */}
                    {zoom !== 1 && (
                        <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                            {Math.round(zoom * 100)}%
                        </div>
                    )}

                    {/* Annotation mode banner */}
                    {annotationMode && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                            <Crosshair className="h-3 w-3" />
                            Click image to place {activeAnnotationSpecies} marker
                            <select
                                value={activeAnnotationSpecies}
                                onChange={e => setActiveAnnotationSpecies(e.target.value)}
                                className="bg-primary-foreground/20 text-primary-foreground text-xs rounded px-1 py-0.5 border-0"
                            >
                                {SPECIES_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {/* Right sidebar */}
                <div className={`${fullscreen ? "w-72" : "w-80"} border-l bg-card overflow-y-auto shrink-0`}>
                    <div className="p-3 space-y-3">
                        {/* Status badge */}
                        <div className="flex items-center justify-between">
                            {isLabeled(selectedImage) ? (
                                <Badge className="bg-green-500/10 text-green-500 border-green-500/30 gap-1">
                                    <CheckCircle2 className="h-3 w-3" />Labeled
                                </Badge>
                            ) : (
                                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 gap-1">
                                    <Edit className="h-3 w-3" />Needs Labels
                                </Badge>
                            )}
                            {selectedImage.aiStatus === "done" && (
                                <Badge variant="outline" className="gap-1 text-[10px]">
                                    <Bot className="h-2.5 w-2.5 text-blue-400" />AI Analyzed
                                </Badge>
                            )}
                        </div>

                        {/* AI Counts */}
                        {selectedImage.aiStatus === "done" && (
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-center">
                                    <p className="text-[10px] text-muted-foreground">Birds (AI)</p>
                                    <p className="font-bold text-lg text-blue-400">{selectedImage.aiBirdCount?.split(" ")[0] || "—"}</p>
                                    {selectedImage.aiBirdCount?.includes("+/-") && (
                                        <p className="text-[9px] text-muted-foreground/70">{selectedImage.aiBirdCount}</p>
                                    )}
                                </div>
                                <div className="p-2 rounded-lg bg-blue-500/10 text-center">
                                    <p className="text-[10px] text-muted-foreground">Nests (AI)</p>
                                    <p className="font-bold text-lg text-blue-400">{selectedImage.aiNestCount?.split(" ")[0] || "—"}</p>
                                    {selectedImage.aiNestCount?.includes("+/-") && (
                                        <p className="text-[9px] text-muted-foreground/70">{selectedImage.aiNestCount}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Species Tags */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-medium">
                                <Tag className="h-3.5 w-3.5" />Species Tags
                                <span className="text-muted-foreground font-normal">({speciesTags.length})</span>
                            </label>
                            <div className="flex flex-wrap gap-1 min-h-[28px] p-1.5 rounded-md border bg-background">
                                {speciesTags.map(s => (
                                    <Badge key={s} variant={s === primarySpecies ? "default" : "secondary"} className="gap-0.5 text-[11px] px-1.5 py-0.5 cursor-pointer" onClick={() => setPrimarySpecies(s)}>
                                        <Bird className="h-2.5 w-2.5" />
                                        {s}
                                        {s === primarySpecies && <span className="text-[9px] opacity-70 ml-0.5">primary</span>}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeSpeciesTag(s); }}
                                            className="ml-0.5 hover:text-destructive"
                                        >
                                            <X className="h-2.5 w-2.5" />
                                        </button>
                                    </Badge>
                                ))}
                                {speciesTags.length === 0 && (
                                    <span className="text-[10px] text-muted-foreground/50 italic">No species tagged</span>
                                )}
                            </div>
                            {/* Add species input */}
                            <div className="relative">
                                <div className="flex gap-1">
                                    <Input
                                        placeholder="Add species..."
                                        value={speciesInput}
                                        onChange={e => { setSpeciesInput(e.target.value); setShowSpeciesDropdown(true); }}
                                        onFocus={() => setShowSpeciesDropdown(true)}
                                        className="h-7 text-xs"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0 shrink-0"
                                        onClick={() => setShowSpeciesDropdown(!showSpeciesDropdown)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                                {showSpeciesDropdown && filteredSpeciesOptions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-10 max-h-32 overflow-y-auto">
                                        {filteredSpeciesOptions.map(s => (
                                            <button
                                                key={s}
                                                className="w-full text-left px-2 py-1 text-xs hover:bg-accent transition-colors"
                                                onClick={() => addSpeciesTag(s)}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Colony */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-medium">
                                <Home className="h-3.5 w-3.5" />Colony Site
                            </label>
                            <select
                                value={colonyName}
                                onChange={e => setColonyName(e.target.value)}
                                className="w-full h-7 text-xs rounded-md border bg-background px-2"
                            >
                                <option value="">Select colony...</option>
                                {COLONY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Location */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-medium">
                                <MapPin className="h-3.5 w-3.5" />GPS / Location
                            </label>
                            <Input
                                placeholder="29.2108 N, 89.2620 W"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                className="h-7 text-xs"
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Notes</label>
                            <Textarea
                                placeholder="Observations..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={2}
                                className="text-xs resize-none"
                            />
                        </div>

                        {/* Annotations summary */}
                        {annotations.length > 0 && (
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-medium">
                                    <Layers className="h-3.5 w-3.5" />Point Annotations
                                    <span className="text-muted-foreground font-normal">({annotations.length})</span>
                                </label>
                                <div className="space-y-0.5 max-h-24 overflow-y-auto">
                                    {annotations.map((a, i) => (
                                        <div key={a.id} className="flex items-center justify-between text-[11px] px-1.5 py-0.5 rounded bg-muted/50">
                                            <span className="flex items-center gap-1">
                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                                #{i + 1} {a.species}
                                            </span>
                                            <button onClick={() => removeAnnotation(a.id)} className="text-muted-foreground hover:text-destructive">
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Metadata panel */}
                        <div className="space-y-1 pt-2 border-t">
                            <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><Info className="h-3 w-3" />Metadata</p>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                                {selectedImage.surveyYear && (
                                    <><span className="text-muted-foreground">Year:</span><span>{selectedImage.surveyYear}</span></>
                                )}
                                {selectedImage.geoRegion && (
                                    <><span className="text-muted-foreground">Region:</span><span>{selectedImage.geoRegion}</span></>
                                )}
                                {selectedImage.habitat && (
                                    <><span className="text-muted-foreground">Habitat:</span><span>{selectedImage.habitat}</span></>
                                )}
                                {selectedImage.surveyDate && (
                                    <><span className="text-muted-foreground">Survey:</span><span>{selectedImage.surveyDate}</span></>
                                )}
                                {selectedImage.aiModelInfo && (
                                    <><span className="text-muted-foreground">Model:</span><span className="text-blue-400">{selectedImage.aiModelInfo}</span></>
                                )}
                                {selectedImage.source && (
                                    <><span className="text-muted-foreground">Source:</span><span className="capitalize">{selectedImage.source}</span></>
                                )}
                                {selectedImage.submittedBy && (
                                    <><span className="text-muted-foreground">By:</span><span>{selectedImage.submittedBy.name}</span></>
                                )}
                            </div>
                        </div>

                        {/* Keyboard shortcuts hint */}
                        <div className="pt-2 border-t text-[10px] text-muted-foreground/60 space-y-0.5">
                            <p><kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">←</kbd> <kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">→</kbd> Navigate</p>
                            <p><kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">+</kbd> <kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">-</kbd> Zoom &nbsp; <kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">0</kbd> Reset</p>
                            <p><kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">Esc</kbd> Close editor</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const content = (
        <>
            {gridView}
            {editorOpen && editorView}
        </>
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

// Heatmap overlay toggle component
function HeatmapToggle({ src }: { src: string }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <Button
                variant={show ? "default" : "secondary"}
                size="sm"
                className="h-7 px-2 gap-1 text-xs shadow-lg"
                onClick={() => setShow(!show)}
            >
                <Layers className="h-3 w-3" />
                {show ? "Hide" : "Show"} Heatmap
            </Button>
            {show && (
                <div className="absolute bottom-full left-0 mb-2 w-64 rounded-lg overflow-hidden border shadow-lg bg-card">
                    <p className="text-[10px] text-muted-foreground px-2 py-1 bg-blue-500/10 flex items-center gap-1">
                        <Bot className="h-3 w-3" />AI Density Heatmap
                    </p>
                    <img src={src} alt="AI density heatmap" className="w-full object-contain" />
                </div>
            )}
        </div>
    );
}
