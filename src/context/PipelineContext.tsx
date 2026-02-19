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
    // CSV: 21May18Camera2-Card1-7006 → Raccoon Island, Terrebonne Bay — LAGU 62 birds/13 nests + BRPE 1 bird/0 nests
    {
        id: "seed-a1",
        fileName: "21May18Camera2-Card1-7006.jpg",
        imageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/high_resolution_photos/2018/Terrebonne%20Bay/Raccoon%20Island/21May18Camera2-Card1-7006.jpg",
        labeledImageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/screenshots/2018/Terrebonne%20Bay/Raccoon%20Island/21May18Camera2-Card1-7006.jpg",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000),
        aiStatus: "done",
        aiBirdCount: "63 +/- 5 (95% CI)",
        aiNestCount: "13 +/- 2 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        location: "29.0505 N, 90.9266 W",
        notes: "Raccoon Island, Terrebonne Bay — LAGU (62 birds, 13 nests) + BRPE (1 bird)",
        surveyYear: 2018,
        geoRegion: "Terrebonne Bay",
        habitat: "Barrier Island",
        surveyDate: "2018-May-21",
        reviewStatus: "approved",
        reviewNotes: "Good aerial capture — matches dotted screenshot counts",
    },
    // CSV: 19May18Camera2-Card1-01358 → Dry Bread Island, Biloxi North — LAGU 119 birds/84 nests
    {
        id: "seed-a2",
        fileName: "19May18Camera2-Card1-01358.jpg",
        imageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/high_resolution_photos/2018/Biloxi%20North/Dry%20Bread%20Island/19May18Camera2-Card1-01358.jpg",
        labeledImageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/screenshots/2018/Biloxi%20North/Dry%20Bread%20Island/19May18Camera2-Card1-01358.jpg",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000 * 1.5),
        aiStatus: "done",
        aiBirdCount: "119 +/- 10 (95% CI)",
        aiNestCount: "84 +/- 7 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        location: "29.8426 N, 89.3064 W",
        notes: "Dry Bread Island, Biloxi North — LAGU only colony (119 birds, 84 nests)",
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
    // CSV: 21May18Camera1-Card1-4559 → Rabbit Island, Sabine-Calcasieu
    // TRHE: 52 birds/48 nests, FOTE: 32 birds/21 nests, LAGU: 12 birds/10 nests, SNEG: 2 birds/1 nest
    {
        id: "seed-d1",
        fileName: "21May18Camera1-Card1-4559.jpg",
        imageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/high_resolution_photos/2018/Sabine-Calcasieu/Rabbit%20Island/21May18Camera1-Card1-4559.jpg",
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
        notes: "Sabine-Calcasieu — TRHE (52 birds, 48 nests), FOTE (32/21), LAGU (12/10), SNEG (2/1)",
        annotations: [
            { id: "a1-1", type: "boundary", species: "Tricolored Heron", x: 0.05, y: 0.08, w: 0.55, h: 0.50, note: "TRHE primary colony — 48 nests" },
            { id: "a1-2", type: "bird", species: "Tricolored Heron", x: 0.15, y: 0.20, w: 0.05, h: 0.05, confidence: 0.97 },
            { id: "a1-3", type: "bird", species: "Tricolored Heron", x: 0.30, y: 0.25, w: 0.05, h: 0.05, confidence: 0.94 },
            { id: "a1-4", type: "nest", species: "Tricolored Heron", x: 0.22, y: 0.35, w: 0.06, h: 0.05, confidence: 0.91 },
            { id: "a1-5", type: "boundary", species: "Forster's Tern", x: 0.55, y: 0.10, w: 0.40, h: 0.35, note: "FOTE nesting area — 21 nests" },
            { id: "a1-6", type: "bird", species: "Forster's Tern", x: 0.65, y: 0.18, w: 0.04, h: 0.04, confidence: 0.92 },
            { id: "a1-7", type: "nest", species: "Forster's Tern", x: 0.60, y: 0.28, w: 0.05, h: 0.04, confidence: 0.85 },
            { id: "a1-8", type: "boundary", species: "Laughing Gull", x: 0.15, y: 0.55, w: 0.45, h: 0.35, note: "LAGU sub-colony — 10 nests" },
            { id: "a1-9", type: "bird", species: "Laughing Gull", x: 0.30, y: 0.65, w: 0.04, h: 0.04, confidence: 0.89 },
            { id: "a1-10", type: "bird", species: "Snowy Egret", x: 0.70, y: 0.55, w: 0.04, h: 0.04, confidence: 0.86, note: "SNEG — 1 nest" },
        ],
        surveyYear: 2018,
        geoRegion: "Sabine-Calcasieu",
        habitat: "Barrier Island",
        surveyDate: "2018-May-21",
        reviewStatus: "approved",
        reviewNotes: "Verified — matches TWI dotted screenshot counts",
    },
    // CSV: 20May18Camera1-Card1-3613 → Breton Island, Breton-Chandeleur Islands
    // ROYT: 2,226 birds/2,225 nests, SATE: 1,334 birds/1,334 nests, LAGU: 26 birds/19 nests
    {
        id: "seed-d2",
        fileName: "20May18Camera1-Card1-3613.jpg",
        imageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/high_resolution_photos/2018/Breton-Chandeleur%20Islands/Breton%20Island/20May18Camera1-Card1-3613.jpg",
        labeledImageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/screenshots/2018/Breton-Chandeleur%20Islands/Breton%20Island/20May18Camera1-Card1-3613.jpg",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000 * 5),
        aiStatus: "done",
        aiBirdCount: "3,586 +/- 287 (95% CI)",
        aiNestCount: "3,578 +/- 286 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        species: "Royal Tern",
        speciesTags: ["Royal Tern", "Sandwich Tern", "Laughing Gull"],
        colonyName: "Breton Island",
        location: "29.4955 N, 89.1742 W",
        notes: "Breton-Chandeleur Islands — ROYT dominant (2,226 birds, 2,225 nests), SATE (1,334/1,334), LAGU (26/19)",
        annotations: [
            { id: "a2-1", type: "boundary", species: "Royal Tern", x: 0.05, y: 0.05, w: 0.55, h: 0.60, note: "ROYT mega-colony — 2,225 nests" },
            { id: "a2-2", type: "bird", species: "Royal Tern", x: 0.20, y: 0.15, w: 0.03, h: 0.03, confidence: 0.96 },
            { id: "a2-3", type: "bird", species: "Royal Tern", x: 0.40, y: 0.22, w: 0.03, h: 0.03, confidence: 0.94 },
            { id: "a2-4", type: "nest", species: "Royal Tern", x: 0.30, y: 0.30, w: 0.04, h: 0.04, confidence: 0.91 },
            { id: "a2-5", type: "boundary", species: "Sandwich Tern", x: 0.55, y: 0.05, w: 0.40, h: 0.55, note: "SATE colony — 1,334 nests" },
            { id: "a2-6", type: "bird", species: "Sandwich Tern", x: 0.65, y: 0.18, w: 0.03, h: 0.03, confidence: 0.92 },
            { id: "a2-7", type: "nest", species: "Sandwich Tern", x: 0.75, y: 0.30, w: 0.04, h: 0.04, confidence: 0.89 },
            { id: "a2-8", type: "boundary", species: "Laughing Gull", x: 0.10, y: 0.65, w: 0.35, h: 0.28, note: "LAGU periphery — 19 nests" },
            { id: "a2-9", type: "bird", species: "Laughing Gull", x: 0.22, y: 0.72, w: 0.03, h: 0.03, confidence: 0.87 },
        ],
        surveyYear: 2018,
        geoRegion: "Breton-Chandeleur Islands",
        habitat: "Barrier Island",
        surveyDate: "2018-May-20",
        reviewStatus: "approved",
        reviewNotes: "Key monitoring site — flag for quarterly comparison",
    },
    // CSV: 21May18Camera2-Card1-6904 → Raccoon Island, Terrebonne Bay
    // BRPE: 249 birds/182 nests, LAGU: 217 birds/145 nests, GREG: 1 bird/1 nest
    {
        id: "seed-d3",
        fileName: "21May18Camera2-Card1-6904.jpg",
        imageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/high_resolution_photos/2018/Terrebonne%20Bay/Raccoon%20Island/21May18Camera2-Card1-6904.jpg",
        labeledImageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/screenshots/2018/Terrebonne%20Bay/Raccoon%20Island/21May18Camera2-Card1-6904.jpg",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000 * 7),
        aiStatus: "done",
        aiBirdCount: "467 +/- 37 (95% CI)",
        aiNestCount: "328 +/- 26 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        species: "Brown Pelican",
        speciesTags: ["Brown Pelican", "Laughing Gull", "Great Egret"],
        colonyName: "Raccoon Island",
        location: "29.0505 N, 90.9266 W",
        notes: "Terrebonne Bay — BRPE (249 birds, 182 nests) + LAGU (217/145) + GREG (1/1). Dense mixed colony.",
        annotations: [
            { id: "a3-1", type: "boundary", species: "Brown Pelican", x: 0.08, y: 0.10, w: 0.45, h: 0.45, note: "BRPE nesting colony — 182 nests" },
            { id: "a3-2", type: "bird", species: "Brown Pelican", x: 0.18, y: 0.22, w: 0.06, h: 0.06, confidence: 0.97 },
            { id: "a3-3", type: "bird", species: "Brown Pelican", x: 0.32, y: 0.30, w: 0.06, h: 0.06, confidence: 0.95 },
            { id: "a3-4", type: "nest", species: "Brown Pelican", x: 0.25, y: 0.40, w: 0.06, h: 0.05, confidence: 0.92 },
            { id: "a3-5", type: "boundary", species: "Laughing Gull", x: 0.50, y: 0.05, w: 0.45, h: 0.45, note: "LAGU colony — 145 nests" },
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
    // CSV: 21May18Camera2-Card1-8273 → Felicity Island, Terrebonne Bay
    // LAGU: 558 birds/443 nests, TRHE: 104 birds/93 nests, SNEG: 18/16, BRPE: 10/9, BCNH: 9/9
    {
        id: "seed-d4",
        fileName: "21May18Camera2-Card1-8273.jpg",
        imageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/high_resolution_photos/2018/Terrebonne%20Bay/Felicity%20Island/21May18Camera2-Card1-8273.jpg",
        labeledImageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/screenshots/2018/Terrebonne%20Bay/Felicity%20Island/21May18Camera2-Card1-8273.jpg",
        source: "admin",
        submittedAt: new Date(Date.now() - 86400000 * 10),
        aiStatus: "done",
        aiBirdCount: "699 +/- 56 (95% CI)",
        aiNestCount: "570 +/- 46 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        species: "Laughing Gull",
        speciesTags: ["Laughing Gull", "Tricolored Heron", "Snowy Egret", "Brown Pelican", "Black-crowned Night-Heron"],
        colonyName: "Felicity Island",
        location: "29.2558 N, 90.4400 W",
        notes: "Terrebonne Bay — LAGU (558 birds, 443 nests), TRHE (104/93), SNEG (18/16), BRPE (10/9), BCNH (9/9)",
        annotations: [
            { id: "a4-1", type: "boundary", species: "Laughing Gull", x: 0.05, y: 0.05, w: 0.55, h: 0.50, note: "LAGU primary colony — 443 nests" },
            { id: "a4-2", type: "bird", species: "Laughing Gull", x: 0.15, y: 0.15, w: 0.03, h: 0.03, confidence: 0.96 },
            { id: "a4-3", type: "bird", species: "Laughing Gull", x: 0.35, y: 0.22, w: 0.03, h: 0.03, confidence: 0.94 },
            { id: "a4-4", type: "nest", species: "Laughing Gull", x: 0.25, y: 0.32, w: 0.04, h: 0.04, confidence: 0.90 },
            { id: "a4-5", type: "boundary", species: "Tricolored Heron", x: 0.55, y: 0.08, w: 0.40, h: 0.45, note: "TRHE nesting area — 93 nests" },
            { id: "a4-6", type: "bird", species: "Tricolored Heron", x: 0.65, y: 0.18, w: 0.04, h: 0.05, confidence: 0.95 },
            { id: "a4-7", type: "nest", species: "Tricolored Heron", x: 0.72, y: 0.30, w: 0.05, h: 0.04, confidence: 0.88 },
            { id: "a4-8", type: "bird", species: "Snowy Egret", x: 0.18, y: 0.62, w: 0.04, h: 0.04, confidence: 0.89 },
            { id: "a4-9", type: "bird", species: "Brown Pelican", x: 0.55, y: 0.62, w: 0.06, h: 0.06, confidence: 0.92 },
            { id: "a4-10", type: "bird", species: "Black-crowned Night-Heron", x: 0.75, y: 0.65, w: 0.04, h: 0.04, confidence: 0.85 },
        ],
        surveyYear: 2018,
        geoRegion: "Terrebonne Bay",
        habitat: "Barrier Island",
        surveyDate: "2018-May-21",
        reviewStatus: "approved",
    },
    // CSV: 19May18Camera1-Card1-0774 → Brush Island, Biloxi North
    // LAGU: 20 birds/2 nests, ROYT: 6 birds/0 nests, SATE: 2 birds/0 nests
    {
        id: "seed-d5",
        fileName: "19May18Camera1-Card1-0774.jpg",
        imageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/high_resolution_photos/2018/Biloxi%20North/Brush%20Island/19May18Camera1-Card1-0774.jpg",
        labeledImageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/screenshots/2018/Biloxi%20North/Brush%20Island/19May18Camera1-Card1-0774.jpg",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000 * 12),
        aiStatus: "done",
        aiBirdCount: "28 +/- 2 (95% CI)",
        aiNestCount: "2 +/- 0 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        species: "Laughing Gull",
        speciesTags: ["Laughing Gull", "Royal Tern", "Sandwich Tern"],
        colonyName: "Brush Island",
        location: "30.0340 N, 89.1863 W",
        notes: "Biloxi North — LAGU (20 birds, 2 nests), ROYT (6 birds, 0 nests), SATE (2 birds, 0 nests)",
        annotations: [
            { id: "a5-1", type: "boundary", species: "Laughing Gull", x: 0.10, y: 0.10, w: 0.50, h: 0.45, note: "LAGU colony — 2 nests, 20 birds" },
            { id: "a5-2", type: "bird", species: "Laughing Gull", x: 0.22, y: 0.20, w: 0.03, h: 0.03, confidence: 0.95 },
            { id: "a5-3", type: "bird", species: "Laughing Gull", x: 0.38, y: 0.28, w: 0.03, h: 0.03, confidence: 0.93 },
            { id: "a5-4", type: "nest", species: "Laughing Gull", x: 0.30, y: 0.35, w: 0.04, h: 0.04, confidence: 0.90 },
            { id: "a5-5", type: "boundary", species: "Royal Tern", x: 0.55, y: 0.15, w: 0.35, h: 0.35, note: "ROYT group — 6 birds roosting" },
            { id: "a5-6", type: "bird", species: "Royal Tern", x: 0.65, y: 0.25, w: 0.04, h: 0.04, confidence: 0.92 },
            { id: "a5-7", type: "bird", species: "Sandwich Tern", x: 0.30, y: 0.65, w: 0.04, h: 0.03, confidence: 0.86, note: "SATE — 2 birds" },
        ],
        surveyYear: 2018,
        geoRegion: "Biloxi North",
        habitat: "Marsh Island",
        surveyDate: "2018-May-19",
        reviewStatus: "approved",
    },
    // CSV: 27May12Camera2-Card1-0575 → Felicity Island 2012, Terrebonne Bay — 13 species!
    // LAGU: 463/281, TRHE: 190/134, BRPE: 152/134, SNEG: 146/116, WHIB: 119/102, GREG: 87/64, ROYT: 73/49, SATE: 72/51, CATE: 44/18, GBHE: 28/23, GBTE: 9/8, TRSN: 4/4, ULTE: 1/0
    {
        id: "seed-d6",
        fileName: "27May12Camera2-Card1-0575.jpg",
        imageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/high_resolution_photos/2012/Terrebonne%20Bay/Felicity%20Island/27May12Camera2-Card1-0575.jpg",
        labeledImageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/screenshots/2012/Terrebonne%20Bay/Felicity%20Island/27May12Camera2-Card1-0575.jpg",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000 * 30),
        aiStatus: "done",
        aiBirdCount: "1,388 +/- 111 (95% CI)",
        aiNestCount: "984 +/- 79 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        species: "Laughing Gull",
        speciesTags: ["Laughing Gull", "Tricolored Heron", "Brown Pelican", "Snowy Egret", "White Ibis", "Great Egret", "Royal Tern"],
        colonyName: "Felicity Island",
        location: "29.2558 N, 90.4400 W",
        notes: "13-species mega-colony — LAGU (463/281), TRHE (190/134), BRPE (152/134), SNEG (146/116), WHIB (119/102), GREG (87/64), ROYT (73/49)",
        annotations: [
            { id: "a6-1", type: "boundary", species: "Laughing Gull", x: 0.05, y: 0.05, w: 0.45, h: 0.40, note: "LAGU — 281 nests" },
            { id: "a6-2", type: "boundary", species: "Tricolored Heron", x: 0.50, y: 0.05, w: 0.45, h: 0.40, note: "TRHE — 134 nests" },
            { id: "a6-3", type: "boundary", species: "Brown Pelican", x: 0.05, y: 0.45, w: 0.35, h: 0.45, note: "BRPE — 134 nests" },
            { id: "a6-4", type: "boundary", species: "White Ibis", x: 0.40, y: 0.50, w: 0.30, h: 0.40, note: "WHIB — 102 nests" },
            { id: "a6-5", type: "bird", species: "Snowy Egret", x: 0.72, y: 0.55, w: 0.04, h: 0.04, confidence: 0.91 },
            { id: "a6-6", type: "bird", species: "Great Egret", x: 0.80, y: 0.62, w: 0.05, h: 0.06, confidence: 0.88 },
        ],
        surveyYear: 2012,
        geoRegion: "Terrebonne Bay",
        habitat: "Barrier Island",
        surveyDate: "2012-May-27",
        reviewStatus: "approved",
    },
    // CSV: 17May21Camera2-Card1-3718 → Lavaca Bay Spoils E, Matagorda Bay (2021, Texas) — 11 species
    // GREG: 348/243, ROSP: 285/186, TRHE: 280/177, SNEG: 265/149, WHIB: 259/138, LAGU: 195/132, BCNH: 127/94, BRPE: 81/75, GBHE: 78/51, REEG DM: 32/16, WFIB: 11/4
    {
        id: "seed-d7",
        fileName: "17May21Camera2-Card1-3718.jpg",
        imageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/high_resolution_photos/2021/Matagorda%20Bay/Lavaca%20Bay%20Spoils%20E/17May21Camera2-Card1-3718.jpg",
        labeledImageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/screenshots/2021/Matagorda%20Bay/Lavaca%20Bay%20Spoils%20E/17May21Camera2-Card1-3718.jpg",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000 * 60),
        aiStatus: "done",
        aiBirdCount: "1,961 +/- 157 (95% CI)",
        aiNestCount: "1,265 +/- 101 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        species: "Great Egret",
        speciesTags: ["Great Egret", "Roseate Spoonbill", "Tricolored Heron", "Snowy Egret", "White Ibis", "Laughing Gull", "Black-crowned Night-Heron"],
        colonyName: "Lavaca Bay Spoils E",
        location: "28.5995 N, 96.5621 W",
        notes: "Matagorda Bay TX — 11-species colony. GREG (348/243), ROSP (285/186), TRHE (280/177), SNEG (265/149), WHIB (259/138)",
        annotations: [
            { id: "a7-1", type: "boundary", species: "Great Egret", x: 0.05, y: 0.05, w: 0.40, h: 0.45, note: "GREG colony — 243 nests" },
            { id: "a7-2", type: "boundary", species: "Roseate Spoonbill", x: 0.45, y: 0.05, w: 0.50, h: 0.40, note: "ROSP colony — 186 nests" },
            { id: "a7-3", type: "boundary", species: "Tricolored Heron", x: 0.05, y: 0.50, w: 0.40, h: 0.42, note: "TRHE nesting — 177 nests" },
            { id: "a7-4", type: "boundary", species: "White Ibis", x: 0.50, y: 0.50, w: 0.45, h: 0.42, note: "WHIB colony — 138 nests" },
            { id: "a7-5", type: "bird", species: "Snowy Egret", x: 0.32, y: 0.28, w: 0.04, h: 0.04, confidence: 0.93 },
            { id: "a7-6", type: "bird", species: "Black-crowned Night-Heron", x: 0.68, y: 0.72, w: 0.04, h: 0.04, confidence: 0.87 },
        ],
        surveyYear: 2021,
        geoRegion: "Matagorda Bay",
        habitat: "Spoil Island",
        surveyDate: "2021-May-17",
        reviewStatus: "approved",
    },
    // CSV: 25June10Camera2-Card1-0357 → North Deer Island, Galveston (2010, Texas) — 11 species
    // BRPE: 14/10, GBHE: 5/4, GREG: 5/5, LAGU: 5/4, NECO: 4/4, ROSP: 2/2, SNEG: 27/22, TRHE: 22/22, UNWA: 1/0, WFIB: 4/3, WHIB: 7/7
    {
        id: "seed-d8",
        fileName: "25June10Camera2-Card1-0357.jpg",
        imageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/high_resolution_photos/2010/Galveston/North%20Deer%20Island/25June10Camera2-Card1-0357.jpg",
        labeledImageUrl: "https://twi-aviandata.s3.amazonaws.com/avian_monitoring/screenshots/2010/Galveston/North%20Deer%20Island/25June10Camera2-Card1-0357.jpg",
        source: "batch",
        submittedAt: new Date(Date.now() - 86400000 * 90),
        aiStatus: "done",
        aiBirdCount: "96 +/- 8 (95% CI)",
        aiNestCount: "83 +/- 7 (95% CI)",
        aiModelInfo: "CSRNet-VGG16 density estimation",
        species: "Snowy Egret",
        speciesTags: ["Snowy Egret", "Tricolored Heron", "Brown Pelican", "White Ibis", "Great Egret", "Laughing Gull"],
        colonyName: "North Deer Island",
        location: "29.2852 N, 94.9246 W",
        notes: "Galveston TX 2010 — 11-species wading bird colony. SNEG (27/22), TRHE (22/22), BRPE (14/10), WHIB (7/7)",
        annotations: [
            { id: "a8-1", type: "boundary", species: "Snowy Egret", x: 0.05, y: 0.05, w: 0.45, h: 0.45, note: "SNEG colony — 22 nests" },
            { id: "a8-2", type: "boundary", species: "Tricolored Heron", x: 0.50, y: 0.05, w: 0.45, h: 0.45, note: "TRHE — 22 nests" },
            { id: "a8-3", type: "bird", species: "Brown Pelican", x: 0.20, y: 0.60, w: 0.06, h: 0.06, confidence: 0.94 },
            { id: "a8-4", type: "bird", species: "White Ibis", x: 0.55, y: 0.65, w: 0.04, h: 0.04, confidence: 0.90 },
            { id: "a8-5", type: "bird", species: "Great Egret", x: 0.75, y: 0.55, w: 0.05, h: 0.06, confidence: 0.88 },
        ],
        surveyYear: 2010,
        geoRegion: "Galveston",
        habitat: "Barrier Island",
        surveyDate: "2010-Jun-25",
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
