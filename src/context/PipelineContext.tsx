import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { predictImage, checkSpaceStatus, type PredictionResult } from "@/lib/gradioService";

// --- Types ---

export interface LabeledImage {
    id: string;
    fileName: string;
    imageUrl: string;
    imageFile?: File;
    source: "citizen" | "batch" | "admin";
    submittedBy?: { name: string; email: string };
    submittedAt: Date;

    // AI analysis
    aiStatus: "none" | "running" | "done" | "error";
    aiBirdCount?: string;
    aiNestCount?: string;
    aiVisualization?: string;
    aiModelInfo?: string;

    // Human labels
    species?: string;
    colonyName?: string;
    location?: string;
    notes?: string;

    // Pipeline
    reviewStatus: "pending" | "approved" | "rejected";
    reviewNotes?: string;
    creditAwarded?: number;
}

export interface PipelineContextType {
    images: LabeledImage[];
    addSubmission: (photo: Partial<LabeledImage> & { fileName: string; imageUrl: string }) => void;
    addBatchResults: (results: (Partial<LabeledImage> & { fileName: string; imageUrl: string })[]) => void;
    runAI: (id: string) => Promise<void>;
    updateLabels: (id: string, labels: Partial<LabeledImage>) => void;
    approve: (id: string, notes?: string) => void;
    reject: (id: string, notes?: string) => void;
    pendingImages: LabeledImage[];
    galleryImages: LabeledImage[];
    gradioReady: boolean;
}

// --- Pre-seeded demo data ---

const SEED_IMAGES: LabeledImage[] = [
    {
        id: "seed-1",
        fileName: "aerial_colony_survey_001.jpg",
        imageUrl: "/image_1.png",
        source: "citizen",
        submittedBy: { name: "Sarah Mitchell", email: "sarah.m@example.com" },
        submittedAt: new Date(Date.now() - 3600000 * 2),
        aiStatus: "none",
        species: "Brown Pelican",
        location: "29.2108 N, 89.2620 W",
        notes: "Large nesting colony on east side of island",
        reviewStatus: "pending",
    },
    {
        id: "seed-2",
        fileName: "drone_capture_queen_bess.jpg",
        imageUrl: "/image_2.png",
        source: "citizen",
        submittedBy: { name: "Marcus Chen", email: "mchen@audubon.org" },
        submittedAt: new Date(Date.now() - 3600000 * 5),
        aiStatus: "none",
        species: "Royal Tern",
        location: "29.3142 N, 89.8876 W",
        reviewStatus: "pending",
    },
    {
        id: "seed-3",
        fileName: "raccoon_island_survey_march.jpg",
        imageUrl: "/image_3.png",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000),
        aiStatus: "done",
        aiBirdCount: "312.4 +/- 22.1 (95% CI)",
        aiNestCount: "156.8 +/- 11.3 (95% CI)",
        species: "Laughing Gull",
        colonyName: "Raccoon Island",
        location: "29.0642 N, 90.1577 W",
        reviewStatus: "approved",
    },
    {
        id: "seed-4",
        fileName: "wine_island_aerial_2024.jpg",
        imageUrl: "/image_4.png",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000 * 2),
        aiStatus: "done",
        aiBirdCount: "847.1 +/- 45.6 (95% CI)",
        aiNestCount: "423.5 +/- 28.9 (95% CI)",
        colonyName: "Wine Island",
        reviewStatus: "approved",
    },
];

// --- Context ---

const PipelineContext = createContext<PipelineContextType | null>(null);

export function PipelineProvider({ children }: { children: ReactNode }) {
    const [images, setImages] = useState<LabeledImage[]>(SEED_IMAGES);
    const [gradioReady, setGradioReady] = useState(false);

    // Warm up the Gradio client on mount
    useEffect(() => {
        checkSpaceStatus().then(setGradioReady);
    }, []);

    const addSubmission = useCallback((photo: Partial<LabeledImage> & { fileName: string; imageUrl: string }) => {
        const entry: LabeledImage = {
            id: crypto.randomUUID(),
            source: "citizen",
            submittedAt: new Date(),
            aiStatus: "none",
            reviewStatus: "pending",
            ...photo,
        };
        setImages(prev => [entry, ...prev]);
    }, []);

    const addBatchResults = useCallback((results: (Partial<LabeledImage> & { fileName: string; imageUrl: string })[]) => {
        const entries: LabeledImage[] = results.map(r => ({
            id: crypto.randomUUID(),
            source: "batch" as const,
            submittedAt: new Date(),
            aiStatus: "done" as const,
            reviewStatus: "approved" as const,
            ...r,
        }));
        setImages(prev => [...entries, ...prev]);
    }, []);

    const runAI = useCallback(async (id: string) => {
        setImages(prev => prev.map(img =>
            img.id === id ? { ...img, aiStatus: "running" as const } : img
        ));

        const img = images.find(i => i.id === id);
        if (!img) return;

        try {
            let result: PredictionResult;

            if (img.imageFile) {
                result = await predictImage(img.imageFile);
            } else if (img.imageUrl && !img.imageUrl.startsWith("blob:")) {
                // For seeded images, fetch the static file and send to model
                const resp = await fetch(img.imageUrl);
                const blob = await resp.blob();
                result = await predictImage(blob);
            } else {
                throw new Error("No image file available for AI analysis");
            }

            setImages(prev => prev.map(i =>
                i.id === id ? {
                    ...i,
                    aiStatus: "done" as const,
                    aiBirdCount: result.birdCount,
                    aiNestCount: result.nestCount,
                    aiVisualization: result.visualization,
                    aiModelInfo: result.modelInfo,
                } : i
            ));
        } catch {
            setImages(prev => prev.map(i =>
                i.id === id ? { ...i, aiStatus: "error" as const } : i
            ));
        }
    }, [images]);

    const updateLabels = useCallback((id: string, labels: Partial<LabeledImage>) => {
        setImages(prev => prev.map(img =>
            img.id === id ? { ...img, ...labels } : img
        ));
    }, []);

    const approve = useCallback((id: string, notes?: string) => {
        setImages(prev => prev.map(img =>
            img.id === id ? { ...img, reviewStatus: "approved" as const, reviewNotes: notes, creditAwarded: 10 } : img
        ));
    }, []);

    const reject = useCallback((id: string, notes?: string) => {
        setImages(prev => prev.map(img =>
            img.id === id ? { ...img, reviewStatus: "rejected" as const, reviewNotes: notes } : img
        ));
    }, []);

    const pendingImages = useMemo(() => images.filter(i => i.reviewStatus === "pending"), [images]);
    const galleryImages = useMemo(() => images.filter(i => i.reviewStatus === "approved"), [images]);

    const value = useMemo<PipelineContextType>(() => ({
        images, addSubmission, addBatchResults, runAI, updateLabels, approve, reject,
        pendingImages, galleryImages, gradioReady,
    }), [images, addSubmission, addBatchResults, runAI, updateLabels, approve, reject, pendingImages, galleryImages, gradioReady]);

    return <PipelineContext.Provider value={value}>{children}</PipelineContext.Provider>;
}

export function usePipeline(): PipelineContextType {
    const ctx = useContext(PipelineContext);
    if (!ctx) throw new Error("usePipeline must be used within PipelineProvider");
    return ctx;
}
