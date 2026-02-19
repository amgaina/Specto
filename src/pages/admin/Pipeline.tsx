import { useState, useEffect } from "react";
import { usePipeline } from "@/context/PipelineContext";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Upload, Image, CheckSquare, ArrowRight, Database,
    Bird, MapPin, Bot, Download, Home,
    Clock, Calendar, Globe,
    ChevronRight, Layers,
} from "lucide-react";
import AdminUpload from "./Upload";
import AdminImages from "./Images";
import AdminReview from "./Review";

export default function AdminPipeline() {
    const { pendingImages, galleryImages, datasetImages } = usePipeline();
    const [activeTab, setActiveTab] = useState("ingest");

    // Listen for navigation events from child components (e.g., Upload CTA)
    useEffect(() => {
        const handler = (e: Event) => {
            const tab = (e as CustomEvent).detail;
            if (tab) setActiveTab(tab);
        };
        window.addEventListener("pipeline-navigate", handler);
        return () => window.removeEventListener("pipeline-navigate", handler);
    }, []);

    // Count unlabeled gallery images (approved + AI done but no species yet)
    const unlabeledCount = galleryImages.filter(i => i.aiStatus === "done" && !i.species).length;

    return (
        <div className="min-h-screen bg-background">
            <AdminHeader />
            <div className="pt-12">
                <div className="container mx-auto px-4 lg:px-8 py-4">
                    {/* Pipeline flow indicator with counts */}
                    <div className="flex items-center gap-1.5 mb-4 text-xs text-muted-foreground overflow-x-auto">
                        <button onClick={() => setActiveTab("ingest")} className={`flex items-center gap-1 px-2 py-1 rounded whitespace-nowrap ${activeTab === "ingest" ? "bg-primary/10 text-primary font-medium" : "hover:text-foreground"}`}>
                            <Upload className="h-3 w-3" /> Ingest
                        </button>
                        <ArrowRight className="h-3 w-3 shrink-0" />
                        <button onClick={() => setActiveTab("review")} className={`flex items-center gap-1 px-2 py-1 rounded whitespace-nowrap ${activeTab === "review" ? "bg-primary/10 text-primary font-medium" : "hover:text-foreground"}`}>
                            <CheckSquare className="h-3 w-3" /> Review
                            {pendingImages.length > 0 && (
                                <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] bg-amber-500/20 text-amber-500 border-0">
                                    {pendingImages.length}
                                </Badge>
                            )}
                        </button>
                        <ArrowRight className="h-3 w-3 shrink-0" />
                        <button onClick={() => setActiveTab("gallery")} className={`flex items-center gap-1 px-2 py-1 rounded whitespace-nowrap ${activeTab === "gallery" ? "bg-primary/10 text-primary font-medium" : "hover:text-foreground"}`}>
                            <Image className="h-3 w-3" /> Label
                            {unlabeledCount > 0 && (
                                <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] bg-blue-500/20 text-blue-400 border-0">
                                    {unlabeledCount}
                                </Badge>
                            )}
                        </button>
                        <ArrowRight className="h-3 w-3 shrink-0" />
                        <button onClick={() => setActiveTab("dataset")} className={`flex items-center gap-1 px-2 py-1 rounded whitespace-nowrap ${activeTab === "dataset" ? "bg-primary/10 text-primary font-medium" : "hover:text-foreground"}`}>
                            <Database className="h-3 w-3" /> Dataset
                            <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] bg-green-500/20 text-green-500 border-0">
                                {datasetImages.length}
                            </Badge>
                        </button>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full max-w-md grid-cols-4 mb-4 h-9">
                            <TabsTrigger value="ingest" className="gap-1.5 text-xs">
                                <Upload className="h-3 w-3" />
                                Ingest
                            </TabsTrigger>
                            <TabsTrigger value="review" className="gap-1.5 text-xs">
                                <CheckSquare className="h-3 w-3" />
                                Review
                                {pendingImages.length > 0 && (
                                    <span className="h-1.5 w-1.5 bg-amber-500 rounded-full" />
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="gallery" className="gap-1.5 text-xs">
                                <Image className="h-3 w-3" />
                                Label
                            </TabsTrigger>
                            <TabsTrigger value="dataset" className="gap-1.5 text-xs">
                                <Database className="h-3 w-3" />
                                Dataset
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="ingest" className="mt-0">
                            <AdminUpload embedded />
                        </TabsContent>

                        <TabsContent value="review" className="mt-0">
                            <AdminReview embedded />
                        </TabsContent>

                        <TabsContent value="gallery" className="mt-0">
                            <AdminImages embedded />
                        </TabsContent>

                        <TabsContent value="dataset" className="mt-0">
                            <DatasetView />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

// --- Dataset Tab (research-style browsing: Year → Region → Colony → Species) ---

type GroupBy = "year" | "region" | "colony" | "species";

function DatasetView() {
    const { datasetImages, galleryImages } = usePipeline();
    const [groupBy, setGroupBy] = useState<GroupBy>("region");
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["__all__"]));

    const handleExportCSV = () => {
        const headers = [
            "filename", "species", "all_species", "colony", "geo_region", "survey_year", "survey_date",
            "habitat", "latitude", "longitude", "bird_count", "bird_ci",
            "nest_count", "nest_ci", "source", "ai_model",
        ];
        const rows = datasetImages.map(img => [
            img.fileName,
            img.species || "",
            (img.speciesTags || []).join("; "),
            img.colonyName || "",
            img.geoRegion || "",
            img.surveyYear || "",
            img.surveyDate || "",
            img.habitat || "",
            img.location?.split(",")[0]?.trim() || "",
            img.location?.split(",")[1]?.trim() || "",
            img.aiBirdCount?.split(" ")[0] || "",
            img.aiBirdCount?.match(/\+\/- (\d+)/)?.[1] || "",
            img.aiNestCount?.split(" ")[0] || "",
            img.aiNestCount?.match(/\+\/- (\d+)/)?.[1] || "",
            img.source,
            img.aiModelInfo || "",
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `twi_avian_dataset_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Aggregate stats
    let totalBirds = 0;
    let totalNests = 0;
    const speciesSet = new Set<string>();
    const colonySet = new Set<string>();
    const regionSet = new Set<string>();
    const yearSet = new Set<number>();

    for (const img of datasetImages) {
        if (img.species) speciesSet.add(img.species);
        if (img.colonyName) colonySet.add(img.colonyName);
        if (img.geoRegion) regionSet.add(img.geoRegion);
        if (img.surveyYear) yearSet.add(img.surveyYear);
        totalBirds += img.aiBirdCount ? parseInt(img.aiBirdCount.replace(/,/g, "")) : 0;
        totalNests += img.aiNestCount ? parseInt(img.aiNestCount.replace(/,/g, "")) : 0;
    }

    const unlabeledApproved = galleryImages.filter(i => !i.species).length;

    // Group images by selected dimension
    const grouped: Record<string, typeof datasetImages> = {};
    for (const img of datasetImages) {
        let key: string;
        switch (groupBy) {
            case "year": key = String(img.surveyYear || "Unknown Year"); break;
            case "region": key = img.geoRegion || "Unknown Region"; break;
            case "colony": key = img.colonyName || "Unknown Colony"; break;
            case "species": key = img.species || "Unidentified"; break;
        }
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(img);
    }

    // Sort groups
    const sortedGroups = Object.entries(grouped).sort((a, b) => {
        if (groupBy === "year") return Number(b[0]) - Number(a[0]); // newest first
        return b[1].length - a[1].length; // most images first
    });

    const toggleGroup = (key: string) => {
        const next = new Set(expandedGroups);
        next.has(key) ? next.delete(key) : next.add(key);
        setExpandedGroups(next);
    };

    // Group-level stats
    const groupStats = (images: typeof datasetImages) => {
        let birds = 0, nests = 0;
        const sp = new Set<string>();
        const col = new Set<string>();
        for (const img of images) {
            birds += img.aiBirdCount ? parseInt(img.aiBirdCount.replace(/,/g, "")) : 0;
            nests += img.aiNestCount ? parseInt(img.aiNestCount.replace(/,/g, "")) : 0;
            if (img.species) sp.add(img.species);
            if (img.colonyName) col.add(img.colonyName);
        }
        return { birds, nests, speciesCount: sp.size, colonyCount: col.size };
    };

    const groupByOptions: { value: GroupBy; label: string; icon: typeof Calendar }[] = [
        { value: "region", label: "Region", icon: Globe },
        { value: "colony", label: "Colony", icon: Home },
        { value: "species", label: "Species", icon: Bird },
        { value: "year", label: "Year", icon: Calendar },
    ];

    return (
        <div>
            {/* Summary stats */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
                <div className="p-2.5 rounded-lg border border-border/50 text-center">
                    <p className="text-lg font-bold text-primary">{datasetImages.length}</p>
                    <p className="text-[10px] text-muted-foreground">Images</p>
                </div>
                <div className="p-2.5 rounded-lg border border-border/50 text-center">
                    <p className="text-lg font-bold text-blue-400">{speciesSet.size}</p>
                    <p className="text-[10px] text-muted-foreground">Species</p>
                </div>
                <div className="p-2.5 rounded-lg border border-border/50 text-center">
                    <p className="text-lg font-bold text-green-500">{colonySet.size}</p>
                    <p className="text-[10px] text-muted-foreground">Colonies</p>
                </div>
                <div className="p-2.5 rounded-lg border border-border/50 text-center">
                    <p className="text-lg font-bold text-purple-400">{regionSet.size}</p>
                    <p className="text-[10px] text-muted-foreground">Regions</p>
                </div>
                <div className="p-2.5 rounded-lg border border-border/50 text-center">
                    <p className="text-lg font-bold text-amber-500">{totalBirds.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Birds</p>
                </div>
                <div className="p-2.5 rounded-lg border border-border/50 text-center">
                    <p className="text-lg font-bold text-emerald-500">{totalNests.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Nests</p>
                </div>
            </div>

            {unlabeledApproved > 0 && (
                <div className="flex items-center gap-2 p-2.5 mb-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs">
                    <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>{unlabeledApproved} approved image{unlabeledApproved > 1 ? "s" : ""} still need species labeling before entering the dataset.</span>
                </div>
            )}

            {/* Toolbar: Group By + Export */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mr-1">Browse by</span>
                    {groupByOptions.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => { setGroupBy(opt.value); setExpandedGroups(new Set(["__all__"])); }}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                                groupBy === opt.value
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                        >
                            <opt.icon className="h-3 w-3" />
                            {opt.label}
                        </button>
                    ))}
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportCSV} disabled={datasetImages.length === 0}>
                    <Download className="h-3 w-3" />
                    Export CSV
                </Button>
            </div>

            {/* Grouped data */}
            {datasetImages.length === 0 ? (
                <div className="py-12 text-center">
                    <Database className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No fully labeled images yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                        Approve images in Review, then add species labels in Label tab
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {sortedGroups.map(([groupKey, images]) => {
                        const expanded = expandedGroups.has(groupKey) || expandedGroups.has("__all__");
                        const stats = groupStats(images);

                        return (
                            <div key={groupKey} className="border border-border/50 rounded-lg overflow-hidden">
                                {/* Group header — clickable to expand/collapse */}
                                <button
                                    onClick={() => toggleGroup(groupKey)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
                                >
                                    <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />

                                    {/* Group icon */}
                                    {groupBy === "region" && <Globe className="h-4 w-4 text-purple-400 shrink-0" />}
                                    {groupBy === "colony" && <Home className="h-4 w-4 text-green-500 shrink-0" />}
                                    {groupBy === "species" && <Bird className="h-4 w-4 text-primary shrink-0" />}
                                    {groupBy === "year" && <Calendar className="h-4 w-4 text-amber-500 shrink-0" />}

                                    <span className="text-sm font-medium flex-1">{groupKey}</span>

                                    {/* Inline stats */}
                                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                        <span>{images.length} img</span>
                                        {groupBy !== "species" && stats.speciesCount > 0 && (
                                            <span className="flex items-center gap-0.5"><Bird className="h-2.5 w-2.5" />{stats.speciesCount} sp</span>
                                        )}
                                        {groupBy !== "colony" && stats.colonyCount > 0 && (
                                            <span className="flex items-center gap-0.5"><Home className="h-2.5 w-2.5" />{stats.colonyCount} col</span>
                                        )}
                                        <span className="flex items-center gap-0.5"><Bot className="h-2.5 w-2.5 text-blue-400" />{stats.birds.toLocaleString()} birds</span>
                                        <span>{stats.nests.toLocaleString()} nests</span>
                                    </div>
                                </button>

                                {/* Expanded: image table */}
                                {expanded && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-t border-b border-border/50 text-[10px] text-muted-foreground bg-muted/10">
                                                    <th className="text-left py-1.5 px-3 font-medium">Image</th>
                                                    {groupBy !== "species" && <th className="text-left py-1.5 px-3 font-medium">Species</th>}
                                                    {groupBy !== "colony" && <th className="text-left py-1.5 px-3 font-medium">Colony</th>}
                                                    {groupBy !== "region" && <th className="text-left py-1.5 px-3 font-medium">Region</th>}
                                                    {groupBy !== "year" && <th className="text-left py-1.5 px-3 font-medium">Year</th>}
                                                    <th className="text-right py-1.5 px-3 font-medium">Birds</th>
                                                    <th className="text-right py-1.5 px-3 font-medium">Nests</th>
                                                    <th className="text-left py-1.5 px-3 font-medium">GPS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {images.map(img => (
                                                    <tr key={img.id} className="border-b border-border/20 hover:bg-muted/20">
                                                        <td className="py-1.5 px-3">
                                                            <div className="flex items-center gap-2">
                                                                <img src={img.imageUrl} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
                                                                <span className="text-xs truncate max-w-[120px]">{img.fileName}</span>
                                                            </div>
                                                        </td>
                                                        {groupBy !== "species" && (
                                                            <td className="py-1.5 px-3">
                                                                <Badge variant="secondary" className="gap-0.5 text-[10px] px-1.5 py-0">
                                                                    <Bird className="h-2.5 w-2.5" />{img.species}
                                                                </Badge>
                                                            </td>
                                                        )}
                                                        {groupBy !== "colony" && (
                                                            <td className="py-1.5 px-3 text-xs">{img.colonyName || "—"}</td>
                                                        )}
                                                        {groupBy !== "region" && (
                                                            <td className="py-1.5 px-3 text-xs text-muted-foreground">{img.geoRegion || "—"}</td>
                                                        )}
                                                        {groupBy !== "year" && (
                                                            <td className="py-1.5 px-3 text-xs text-muted-foreground">{img.surveyYear || "—"}</td>
                                                        )}
                                                        <td className="py-1.5 px-3 text-right">
                                                            <span className="flex items-center justify-end gap-0.5 text-xs">
                                                                <Bot className="h-2.5 w-2.5 text-blue-400" />
                                                                {img.aiBirdCount?.split(" ")[0] || "—"}
                                                            </span>
                                                        </td>
                                                        <td className="py-1.5 px-3 text-right">
                                                            <span className="flex items-center justify-end gap-0.5 text-xs">
                                                                {img.aiNestCount?.split(" ")[0] || "—"}
                                                            </span>
                                                        </td>
                                                        <td className="py-1.5 px-3">
                                                            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                                                <MapPin className="h-2.5 w-2.5 shrink-0" />
                                                                <span className="truncate max-w-[90px]">{img.location || "—"}</span>
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
