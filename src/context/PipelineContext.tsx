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
    species?: string;              // primary/dominant species
    speciesTags?: string[];        // all species observed in this image
    colonyName?: string;
    location?: string;
    notes?: string;

    // Research metadata (matches TWI schema)
    surveyYear?: number;
    geoRegion?: string;        // e.g., "Terrebonne Bay", "Barataria Bay"
    habitat?: string;          // e.g., "Barrier Island", "Marsh Island"
    surveyDate?: string;       // e.g., "2018-May-21"

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
    datasetImages: LabeledImage[];
    gradioReady: boolean;
}

// --- Pre-seeded demo data ---
// Based on real TWI (The Water Institute) Louisiana Coastal Wildlife Monitoring Program
// Real colony names, GPS coordinates, species codes, and survey filename patterns

const SEED_IMAGES: LabeledImage[] = [
    // === PENDING citizen submissions (visible in Review tab, waiting for admin) ===
    {
        id: "seed-p1",
        fileName: "18May24Camera1-Card1-0412.jpg",
        imageUrl: "/image_1.png",
        source: "citizen",
        submittedBy: { name: "Sarah Mitchell", email: "sarah.m@audubon.org" },
        submittedAt: new Date(Date.now() - 1800000),
        aiStatus: "none",
        species: "Brown Pelican",
        location: "29.8494 N, 93.3830 W",
        notes: "Rabbit Island BRPE colony, Sabine-Calcasieu region — morning survey",
        reviewStatus: "pending",
    },
    {
        id: "seed-p2",
        fileName: "19May24Camera2-Card1-0887.jpg",
        imageUrl: "/image_2.png",
        source: "citizen",
        submittedBy: { name: "Marcus Chen", email: "mchen@thewaterinstitute.org" },
        submittedAt: new Date(Date.now() - 3600000),
        aiStatus: "none",
        species: "Royal Tern",
        location: "29.3043 N, 89.9592 W",
        notes: "Queen Bess Island ROYT colony, Barataria Bay — mixed with LAGU",
        reviewStatus: "pending",
    },
    {
        id: "seed-p3",
        fileName: "20May24Camera1-Card2-0156.jpg",
        imageUrl: "/image_5.png",
        source: "citizen",
        submittedBy: { name: "Emily Rodriguez", email: "emily.r@gmail.com" },
        submittedAt: new Date(Date.now() - 5400000),
        aiStatus: "none",
        location: "29.0948 N, 90.6108 W",
        notes: "Wine Island, Terrebonne Bay — unknown species, need help identifying",
        reviewStatus: "pending",
    },
    {
        id: "seed-p4",
        fileName: "20May24Camera2-Card1-0293.jpg",
        imageUrl: "/image_6.png",
        source: "citizen",
        submittedBy: { name: "James Wilson", email: "jwilson@fieldwork.com" },
        submittedAt: new Date(Date.now() - 7200000),
        aiStatus: "none",
        location: "29.2558 N, 90.4400 W",
        notes: "Felicity Island, Terrebonne Bay",
        reviewStatus: "pending",
    },

    // === APPROVED + AI analyzed, but NOT YET human-labeled (Gallery → "Needs Label") ===
    {
        id: "seed-a1",
        fileName: "21May18Camera2-Card1-7006.jpg",
        imageUrl: "/image_3.png",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000),
        aiStatus: "done",
        aiBirdCount: "324 +/- 26 (95% CI)",
        aiNestCount: "241 +/- 19 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        location: "29.0505 N, 90.9266 W",
        notes: "Raccoon Island, Terrebonne Bay",
        surveyYear: 2018,
        geoRegion: "Terrebonne Bay",
        habitat: "Barrier Island",
        surveyDate: "2018-May-21",
        reviewStatus: "approved",
        reviewNotes: "Good aerial capture — matches typical Raccoon Island counts",
    },
    {
        id: "seed-a2",
        fileName: "19May18Camera2-Card1-01358.jpg",
        imageUrl: "/image_4.png",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000 * 1.5),
        aiStatus: "done",
        aiBirdCount: "96 +/- 8 (95% CI)",
        aiNestCount: "63 +/- 5 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        location: "29.7200 N, 89.5500 W",
        notes: "Dry Bread Island, Biloxi North",
        surveyYear: 2018,
        geoRegion: "Biloxi North",
        habitat: "Marsh Island",
        surveyDate: "2018-May-19",
        reviewStatus: "approved",
        reviewNotes: "Verified — consistent with historical counts",
    },
    {
        id: "seed-a3",
        fileName: "20May18Camera2-Card1-4401.jpg",
        imageUrl: "/image_1.png",
        source: "citizen",
        submittedBy: { name: "Lisa Park", email: "lisa.park@volunteer.org" },
        submittedAt: new Date(Date.now() - 86400000 * 2),
        aiStatus: "done",
        aiBirdCount: "226 +/- 18 (95% CI)",
        aiNestCount: "173 +/- 14 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        location: "29.3043 N, 89.9592 W",
        notes: "Queen Bess Island, Barataria Bay",
        surveyYear: 2018,
        geoRegion: "Barataria Bay",
        habitat: "Barrier Island",
        surveyDate: "2018-May-20",
        reviewStatus: "approved",
        creditAwarded: 10,
        reviewNotes: "Excellent citizen submission",
    },

    // === FULLY LABELED (approved + AI done + species/colony → Dataset ready) ===
    {
        id: "seed-d1",
        fileName: "21May18Camera1-Card1-4559.jpg",
        imageUrl: "/image_2.png",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000 * 5),
        aiStatus: "done",
        aiBirdCount: "196 +/- 16 (95% CI)",
        aiNestCount: "139 +/- 11 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        species: "Brown Pelican",
        speciesTags: ["Brown Pelican", "Laughing Gull", "Royal Tern"],
        colonyName: "Rabbit Island",
        location: "29.8494 N, 93.3830 W",
        notes: "Sabine-Calcasieu region — BRPE primary nesting site, mixed colony with LAGU and ROYT",
        surveyYear: 2018,
        geoRegion: "Sabine-Calcasieu",
        habitat: "Barrier Island",
        surveyDate: "2018-May-21",
        reviewStatus: "approved",
        reviewNotes: "Verified by Dr. Martinez",
    },
    {
        id: "seed-d2",
        fileName: "20May18Camera1-Card1-3892.jpg",
        imageUrl: "/image_5.png",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000 * 5),
        aiStatus: "done",
        aiBirdCount: "226 +/- 18 (95% CI)",
        aiNestCount: "173 +/- 14 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        species: "Royal Tern",
        speciesTags: ["Royal Tern", "Brown Pelican", "Laughing Gull", "Sandwich Tern"],
        colonyName: "Queen Bess Island",
        location: "29.3043 N, 89.9592 W",
        notes: "Barataria Bay — ROYT restoration site with BRPE, LAGU, SATE present",
        surveyYear: 2018,
        geoRegion: "Barataria Bay",
        habitat: "Barrier Island",
        surveyDate: "2018-May-20",
        reviewStatus: "approved",
        reviewNotes: "Key monitoring site — flag for quarterly comparison",
    },
    {
        id: "seed-d3",
        fileName: "21May18Camera2-Card1-6904.jpg",
        imageUrl: "/image_6.png",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000 * 7),
        aiStatus: "done",
        aiBirdCount: "467 +/- 37 (95% CI)",
        aiNestCount: "328 +/- 26 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        species: "Roseate Spoonbill",
        speciesTags: ["Roseate Spoonbill", "Snowy Egret", "Tricolored Heron", "White Ibis"],
        colonyName: "Raccoon Island",
        location: "29.0505 N, 90.9266 W",
        notes: "Terrebonne Bay — ROSP colony with SNEG, TRHE, WHIB. Stable mixed-species nesting.",
        surveyYear: 2018,
        geoRegion: "Terrebonne Bay",
        habitat: "Barrier Island",
        surveyDate: "2018-May-21",
        reviewStatus: "approved",
    },
    {
        id: "seed-d4",
        fileName: "18May18Camera1-Card1-2847.jpg",
        imageUrl: "/image_3.png",
        source: "admin",
        submittedAt: new Date(Date.now() - 86400000 * 10),
        aiStatus: "done",
        aiBirdCount: "1,169 +/- 94 (95% CI)",
        aiNestCount: "1,136 +/- 91 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        species: "Laughing Gull",
        speciesTags: ["Laughing Gull", "Royal Tern", "Black Skimmer"],
        colonyName: "Breton Island",
        location: "29.4955 N, 89.1742 W",
        notes: "Breton-Chandeleur Islands — LAGU largest colony with ROYT and BLSK ground-nesting",
        surveyYear: 2018,
        geoRegion: "Breton-Chandeleur Islands",
        habitat: "Barrier Island",
        surveyDate: "2018-May-18",
        reviewStatus: "approved",
    },
    {
        id: "seed-d5",
        fileName: "19May18Camera1-Card1-0774.jpg",
        imageUrl: "/image_4.png",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000 * 12),
        aiStatus: "done",
        aiBirdCount: "699 +/- 56 (95% CI)",
        aiNestCount: "570 +/- 46 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        species: "Tricolored Heron",
        speciesTags: ["Tricolored Heron", "Great Egret", "Snowy Egret"],
        colonyName: "Felicity Island",
        location: "29.2558 N, 90.4400 W",
        notes: "Terrebonne Bay — TRHE colony with GREG and SNEG, peak nesting season",
        surveyYear: 2018,
        geoRegion: "Terrebonne Bay",
        habitat: "Barrier Island",
        surveyDate: "2018-May-19",
        reviewStatus: "approved",
    },

    // === REJECTED submission ===
    {
        id: "seed-r1",
        fileName: "citizen_blurry_upload.jpg",
        imageUrl: "/image_1.png",
        source: "citizen",
        submittedBy: { name: "Tom Baker", email: "tbaker@email.com" },
        submittedAt: new Date(Date.now() - 172800000),
        aiStatus: "none",
        reviewStatus: "rejected",
        reviewNotes: "Image too blurry for identification. Please resubmit a clearer photo.",
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
    // Dataset = approved + AI done + species assigned (fully labeled)
    const datasetImages = useMemo(() =>
        images.filter(i => i.reviewStatus === "approved" && i.aiStatus === "done" && i.species),
    [images]);

    const value = useMemo<PipelineContextType>(() => ({
        images, addSubmission, addBatchResults, runAI, updateLabels, approve, reject,
        pendingImages, galleryImages, datasetImages, gradioReady,
    }), [images, addSubmission, addBatchResults, runAI, updateLabels, approve, reject, pendingImages, galleryImages, datasetImages, gradioReady]);

    return <PipelineContext.Provider value={value}>{children}</PipelineContext.Provider>;
}

export function usePipeline(): PipelineContextType {
    const ctx = useContext(PipelineContext);
    if (!ctx) throw new Error("usePipeline must be used within PipelineProvider");
    return ctx;
}
