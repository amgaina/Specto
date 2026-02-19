import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { predictImage, checkSpaceStatus, type PredictionResult } from "@/lib/gradioService";

// --- Types ---

export type AnnotationType = "bird" | "nest" | "boundary";

export interface ImageAnnotation {
    id: string;
    type: AnnotationType;
    species: string;
    // Bounding box (0-1 relative coordinates)
    x: number;
    y: number;
    w: number;
    h: number;
    confidence?: number;
    note?: string;
}

// Distinct colors per species — consistent across the entire app
export const SPECIES_COLORS: Record<string, string> = {
    "Brown Pelican":             "#e74c3c", // red
    "Laughing Gull":             "#3498db", // blue
    "Royal Tern":                "#f39c12", // orange
    "Roseate Spoonbill":         "#e91e90", // hot pink
    "Snowy Egret":               "#ecf0f1", // off-white
    "Tricolored Heron":          "#9b59b6", // purple
    "White Ibis":                "#1abc9c", // teal
    "Great Egret":               "#f1c40f", // yellow
    "Black Skimmer":             "#2c3e50", // dark navy
    "Forster's Tern":            "#e67e22", // dark orange
    "Black-crowned Night-Heron": "#8e44ad", // deep purple
    "Sandwich Tern":             "#27ae60", // green
};

export function getSpeciesColor(species: string): string {
    return SPECIES_COLORS[species] || "#95a5a6";
}

// Distinct colors for annotation types
export const ANNOTATION_TYPE_STYLES: Record<AnnotationType, { label: string; borderStyle: string }> = {
    bird:     { label: "Bird",     borderStyle: "solid" },
    nest:     { label: "Nest",     borderStyle: "dashed" },
    boundary: { label: "Boundary", borderStyle: "dotted" },
};

export interface LabeledImage {
    id: string;
    fileName: string;
    imageUrl: string;
    labeledImageUrl?: string;  // TWI dotted/labeled screenshot from S3
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
    annotations?: ImageAnnotation[]; // bounding boxes, points, boundaries

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
    // Real counts from all_annotations.csv: 21May18Camera2-Card1-7006.jpg → 63 birds, 13 nests, Raccoon Island
    {
        id: "seed-a1",
        fileName: "21May18Camera2-Card1-7006.jpg",
        imageUrl: "/image_3.png",
        labeledImageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/screenshots/2018/Terrebonne%20Bay/Raccoon%20Island/21May18Camera2-Card1-7006.jpg",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000),
        aiStatus: "done",
        aiBirdCount: "63 +/- 5 (95% CI)",
        aiNestCount: "13 +/- 2 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        location: "29.0596 N, 90.9416 W",
        notes: "Raccoon Island, Terrebonne Bay — LAGU + BRPE observed",
        surveyYear: 2018,
        geoRegion: "Terrebonne Bay",
        habitat: "Barrier Island",
        surveyDate: "2018-May-21",
        reviewStatus: "approved",
        reviewNotes: "Good aerial capture — matches dotted screenshot counts",
    },
    // Real counts: 19May18Camera2-Card1-01358.jpg → 119 birds, 84 nests, Dry Bread Island
    {
        id: "seed-a2",
        fileName: "19May18Camera2-Card1-01358.jpg",
        imageUrl: "/image_4.png",
        labeledImageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/screenshots/2018/Biloxi%20North/Dry%20Bread%20Island/19May18Camera2-Card1-01358.jpg",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000 * 1.5),
        aiStatus: "done",
        aiBirdCount: "119 +/- 10 (95% CI)",
        aiNestCount: "84 +/- 7 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        location: "29.8426 N, 89.3064 W",
        notes: "Dry Bread Island, Biloxi North — LAGU only colony",
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
    // Real counts: 21May18Camera1-Card1-4559.jpg → 98 birds, 80 nests, Rabbit Island
    // Real species: LAGU (12 nests), TRHE (52 nests), FOTE (32 nests), SNEG (2 nests)
    {
        id: "seed-d1",
        fileName: "21May18Camera1-Card1-4559.jpg",
        imageUrl: "/image_2.png",
        labeledImageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/screenshots/2018/Sabine-Calcasieu/Rabbit%20Island/21May18Camera1-Card1-4559.jpg",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000 * 5),
        aiStatus: "done",
        aiBirdCount: "98 +/- 8 (95% CI)",
        aiNestCount: "80 +/- 6 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        species: "Tricolored Heron",
        speciesTags: ["Tricolored Heron", "Forster's Tern", "Laughing Gull", "Snowy Egret"],
        colonyName: "Rabbit Island",
        location: "29.8494 N, 93.3830 W",
        notes: "Sabine-Calcasieu region — TRHE dominant (52 nests), FOTE (32), LAGU (12), SNEG (2)",
        annotations: [
            { id: "a1-1", type: "boundary", species: "Tricolored Heron", x: 0.05, y: 0.08, w: 0.55, h: 0.50, note: "TRHE primary colony — 52 nests" },
            { id: "a1-2", type: "bird", species: "Tricolored Heron", x: 0.15, y: 0.20, w: 0.05, h: 0.05, confidence: 0.97 },
            { id: "a1-3", type: "bird", species: "Tricolored Heron", x: 0.30, y: 0.25, w: 0.05, h: 0.05, confidence: 0.94 },
            { id: "a1-4", type: "nest", species: "Tricolored Heron", x: 0.22, y: 0.35, w: 0.06, h: 0.05, confidence: 0.91 },
            { id: "a1-5", type: "boundary", species: "Forster's Tern", x: 0.55, y: 0.10, w: 0.40, h: 0.35, note: "FOTE nesting area — 32 nests" },
            { id: "a1-6", type: "bird", species: "Forster's Tern", x: 0.65, y: 0.18, w: 0.04, h: 0.04, confidence: 0.92 },
            { id: "a1-7", type: "nest", species: "Forster's Tern", x: 0.60, y: 0.28, w: 0.05, h: 0.04, confidence: 0.85 },
            { id: "a1-8", type: "boundary", species: "Laughing Gull", x: 0.15, y: 0.55, w: 0.45, h: 0.35, note: "LAGU sub-colony — 12 nests" },
            { id: "a1-9", type: "bird", species: "Laughing Gull", x: 0.30, y: 0.65, w: 0.04, h: 0.04, confidence: 0.89 },
            { id: "a1-10", type: "bird", species: "Snowy Egret", x: 0.70, y: 0.55, w: 0.04, h: 0.04, confidence: 0.86, note: "SNEG — 2 nests" },
        ],
        surveyYear: 2018,
        geoRegion: "Sabine-Calcasieu",
        habitat: "Barrier Island",
        surveyDate: "2018-May-21",
        reviewStatus: "approved",
        reviewNotes: "Verified — matches TWI dotted screenshot counts",
    },
    // Real counts: 20May18Camera1-Card1-3613.jpg → 3,586 birds, 3,578 nests, Breton Island
    // Real species: LAGU, ROYT, SATE
    {
        id: "seed-d2",
        fileName: "20May18Camera1-Card1-3613.jpg",
        imageUrl: "/image_5.png",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000 * 5),
        aiStatus: "done",
        aiBirdCount: "3,586 +/- 287 (95% CI)",
        aiNestCount: "3,578 +/- 286 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        species: "Laughing Gull",
        speciesTags: ["Laughing Gull", "Royal Tern", "Sandwich Tern"],
        colonyName: "Breton Island",
        location: "29.4955 N, 89.1742 W",
        notes: "Breton-Chandeleur Islands — LAGU mega-colony with ROYT and SATE ground-nesting",
        annotations: [
            { id: "a2-1", type: "boundary", species: "Laughing Gull", x: 0.05, y: 0.05, w: 0.70, h: 0.55, note: "LAGU mega-colony — ~3,000 nesting pairs" },
            { id: "a2-2", type: "bird", species: "Laughing Gull", x: 0.20, y: 0.15, w: 0.03, h: 0.03, confidence: 0.96 },
            { id: "a2-3", type: "bird", species: "Laughing Gull", x: 0.40, y: 0.22, w: 0.03, h: 0.03, confidence: 0.94 },
            { id: "a2-4", type: "nest", species: "Laughing Gull", x: 0.30, y: 0.30, w: 0.04, h: 0.04, confidence: 0.91 },
            { id: "a2-5", type: "nest", species: "Laughing Gull", x: 0.50, y: 0.25, w: 0.04, h: 0.04, confidence: 0.89 },
            { id: "a2-6", type: "boundary", species: "Royal Tern", x: 0.65, y: 0.50, w: 0.30, h: 0.30, note: "ROYT sub-colony" },
            { id: "a2-7", type: "bird", species: "Royal Tern", x: 0.75, y: 0.58, w: 0.04, h: 0.04, confidence: 0.92 },
            { id: "a2-8", type: "boundary", species: "Sandwich Tern", x: 0.05, y: 0.60, w: 0.45, h: 0.32, note: "SATE nesting strip" },
            { id: "a2-9", type: "bird", species: "Sandwich Tern", x: 0.18, y: 0.68, w: 0.04, h: 0.03, confidence: 0.87 },
        ],
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
        labeledImageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/screenshots/2018/Terrebonne%20Bay/Raccoon%20Island/21May18Camera2-Card1-6904.jpg",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000 * 7),
        aiStatus: "done",
        aiBirdCount: "467 +/- 37 (95% CI)",
        aiNestCount: "328 +/- 26 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        // Real species for 21May18Camera2-Card1-6904: LAGU (217 nests), BRPE (249 nests), GREG (1 nest)
        species: "Brown Pelican",
        speciesTags: ["Brown Pelican", "Laughing Gull", "Great Egret"],
        colonyName: "Raccoon Island",
        location: "29.0596 N, 90.9416 W",
        notes: "Terrebonne Bay — BRPE (249 nests) + LAGU (217 nests) + GREG. Dense mixed colony.",
        annotations: [
            { id: "a3-1", type: "boundary", species: "Brown Pelican", x: 0.08, y: 0.10, w: 0.45, h: 0.45, note: "BRPE nesting colony — 249 nests" },
            { id: "a3-2", type: "bird", species: "Brown Pelican", x: 0.18, y: 0.22, w: 0.06, h: 0.06, confidence: 0.97 },
            { id: "a3-3", type: "bird", species: "Brown Pelican", x: 0.32, y: 0.30, w: 0.06, h: 0.06, confidence: 0.95 },
            { id: "a3-4", type: "nest", species: "Brown Pelican", x: 0.25, y: 0.40, w: 0.06, h: 0.05, confidence: 0.92 },
            { id: "a3-5", type: "boundary", species: "Laughing Gull", x: 0.50, y: 0.05, w: 0.45, h: 0.45, note: "LAGU colony — 217 nests" },
            { id: "a3-6", type: "bird", species: "Laughing Gull", x: 0.62, y: 0.15, w: 0.03, h: 0.03, confidence: 0.93 },
            { id: "a3-7", type: "bird", species: "Laughing Gull", x: 0.72, y: 0.22, w: 0.03, h: 0.03, confidence: 0.91 },
            { id: "a3-8", type: "nest", species: "Laughing Gull", x: 0.68, y: 0.30, w: 0.04, h: 0.04, confidence: 0.88 },
            { id: "a3-9", type: "bird", species: "Great Egret", x: 0.22, y: 0.65, w: 0.05, h: 0.06, confidence: 0.89, note: "GREG — 1 nest" },
        ],
        surveyYear: 2018,
        geoRegion: "Terrebonne Bay",
        habitat: "Barrier Island",
        surveyDate: "2018-May-21",
        reviewStatus: "approved",
    },
    // Real counts: 21May18Camera2-Card1-8273.jpg → 699 birds, 570 nests, Felicity Island
    // Real species: TRHE, BRPE, LAGU, SNEG, BCNH
    {
        id: "seed-d4",
        fileName: "21May18Camera2-Card1-8273.jpg",
        imageUrl: "/image_3.png",
        labeledImageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/screenshots/2018/Terrebonne%20Bay/Felicity%20Island/21May18Camera2-Card1-8273.jpg",
        source: "admin",
        submittedAt: new Date(Date.now() - 86400000 * 10),
        aiStatus: "done",
        aiBirdCount: "699 +/- 56 (95% CI)",
        aiNestCount: "570 +/- 46 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        species: "Tricolored Heron",
        speciesTags: ["Tricolored Heron", "Brown Pelican", "Laughing Gull", "Snowy Egret", "Black-crowned Night-Heron"],
        colonyName: "Felicity Island",
        location: "29.2558 N, 90.4400 W",
        notes: "Terrebonne Bay — TRHE + BRPE + LAGU + SNEG + BCNH. Dense 5-species mixed colony.",
        annotations: [
            { id: "a4-1", type: "boundary", species: "Tricolored Heron", x: 0.05, y: 0.05, w: 0.45, h: 0.45, note: "TRHE primary nesting area" },
            { id: "a4-2", type: "bird", species: "Tricolored Heron", x: 0.15, y: 0.15, w: 0.04, h: 0.05, confidence: 0.96 },
            { id: "a4-3", type: "bird", species: "Tricolored Heron", x: 0.35, y: 0.22, w: 0.04, h: 0.05, confidence: 0.94 },
            { id: "a4-4", type: "nest", species: "Tricolored Heron", x: 0.25, y: 0.32, w: 0.05, h: 0.04, confidence: 0.90 },
            { id: "a4-5", type: "boundary", species: "Brown Pelican", x: 0.50, y: 0.08, w: 0.45, h: 0.40, note: "BRPE colony section" },
            { id: "a4-6", type: "bird", species: "Brown Pelican", x: 0.65, y: 0.18, w: 0.06, h: 0.06, confidence: 0.95 },
            { id: "a4-7", type: "nest", species: "Brown Pelican", x: 0.72, y: 0.30, w: 0.06, h: 0.05, confidence: 0.88 },
            { id: "a4-8", type: "boundary", species: "Laughing Gull", x: 0.05, y: 0.55, w: 0.40, h: 0.35, note: "LAGU ground-nesting" },
            { id: "a4-9", type: "bird", species: "Laughing Gull", x: 0.18, y: 0.65, w: 0.03, h: 0.03, confidence: 0.92 },
            { id: "a4-10", type: "bird", species: "Snowy Egret", x: 0.55, y: 0.62, w: 0.04, h: 0.04, confidence: 0.89 },
            { id: "a4-11", type: "bird", species: "Black-crowned Night-Heron", x: 0.75, y: 0.65, w: 0.04, h: 0.04, confidence: 0.85 },
        ],
        surveyYear: 2018,
        geoRegion: "Terrebonne Bay",
        habitat: "Barrier Island",
        surveyDate: "2018-May-21",
        reviewStatus: "approved",
    },
    {
        id: "seed-d5",
        fileName: "19May18Camera1-Card1-0774.jpg",
        imageUrl: "/image_4.png",
        labeledImageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/screenshots/2018/Biloxi%20North/Brush%20Island/19May18Camera1-Card1-0774.jpg",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000 * 12),
        aiStatus: "done",
        aiBirdCount: "699 +/- 56 (95% CI)",
        aiNestCount: "570 +/- 46 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        // Real species for 19May18Camera1-Card1-0774: LAGU (20 nests), ROYT (6 nests), SATE (2 nests)
        species: "Laughing Gull",
        speciesTags: ["Laughing Gull", "Royal Tern", "Sandwich Tern"],
        colonyName: "Brush Island",
        location: "30.0340 N, 89.1863 W",
        notes: "Biloxi North — LAGU (20 nests), ROYT (6 nests), SATE (2 nests). Small mixed colony.",
        annotations: [
            { id: "a5-1", type: "boundary", species: "Laughing Gull", x: 0.10, y: 0.10, w: 0.50, h: 0.45, note: "LAGU colony — 20 nests" },
            { id: "a5-2", type: "bird", species: "Laughing Gull", x: 0.22, y: 0.20, w: 0.03, h: 0.03, confidence: 0.95 },
            { id: "a5-3", type: "bird", species: "Laughing Gull", x: 0.38, y: 0.28, w: 0.03, h: 0.03, confidence: 0.93 },
            { id: "a5-4", type: "nest", species: "Laughing Gull", x: 0.30, y: 0.35, w: 0.04, h: 0.04, confidence: 0.90 },
            { id: "a5-5", type: "boundary", species: "Royal Tern", x: 0.55, y: 0.15, w: 0.35, h: 0.35, note: "ROYT group — 6 nests" },
            { id: "a5-6", type: "bird", species: "Royal Tern", x: 0.65, y: 0.25, w: 0.04, h: 0.04, confidence: 0.92 },
            { id: "a5-7", type: "nest", species: "Royal Tern", x: 0.70, y: 0.35, w: 0.05, h: 0.04, confidence: 0.88 },
            { id: "a5-8", type: "bird", species: "Sandwich Tern", x: 0.30, y: 0.65, w: 0.04, h: 0.03, confidence: 0.86, note: "SATE — 2 nests" },
        ],
        surveyYear: 2018,
        geoRegion: "Biloxi North",
        habitat: "Marsh Island",
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
