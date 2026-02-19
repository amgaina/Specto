import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
    usePipeline,
    type LabeledImage,
    type ImageAnnotation,
    type AnnotationType,
    ANNOTATION_TYPE_STYLES,
    getSpeciesColor,
} from "@/context/PipelineContext";
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
    Layers,
    Tag,
    Square,
    Circle,
    Info,
    EyeOff,
    Columns2,
    ChevronsLeftRight,
} from "lucide-react";
import { COLONIES, SPECIES } from "@/lib/mockDataGenerator";

const SPECIES_OPTIONS = SPECIES.map(s => s.name);
const COLONY_OPTIONS = COLONIES.map(c => c.name);

type FilterMode = "all" | "unlabeled" | "labeled";
type DrawTool = "select" | "bird" | "nest" | "boundary";

export default function AdminImages({ embedded = false }: { embedded?: boolean }) {
    const { galleryImages, updateLabels } = usePipeline();
    const [filter, setFilter] = useState<FilterMode>("all");
    const [editorOpen, setEditorOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Zoom/pan
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
    const imgRef = useRef<HTMLImageElement>(null);

    // Annotations
    const [annotations, setAnnotations] = useState<ImageAnnotation[]>([]);
    const [drawTool, setDrawTool] = useState<DrawTool>("select");
    const [drawSpecies, setDrawSpecies] = useState(SPECIES_OPTIONS[0]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
    const [drawCurrent, setDrawCurrent] = useState({ x: 0, y: 0 });
    const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
    const [showAnnotations, setShowAnnotations] = useState(true);
    const [compareMode, setCompareMode] = useState(false);
    const [sliderPosition, setSliderPosition] = useState(50); // 0-100%
    const [isDraggingSlider, setIsDraggingSlider] = useState(false);
    const sliderContainerRef = useRef<HTMLDivElement>(null);

    // Label form
    const [speciesTags, setSpeciesTags] = useState<string[]>([]);
    const [primarySpecies, setPrimarySpecies] = useState("");
    const [colonyName, setColonyName] = useState("");
    const [location, setLocation] = useState("");
    const [notes, setNotes] = useState("");
    const [speciesInput, setSpeciesInput] = useState("");
    const [showSpeciesDropdown, setShowSpeciesDropdown] = useState(false);

    const isLabeled = (img: LabeledImage) => !!(img.species && img.colonyName);

    const filteredImages = galleryImages.filter(img => {
        if (filter === "unlabeled") return !isLabeled(img);
        if (filter === "labeled") return isLabeled(img);
        return true;
    });

    const labeledCount = galleryImages.filter(isLabeled).length;
    const unlabeledCount = galleryImages.length - labeledCount;
    const selectedImage = filteredImages[selectedIndex] || null;

    // Annotation stats — per-species breakdown
    const annotationStats = useMemo(() => {
        const birds = annotations.filter(a => a.type === "bird").length;
        const nests = annotations.filter(a => a.type === "nest").length;
        const boundaries = annotations.filter(a => a.type === "boundary").length;
        // Per-species counts
        const perSpecies: Record<string, { birds: number; nests: number; boundaries: number }> = {};
        for (const a of annotations) {
            if (!perSpecies[a.species]) perSpecies[a.species] = { birds: 0, nests: 0, boundaries: 0 };
            if (a.type === "bird") perSpecies[a.species].birds++;
            else if (a.type === "nest") perSpecies[a.species].nests++;
            else perSpecies[a.species].boundaries++;
        }
        return { birds, nests, boundaries, speciesCount: Object.keys(perSpecies).length, perSpecies };
    }, [annotations]);

    const loadForm = useCallback((img: LabeledImage | null) => {
        if (!img) return;
        setSpeciesTags(img.speciesTags || (img.species ? [img.species] : []));
        setPrimarySpecies(img.species || "");
        setColonyName(img.colonyName || "");
        setLocation(img.location || "");
        setNotes(img.notes || "");
        setAnnotations(img.annotations || []);
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setDrawTool("select");
        setSelectedAnnotation(null);
        setShowAnnotations(true);
        setCompareMode(false);
        setSliderPosition(50);
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
            annotations: annotations.length > 0 ? annotations : undefined,
        });
    }, [selectedImage, primarySpecies, speciesTags, colonyName, location, notes, annotations, updateLabels]);

    const navigate = useCallback((dir: 1 | -1) => {
        saveLabels();
        const next = selectedIndex + dir;
        if (next >= 0 && next < filteredImages.length) {
            setSelectedIndex(next);
            loadForm(filteredImages[next]);
        }
    }, [selectedIndex, filteredImages, saveLabels, loadForm]);

    const closeEditor = useCallback(() => {
        saveLabels();
        setEditorOpen(false);
    }, [saveLabels]);

    // Zoom
    const handleZoomIn = () => setZoom(z => Math.min(z * 1.3, 20));
    const handleZoomOut = () => setZoom(z => Math.max(z / 1.3, 0.5));
    const handleResetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

    // Zoom to fit a specific annotation
    const zoomToAnnotation = useCallback((a: ImageAnnotation) => {
        if (!imgRef.current) return;
        const container = imgRef.current.parentElement?.parentElement?.parentElement;
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        const imgRect = imgRef.current.getBoundingClientRect();

        // Calculate zoom to fit the annotation in ~60% of viewport
        const annW = a.w * (imgRect.width / zoom);
        const annH = a.h * (imgRect.height / zoom);
        const fitZoom = Math.min(
            (containerRect.width * 0.6) / annW,
            (containerRect.height * 0.6) / annH,
            20
        );
        const newZoom = Math.max(2, fitZoom);

        // Calculate pan to center the annotation
        const annCenterX = (a.x + a.w / 2) * (imgRect.width / zoom);
        const annCenterY = (a.y + a.h / 2) * (imgRect.height / zoom);
        const imgCenterX = (imgRect.width / zoom) / 2;
        const imgCenterY = (imgRect.height / zoom) / 2;

        setZoom(newZoom);
        setPan({
            x: -(annCenterX - imgCenterX) * newZoom,
            y: -(annCenterY - imgCenterY) * newZoom,
        });
        setSelectedAnnotation(a.id);
    }, [zoom]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        setZoom(z => Math.min(Math.max(z * (e.deltaY > 0 ? 0.9 : 1.1), 0.5), 20));
    }, []);

    // Get image-relative coords (0-1)
    const getImageCoords = useCallback((e: React.MouseEvent): { x: number; y: number } | null => {
        if (!imgRef.current) return null;
        const rect = imgRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        if (x < 0 || x > 1 || y < 0 || y > 1) return null;
        return { x, y };
    }, []);

    // Slider drag handler
    const handleSliderDrag = useCallback((e: React.MouseEvent | MouseEvent) => {
        if (!sliderContainerRef.current) return;
        const rect = sliderContainerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        setSliderPosition(Math.max(5, Math.min(95, x)));
    }, []);

    const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
        if (isDraggingSlider) return;
        if (compareMode) {
            // In compare mode, only allow pan when zoomed
            if (zoom > 1) {
                setIsPanning(true);
                panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
            }
            return;
        }
        if (drawTool === "select") {
            // Pan mode when zoomed
            if (zoom > 1) {
                setIsPanning(true);
                panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
            }
            return;
        }
        // Drawing mode
        const coords = getImageCoords(e);
        if (!coords) return;
        setIsDrawing(true);
        setDrawStart(coords);
        setDrawCurrent(coords);
    }, [drawTool, zoom, pan, getImageCoords, compareMode, isDraggingSlider]);

    const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDraggingSlider) {
            handleSliderDrag(e);
            return;
        }
        if (isPanning) {
            setPan({
                x: panStart.current.panX + (e.clientX - panStart.current.x),
                y: panStart.current.panY + (e.clientY - panStart.current.y),
            });
            return;
        }
        if (isDrawing) {
            const coords = getImageCoords(e);
            if (coords) setDrawCurrent(coords);
        }
    }, [isPanning, isDrawing, getImageCoords, isDraggingSlider, handleSliderDrag]);

    const handleCanvasMouseUp = useCallback(() => {
        if (isDraggingSlider) { setIsDraggingSlider(false); return; }
        if (isPanning) { setIsPanning(false); return; }
        if (!isDrawing) return;
        setIsDrawing(false);

        const x = Math.min(drawStart.x, drawCurrent.x);
        const y = Math.min(drawStart.y, drawCurrent.y);
        const w = Math.abs(drawCurrent.x - drawStart.x);
        const h = Math.abs(drawCurrent.y - drawStart.y);

        // Min size threshold
        if (w < 0.01 && h < 0.01) return;

        const newAnnotation: ImageAnnotation = {
            id: crypto.randomUUID(),
            type: drawTool as AnnotationType,
            species: drawSpecies,
            x, y, w, h,
            confidence: drawTool === "boundary" ? undefined : 0.90,
        };

        setAnnotations(prev => [...prev, newAnnotation]);

        // Auto-add species to tags if not present
        if (!speciesTags.includes(drawSpecies)) {
            setSpeciesTags(prev => [...prev, drawSpecies]);
            if (!primarySpecies) setPrimarySpecies(drawSpecies);
        }
    }, [isDrawing, drawStart, drawCurrent, drawTool, drawSpecies, speciesTags, primarySpecies]);

    const deleteAnnotation = (id: string) => {
        setAnnotations(prev => prev.filter(a => a.id !== id));
        if (selectedAnnotation === id) setSelectedAnnotation(null);
    };

    // Species tag management
    const addSpeciesTag = (species: string) => {
        if (!speciesTags.includes(species)) {
            setSpeciesTags(prev => [...prev, species]);
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
            // Don't capture if typing in an input
            if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
            if (e.key === "ArrowLeft") { e.preventDefault(); navigate(-1); }
            if (e.key === "ArrowRight") { e.preventDefault(); navigate(1); }
            if (e.key === "Escape") closeEditor();
            if (e.key === "+" || e.key === "=") handleZoomIn();
            if (e.key === "-") handleZoomOut();
            if (e.key === "0") handleResetZoom();
            if (e.key === "v" || e.key === "V") setDrawTool("select");
            if (e.key === "b" || e.key === "B") setDrawTool("bird");
            if (e.key === "n" || e.key === "N") setDrawTool("nest");
            if (e.key === "r" || e.key === "R") setDrawTool("boundary");
            if (e.key === "h" || e.key === "H") setShowAnnotations(v => !v);
            if (e.key === "Delete" || e.key === "Backspace") {
                if (selectedAnnotation) { deleteAnnotation(selectedAnnotation); }
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [editorOpen, navigate, closeEditor, selectedAnnotation]);

    // ==================== CARD GRID ====================
    const gridView = (
        <div>
            {!embedded && (
                <div className="mb-4">
                    <h1 className="text-xl font-bold mb-1">Image Labeling</h1>
                    <p className="text-sm text-muted-foreground">Add species boundaries, bird/nest markers, and colony labels</p>
                </div>
            )}

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
                        const annCount = image.annotations?.length || 0;
                        return (
                            <div
                                key={image.id}
                                onClick={() => openEditor(idx)}
                                className={`group relative rounded-lg border overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${labeled ? "border-green-500/30" : "border-amber-500/30 bg-amber-500/5"}`}
                            >
                                <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                                    <img src={image.imageUrl} alt={image.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    {/* Status */}
                                    <div className="absolute top-1.5 right-1.5 flex gap-1">
                                        {annCount > 0 && (
                                            <Badge className="bg-blue-500/90 text-white border-0 text-[10px] px-1.5 py-0 gap-0.5">
                                                <Layers className="h-2.5 w-2.5" />{annCount}
                                            </Badge>
                                        )}
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
                                    {/* AI counts */}
                                    {image.aiStatus === "done" && (
                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-4">
                                            <div className="flex items-center gap-2 text-[10px] text-white/90">
                                                <span className="flex items-center gap-0.5"><Bot className="h-2.5 w-2.5 text-blue-300" />{image.aiBirdCount?.split(" ")[0] || "—"} birds</span>
                                                <span>{image.aiNestCount?.split(" ")[0] || "—"} nests</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
                                    </div>
                                </div>
                                <div className="p-2 space-y-1">
                                    <p className="text-xs font-medium truncate">{image.fileName}</p>
                                    {/* Species tags with color dots */}
                                    <div className="flex flex-wrap gap-1">
                                        {image.speciesTags && image.speciesTags.length > 0 ? (
                                            <>
                                                {image.speciesTags.slice(0, 2).map(s => (
                                                    <Badge key={s} variant="secondary" className="gap-0.5 text-[10px] px-1.5 py-0">
                                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getSpeciesColor(s) }} />
                                                        {s}
                                                    </Badge>
                                                ))}
                                                {image.speciesTags.length > 2 && (
                                                    <Badge variant="outline" className="text-[10px] px-1 py-0 text-muted-foreground">
                                                        +{image.speciesTags.length - 2}
                                                    </Badge>
                                                )}
                                            </>
                                        ) : image.species ? (
                                            <Badge variant="secondary" className="gap-0.5 text-[10px] px-1.5 py-0">
                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getSpeciesColor(image.species) }} />
                                                {image.species}
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
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
            {/* Toolbar */}
            <div className="h-11 border-b bg-card flex items-center justify-between px-3 shrink-0">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" onClick={closeEditor}>
                        <X className="h-3.5 w-3.5" />Close
                    </Button>
                    <span className="text-border">|</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={selectedIndex <= 0} onClick={() => navigate(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-medium">{selectedIndex + 1} / {filteredImages.length}</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={selectedIndex >= filteredImages.length - 1} onClick={() => navigate(1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground ml-1 max-w-[180px] truncate">{selectedImage.fileName}</span>
                </div>

                {/* Drawing tools */}
                <div className="flex items-center gap-1">
                    <div className="flex items-center bg-muted rounded-md p-0.5 gap-0.5">
                        <ToolButton icon={<Crosshair className="h-3.5 w-3.5" />} label="Select" shortcut="V" active={drawTool === "select"} onClick={() => setDrawTool("select")} />
                        <ToolButton icon={<Bird className="h-3.5 w-3.5" />} label="Bird" shortcut="B" active={drawTool === "bird"} onClick={() => setDrawTool("bird")} color="#3b82f6" />
                        <ToolButton icon={<Circle className="h-3.5 w-3.5" />} label="Nest" shortcut="N" active={drawTool === "nest"} onClick={() => setDrawTool("nest")} color="#f59e0b" />
                        <ToolButton icon={<Square className="h-3.5 w-3.5" />} label="Boundary" shortcut="R" active={drawTool === "boundary"} onClick={() => setDrawTool("boundary")} color="#10b981" />
                    </div>

                    {drawTool !== "select" && (
                        <select
                            value={drawSpecies}
                            onChange={e => setDrawSpecies(e.target.value)}
                            className="h-7 text-xs rounded-md border bg-background px-2 max-w-[160px]"
                        >
                            {SPECIES_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    )}

                    <span className="text-border mx-1">|</span>

                    {/* Zoom */}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleZoomOut}><ZoomOut className="h-3.5 w-3.5" /></Button>
                    <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleZoomIn}><ZoomIn className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleResetZoom}><RotateCcw className="h-3.5 w-3.5" /></Button>

                    <span className="text-border mx-1">|</span>
                    <Button
                        variant={showAnnotations ? "ghost" : "secondary"}
                        size="sm"
                        className="h-7 px-2 gap-1 text-xs"
                        onClick={() => setShowAnnotations(!showAnnotations)}
                    >
                        {showAnnotations ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        {showAnnotations ? "Hide" : "Show"}
                    </Button>

                    {/* Comparison slider toggle */}
                    {selectedImage.labeledImageUrl && (
                        <Button
                            variant={compareMode ? "default" : "ghost"}
                            size="sm"
                            className="h-7 px-2 gap-1 text-xs"
                            onClick={() => { setCompareMode(!compareMode); setSliderPosition(50); }}
                        >
                            <Columns2 className="h-3.5 w-3.5" />
                            Compare
                        </Button>
                    )}

                    <Button size="sm" className="h-7 px-3 gap-1 ml-1" onClick={() => { saveLabels(); closeEditor(); }}>
                        <Save className="h-3.5 w-3.5" />Save
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Image canvas */}
                <div
                    className="flex-1 relative overflow-hidden bg-neutral-950 select-none"
                    onWheel={handleWheel}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={() => { setIsPanning(false); setIsDraggingSlider(false); if (isDrawing) setIsDrawing(false); }}
                    style={{ cursor: isDraggingSlider ? "ew-resize" : compareMode ? (zoom > 1 ? (isPanning ? "grabbing" : "grab") : "default") : drawTool !== "select" ? "crosshair" : zoom > 1 ? (isPanning ? "grabbing" : "grab") : "default" }}
                >
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: "center center",
                            transition: isPanning || isDrawing ? "none" : "transform 0.15s ease-out",
                        }}
                    >
                        {/* Image + Comparison Slider */}
                        <div className="relative inline-block" ref={sliderContainerRef}>
                            {/* Base image (original — always rendered) */}
                            <img
                                ref={imgRef}
                                src={selectedImage.imageUrl}
                                alt={selectedImage.fileName}
                                className="max-w-full max-h-[calc(100vh-44px)] object-contain block"
                                draggable={false}
                            />

                            {/* Labeled overlay — clipped to left side of slider */}
                            {compareMode && selectedImage.labeledImageUrl && (
                                <img
                                    src={selectedImage.labeledImageUrl}
                                    alt="Labeled"
                                    className="absolute inset-0 w-full h-full object-contain block"
                                    draggable={false}
                                    style={{
                                        clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                                    }}
                                />
                            )}

                            {/* Slider divider + handle */}
                            {compareMode && selectedImage.labeledImageUrl && (
                                <>
                                    {/* Vertical line */}
                                    <div
                                        className="absolute top-0 bottom-0 pointer-events-none"
                                        style={{
                                            left: `${sliderPosition}%`,
                                            width: "2px",
                                            marginLeft: "-1px",
                                            background: "white",
                                            boxShadow: "0 0 4px rgba(0,0,0,0.5), 0 0 8px rgba(0,0,0,0.3)",
                                            zIndex: 20,
                                        }}
                                    />

                                    {/* Drag handle */}
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto"
                                        style={{
                                            left: `${sliderPosition}%`,
                                            marginLeft: "-16px",
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "50%",
                                            background: "rgba(0,0,0,0.7)",
                                            border: "2px solid white",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                                            cursor: "ew-resize",
                                            zIndex: 21,
                                            // Scale inversely so handle stays the same size at any zoom
                                            transform: `translateY(-50%) scale(${1 / zoom})`,
                                            transformOrigin: "center center",
                                        }}
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            setIsDraggingSlider(true);
                                        }}
                                    >
                                        <ChevronsLeftRight className="h-4 w-4 text-white" />
                                    </div>

                                    {/* Side labels — scale inversely for readability */}
                                    <div
                                        className="absolute top-2 pointer-events-none"
                                        style={{
                                            left: `${Math.max(2, sliderPosition - 12)}%`,
                                            transform: `scale(${1 / zoom})`,
                                            transformOrigin: "top right",
                                            zIndex: 20,
                                        }}
                                    >
                                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-white shadow">
                                            Labeled
                                        </span>
                                    </div>
                                    <div
                                        className="absolute top-2 pointer-events-none"
                                        style={{
                                            left: `${Math.min(98, sliderPosition + 2)}%`,
                                            transform: `scale(${1 / zoom})`,
                                            transformOrigin: "top left",
                                            zIndex: 20,
                                        }}
                                    >
                                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-white shadow">
                                            Original
                                        </span>
                                    </div>
                                </>
                            )}

                            {/* Annotation overlays — hidden in compare mode */}
                            {showAnnotations && !compareMode && annotations.map(a => {
                                const color = getSpeciesColor(a.species);
                                const style = ANNOTATION_TYPE_STYLES[a.type];
                                const isSelected = selectedAnnotation === a.id;
                                // Border width in image-relative pixels so it stays visible at any zoom
                                const borderPx = Math.max(1, Math.round((isSelected ? 3 : 2) / zoom));
                                return (
                                    <div
                                        key={a.id}
                                        className="absolute group/ann"
                                        style={{
                                            left: `${a.x * 100}%`,
                                            top: `${a.y * 100}%`,
                                            width: `${a.w * 100}%`,
                                            height: `${a.h * 100}%`,
                                            border: `${borderPx}px ${style.borderStyle} ${color}`,
                                            backgroundColor: `${color}${a.type === "boundary" ? "10" : "20"}`,
                                            boxShadow: isSelected ? `0 0 0 ${Math.max(1, Math.round(1 / zoom))}px ${color}, 0 0 ${Math.round(8 / zoom)}px ${color}40` : "none",
                                            zIndex: a.type === "boundary" ? 1 : 2,
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedAnnotation(isSelected ? null : a.id);
                                        }}
                                    >
                                        {/* Label tag — scale inversely so text stays readable */}
                                        <div
                                            className="absolute left-0 flex items-center gap-0.5 px-1 py-0 rounded-t font-medium text-white whitespace-nowrap origin-bottom-left"
                                            style={{
                                                backgroundColor: color,
                                                bottom: "100%",
                                                fontSize: `${Math.max(7, 9 / zoom)}px`,
                                                transform: `scale(${1 / zoom})`,
                                                transformOrigin: "bottom left",
                                            }}
                                        >
                                            {a.type === "bird" && <Bird style={{ width: 10, height: 10 }} />}
                                            {a.type === "nest" && <Circle style={{ width: 10, height: 10 }} />}
                                            {a.type === "boundary" && <Square style={{ width: 10, height: 10 }} />}
                                            {a.species}
                                            {a.confidence && <span className="opacity-70 ml-0.5">{Math.round(a.confidence * 100)}%</span>}
                                        </div>
                                        {/* Delete on hover */}
                                        <button
                                            className="absolute -right-1 w-4 h-4 rounded-full bg-red-600 text-white opacity-0 group-hover/ann:opacity-100 transition-opacity flex items-center justify-center"
                                            style={{
                                                bottom: "100%",
                                                transform: `scale(${1 / zoom})`,
                                                transformOrigin: "bottom right",
                                            }}
                                            onClick={(e) => { e.stopPropagation(); deleteAnnotation(a.id); }}
                                        >
                                            <X className="h-2.5 w-2.5" />
                                        </button>
                                        {/* Note for boundaries */}
                                        {a.note && (
                                            <div
                                                className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-white/90 truncate"
                                                style={{
                                                    backgroundColor: `${color}90`,
                                                    fontSize: `${Math.max(6, 8 / zoom)}px`,
                                                    transform: `scale(${1 / zoom})`,
                                                    transformOrigin: "bottom left",
                                                }}
                                            >
                                                {a.note}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Drawing preview — scales with image, hidden in compare mode */}
                            {isDrawing && !compareMode && drawTool !== "select" && (
                                <div
                                    className="absolute pointer-events-none"
                                    style={{
                                        left: `${Math.min(drawStart.x, drawCurrent.x) * 100}%`,
                                        top: `${Math.min(drawStart.y, drawCurrent.y) * 100}%`,
                                        width: `${Math.abs(drawCurrent.x - drawStart.x) * 100}%`,
                                        height: `${Math.abs(drawCurrent.y - drawStart.y) * 100}%`,
                                        border: `${Math.max(1, Math.round(2 / zoom))}px ${ANNOTATION_TYPE_STYLES[drawTool as AnnotationType].borderStyle} ${getSpeciesColor(drawSpecies)}`,
                                        backgroundColor: `${getSpeciesColor(drawSpecies)}20`,
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Drawing mode banner */}
                    {drawTool !== "select" && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg text-white"
                            style={{ backgroundColor: drawTool === "bird" ? "#3b82f6" : drawTool === "nest" ? "#f59e0b" : "#10b981" }}
                        >
                            {drawTool === "bird" && <Bird className="h-3 w-3" />}
                            {drawTool === "nest" && <Circle className="h-3 w-3" />}
                            {drawTool === "boundary" && <Square className="h-3 w-3" />}
                            Draw {ANNOTATION_TYPE_STYLES[drawTool as AnnotationType].label}: {drawSpecies}
                            <div className="w-3 h-3 rounded-full border border-white/50" style={{ backgroundColor: getSpeciesColor(drawSpecies) }} />
                        </div>
                    )}

                    {/* Heatmap */}
                    {selectedImage.aiVisualization && (
                        <div className="absolute bottom-3 left-3">
                            <HeatmapToggle src={selectedImage.aiVisualization} />
                        </div>
                    )}

                    {/* Zoom indicator */}
                    {zoom !== 1 && (
                        <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded">{Math.round(zoom * 100)}%</div>
                    )}
                </div>

                {/* Right sidebar */}
                <div className="w-80 border-l bg-card overflow-y-auto shrink-0">
                    <div className="p-3 space-y-3">
                        {/* Status + annotation stats */}
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
                        </div>

                        {/* Annotation summary bar */}
                        <div className="grid grid-cols-4 gap-1 text-center">
                            <div className="p-1.5 rounded bg-blue-500/10">
                                <p className="text-lg font-bold text-blue-400">{annotationStats.birds}</p>
                                <p className="text-[9px] text-muted-foreground">Birds</p>
                            </div>
                            <div className="p-1.5 rounded bg-amber-500/10">
                                <p className="text-lg font-bold text-amber-400">{annotationStats.nests}</p>
                                <p className="text-[9px] text-muted-foreground">Nests</p>
                            </div>
                            <div className="p-1.5 rounded bg-green-500/10">
                                <p className="text-lg font-bold text-green-400">{annotationStats.boundaries}</p>
                                <p className="text-[9px] text-muted-foreground">Zones</p>
                            </div>
                            <div className="p-1.5 rounded bg-purple-500/10">
                                <p className="text-lg font-bold text-purple-400">{annotationStats.speciesCount}</p>
                                <p className="text-[9px] text-muted-foreground">Species</p>
                            </div>
                        </div>

                        {/* Per-species breakdown */}
                        {Object.keys(annotationStats.perSpecies).length > 0 && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-medium text-muted-foreground">Per-Species Count</p>
                                <div className="space-y-0.5">
                                    {Object.entries(annotationStats.perSpecies).map(([species, counts]) => (
                                        <div key={species} className="flex items-center gap-1.5 text-[11px] px-1.5 py-1 rounded bg-muted/40">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getSpeciesColor(species) }} />
                                            <span className="font-medium truncate flex-1">{species}</span>
                                            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                                                {counts.birds > 0 && (
                                                    <span className="flex items-center gap-0.5" title="Birds">
                                                        <Bird className="h-2.5 w-2.5 text-blue-400" />{counts.birds}
                                                    </span>
                                                )}
                                                {counts.nests > 0 && (
                                                    <span className="flex items-center gap-0.5" title="Nests">
                                                        <Circle className="h-2.5 w-2.5 text-amber-400" />{counts.nests}
                                                    </span>
                                                )}
                                                {counts.boundaries > 0 && (
                                                    <span className="flex items-center gap-0.5" title="Zones">
                                                        <Square className="h-2.5 w-2.5 text-green-400" />{counts.boundaries}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* AI Counts */}
                        {selectedImage.aiStatus === "done" && (
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-center">
                                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5"><Bot className="h-3 w-3" />AI Birds</p>
                                    <p className="font-bold text-blue-400">{selectedImage.aiBirdCount?.split(" ")[0] || "—"}</p>
                                    {selectedImage.aiBirdCount?.includes("+/-") && (
                                        <p className="text-[9px] text-muted-foreground/70">{selectedImage.aiBirdCount}</p>
                                    )}
                                </div>
                                <div className="p-2 rounded-lg bg-blue-500/10 text-center">
                                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5"><Bot className="h-3 w-3" />AI Nests</p>
                                    <p className="font-bold text-blue-400">{selectedImage.aiNestCount?.split(" ")[0] || "—"}</p>
                                    {selectedImage.aiNestCount?.includes("+/-") && (
                                        <p className="text-[9px] text-muted-foreground/70">{selectedImage.aiNestCount}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Species Tags with color legend */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-medium">
                                <Tag className="h-3.5 w-3.5" />Species Tags
                                <span className="text-muted-foreground font-normal">({speciesTags.length})</span>
                            </label>
                            <div className="flex flex-wrap gap-1 min-h-[28px] p-1.5 rounded-md border bg-background">
                                {speciesTags.map(s => (
                                    <Badge
                                        key={s}
                                        className="gap-1 text-[11px] px-1.5 py-0.5 cursor-pointer text-white border-0"
                                        style={{ backgroundColor: getSpeciesColor(s) + (s === primarySpecies ? "" : "90") }}
                                        onClick={() => setPrimarySpecies(s)}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-white/30" />
                                        {s}
                                        {s === primarySpecies && <span className="text-[8px] opacity-80">primary</span>}
                                        <button onClick={(e) => { e.stopPropagation(); removeSpeciesTag(s); }} className="ml-0.5 hover:bg-white/20 rounded">
                                            <X className="h-2.5 w-2.5" />
                                        </button>
                                    </Badge>
                                ))}
                                {speciesTags.length === 0 && (
                                    <span className="text-[10px] text-muted-foreground/50 italic">Draw annotations or add manually</span>
                                )}
                            </div>
                            <div className="relative">
                                <div className="flex gap-1">
                                    <Input
                                        placeholder="Add species..."
                                        value={speciesInput}
                                        onChange={e => { setSpeciesInput(e.target.value); setShowSpeciesDropdown(true); }}
                                        onFocus={() => setShowSpeciesDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowSpeciesDropdown(false), 150)}
                                        className="h-7 text-xs"
                                    />
                                    <Button variant="outline" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => setShowSpeciesDropdown(!showSpeciesDropdown)}>
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                                {showSpeciesDropdown && filteredSpeciesOptions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-10 max-h-32 overflow-y-auto">
                                        {filteredSpeciesOptions.map(s => (
                                            <button
                                                key={s}
                                                className="w-full text-left px-2 py-1 text-xs hover:bg-accent transition-colors flex items-center gap-1.5"
                                                onMouseDown={() => addSpeciesTag(s)}
                                            >
                                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getSpeciesColor(s) }} />
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Colony */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-medium"><Home className="h-3.5 w-3.5" />Colony</label>
                            <select value={colonyName} onChange={e => setColonyName(e.target.value)} className="w-full h-7 text-xs rounded-md border bg-background px-2">
                                <option value="">Select colony...</option>
                                {COLONY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Location */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-medium"><MapPin className="h-3.5 w-3.5" />GPS</label>
                            <Input placeholder="29.2108 N, 89.2620 W" value={location} onChange={e => setLocation(e.target.value)} className="h-7 text-xs" />
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Notes</label>
                            <Textarea placeholder="Observations..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="text-xs resize-none" />
                        </div>

                        {/* Annotation list */}
                        {annotations.length > 0 && (
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-medium">
                                    <Layers className="h-3.5 w-3.5" />Annotations ({annotations.length})
                                </label>
                                <div className="space-y-0.5 max-h-40 overflow-y-auto">
                                    {annotations.map((a, i) => {
                                        const color = getSpeciesColor(a.species);
                                        return (
                                            <div
                                                key={a.id}
                                                className={`flex items-center justify-between text-[11px] px-1.5 py-1 rounded cursor-pointer transition-colors ${selectedAnnotation === a.id ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/50 hover:bg-muted"}`}
                                                onClick={() => {
                                                    if (selectedAnnotation === a.id) {
                                                        setSelectedAnnotation(null);
                                                        handleResetZoom();
                                                    } else {
                                                        zoomToAnnotation(a);
                                                    }
                                                }}
                                            >
                                                <span className="flex items-center gap-1.5 min-w-0">
                                                    <div className="w-2.5 h-2.5 rounded shrink-0" style={{
                                                        backgroundColor: color + "30",
                                                        border: `2px ${ANNOTATION_TYPE_STYLES[a.type].borderStyle} ${color}`,
                                                    }} />
                                                    <span className="truncate">
                                                        <span className="font-medium">{ANNOTATION_TYPE_STYLES[a.type].label}</span>
                                                        <span className="text-muted-foreground ml-1">{a.species}</span>
                                                    </span>
                                                    {a.confidence && (
                                                        <span className="text-[9px] text-muted-foreground/60">{Math.round(a.confidence * 100)}%</span>
                                                    )}
                                                </span>
                                                <button onClick={(e) => { e.stopPropagation(); deleteAnnotation(a.id); }} className="text-muted-foreground hover:text-destructive shrink-0 ml-1">
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="space-y-1 pt-2 border-t">
                            <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><Info className="h-3 w-3" />Metadata</p>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                                {selectedImage.surveyYear && <><span className="text-muted-foreground">Year:</span><span>{selectedImage.surveyYear}</span></>}
                                {selectedImage.geoRegion && <><span className="text-muted-foreground">Region:</span><span>{selectedImage.geoRegion}</span></>}
                                {selectedImage.habitat && <><span className="text-muted-foreground">Habitat:</span><span>{selectedImage.habitat}</span></>}
                                {selectedImage.surveyDate && <><span className="text-muted-foreground">Survey:</span><span>{selectedImage.surveyDate}</span></>}
                                {selectedImage.aiModelInfo && <><span className="text-muted-foreground">Model:</span><span className="text-blue-400">{selectedImage.aiModelInfo}</span></>}
                                {selectedImage.source && <><span className="text-muted-foreground">Source:</span><span className="capitalize">{selectedImage.source}</span></>}
                            </div>
                        </div>

                        {/* Keyboard shortcuts */}
                        <div className="pt-2 border-t text-[10px] text-muted-foreground/60 space-y-0.5">
                            <p><kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">V</kbd> Select <kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">B</kbd> Bird <kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">N</kbd> Nest <kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">R</kbd> Boundary</p>
                            <p><kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">←→</kbd> Navigate <kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">+/-</kbd> Zoom <kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">H</kbd> Hide annotations</p>
                            <p><kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">Del</kbd> Delete selected <kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">Esc</kbd> Close</p>
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
            <main className="container mx-auto px-4 lg:px-8 pt-12 pb-12">{content}</main>
        </div>
    );
}

// Tool button component
function ToolButton({ icon, label, shortcut, active, onClick, color }: {
    icon: React.ReactNode; label: string; shortcut: string;
    active: boolean; onClick: () => void; color?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`h-7 px-2 rounded text-xs flex items-center gap-1 transition-colors ${active ? "bg-background shadow-sm font-medium" : "hover:bg-background/50 text-muted-foreground"}`}
            title={`${label} (${shortcut})`}
        >
            <span style={color && active ? { color } : undefined}>{icon}</span>
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}

// Heatmap toggle
function HeatmapToggle({ src }: { src: string }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <Button variant={show ? "default" : "secondary"} size="sm" className="h-7 px-2 gap-1 text-xs shadow-lg" onClick={() => setShow(!show)}>
                <Layers className="h-3 w-3" />{show ? "Hide" : "Show"} Heatmap
            </Button>
            {show && (
                <div className="absolute bottom-full left-0 mb-2 w-64 rounded-lg overflow-hidden border shadow-lg bg-card">
                    <p className="text-[10px] text-muted-foreground px-2 py-1 bg-blue-500/10 flex items-center gap-1"><Bot className="h-3 w-3" />AI Density Heatmap</p>
                    <img src={src} alt="AI density" className="w-full object-contain" />
                </div>
            )}
        </div>
    );
}
