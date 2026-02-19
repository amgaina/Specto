import type { LabeledImage } from "@/context/PipelineContext";

// Real TWI (The Water Institute) Louisiana Coastal Wildlife Monitoring colonies
// GPS and stats from actual survey data (2010-2021)
export const COLONIES = [
    { name: "Raccoon Island", region: "Terrebonne Bay", lat: 29.0505, lon: -90.9266, avgBirds: 324, avgNests: 241 },
    { name: "Rabbit Island", region: "Sabine-Calcasieu", lat: 29.8494, lon: -93.383, avgBirds: 196, avgNests: 139 },
    { name: "Queen Bess Island", region: "Barataria Bay", lat: 29.3043, lon: -89.9592, avgBirds: 226, avgNests: 173 },
    { name: "Breton Island", region: "Breton-Chandeleur Islands", lat: 29.4955, lon: -89.1742, avgBirds: 1169, avgNests: 1136 },
    { name: "Felicity Island", region: "Terrebonne Bay", lat: 29.2558, lon: -90.44, avgBirds: 699, avgNests: 570 },
    { name: "Gosier Islands North", region: "Breton-Chandeleur Islands", lat: 29.5299, lon: -89.0869, avgBirds: 1270, avgNests: 1227 },
    { name: "Belle Isle", region: "Biloxi South", lat: 29.5758, lon: -89.5727, avgBirds: 90, avgNests: 58 },
    { name: "Philo Brice Islands", region: "Terrebonne Bay", lat: 29.11, lon: -90.82, avgBirds: 205, avgNests: 170 },
    { name: "Wine Island", region: "Terrebonne Bay", lat: 29.0948, lon: -90.6108, avgBirds: 150, avgNests: 110 },
    { name: "Whiskey Island", region: "Terrebonne Bay", lat: 29.06, lon: -90.87, avgBirds: 21, avgNests: 17 },
    { name: "Biloxi South 5 B", region: "Biloxi South", lat: 29.68, lon: -89.58, avgBirds: 431, avgNests: 305 },
    { name: "Dry Bread Island", region: "Biloxi North", lat: 29.72, lon: -89.55, avgBirds: 96, avgNests: 63 },
];

// Species from TWI avian monitoring — codes + common names (top observed)
export const SPECIES = [
    { code: "LAGU", name: "Laughing Gull" },
    { code: "TRHE", name: "Tricolored Heron" },
    { code: "SNEG", name: "Snowy Egret" },
    { code: "BRPE", name: "Brown Pelican" },
    { code: "WHIB", name: "White Ibis" },
    { code: "GREG", name: "Great Egret" },
    { code: "FOTE", name: "Forster's Tern" },
    { code: "ROSP", name: "Roseate Spoonbill" },
    { code: "ROYT", name: "Royal Tern" },
    { code: "BLSK", name: "Black Skimmer" },
    { code: "BCNH", name: "Black-crowned Night-Heron" },
    { code: "SATE", name: "Sandwich Tern" },
];

// Realistic multi-species mixes per colony type (TWI data shows mixed colonies)
const COLONY_SPECIES_MIX: Record<string, string[]> = {
    "Raccoon Island": ["Roseate Spoonbill", "Snowy Egret", "Tricolored Heron", "White Ibis", "Brown Pelican"],
    "Rabbit Island": ["Brown Pelican", "Laughing Gull", "Royal Tern"],
    "Queen Bess Island": ["Royal Tern", "Brown Pelican", "Laughing Gull", "Sandwich Tern"],
    "Breton Island": ["Laughing Gull", "Royal Tern", "Black Skimmer", "Sandwich Tern"],
    "Felicity Island": ["Tricolored Heron", "Great Egret", "Snowy Egret"],
    "Gosier Islands North": ["Laughing Gull", "Brown Pelican", "Royal Tern", "Sandwich Tern"],
    "Belle Isle": ["Tricolored Heron", "Snowy Egret", "Black-crowned Night-Heron"],
    "Philo Brice Islands": ["Roseate Spoonbill", "White Ibis", "Snowy Egret", "Great Egret"],
    "Wine Island": ["Brown Pelican", "Laughing Gull", "Forster's Tern"],
    "Whiskey Island": ["Laughing Gull", "Forster's Tern"],
    "Biloxi South 5 B": ["Laughing Gull", "Royal Tern", "Brown Pelican", "Forster's Tern"],
    "Dry Bread Island": ["Tricolored Heron", "Snowy Egret"],
};

const DEMO_IMAGES = [
    "/image_1.png",
    "/image_2.png",
    "/image_3.png",
    "/image_4.png",
    "/image_5.png",
    "/image_6.png",
];

// Real camera naming pattern from TWI survey: DDMonYYCameraX-CardX-NNNN.jpg
const CAMERA_PREFIXES = ["Camera1-Card1-", "Camera2-Card1-", "Camera1-Card2-"];

function generateMockImage(
    surveyDate: string, // YYYY-MM-DD
    index: number
): Partial<LabeledImage> & { fileName: string; imageUrl: string } {
    const colony = COLONIES[index % COLONIES.length];
    const species = SPECIES[index % SPECIES.length];

    // Vary count around colony average (±30%)
    const variance = 0.7 + Math.random() * 0.6;
    const birdCount = Math.round(colony.avgBirds * variance);
    const nestCount = Math.round(colony.avgNests * variance);
    const birdCI = Math.round(birdCount * (0.08 + Math.random() * 0.07));
    const nestCI = Math.round(nestCount * (0.08 + Math.random() * 0.07));

    // Generate real TWI-style filename: 21May18Camera2-Card1-7006.jpg
    const d = new Date(surveyDate);
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mon = months[d.getMonth()];
    const yr = String(d.getFullYear()).slice(2);
    const cam = CAMERA_PREFIXES[index % CAMERA_PREFIXES.length];
    const photoNum = String(1000 + index * 37).padStart(4, "0");
    const fileName = `${day}${mon}${yr}${cam}${photoNum}.jpg`;

    // Derive year from surveyDate for research metadata
    const year = d.getFullYear();
    const surveyDateStr = `${year}-${mon}-${day}`;

    return {
        fileName,
        imageUrl: DEMO_IMAGES[index % DEMO_IMAGES.length],
        source: "batch",
        submittedAt: new Date(
            `${surveyDate}T${String(8 + (index % 10)).padStart(2, "0")}:${String((index * 7) % 60).padStart(2, "0")}:00`
        ),
        aiStatus: "done",
        aiBirdCount: `${birdCount.toLocaleString()} +/- ${birdCI} (95% CI)`,
        aiNestCount: `${nestCount.toLocaleString()} +/- ${nestCI} (95% CI)`,
        aiModelInfo: "CSRNet-VGG16 density estimation",
        species: species.name,
        colonyName: colony.name,
        location: `${colony.lat.toFixed(4)} N, ${Math.abs(colony.lon).toFixed(4)} W`,
        reviewStatus: "approved",
        speciesTags: COLONY_SPECIES_MIX[colony.name] || [species.name],
        notes: `${colony.region} survey — ${species.code} colony`,
        // Research metadata (matches TWI schema)
        surveyYear: year,
        geoRegion: colony.region,
        habitat: "Barrier Island",
        surveyDate: surveyDateStr,
    };
}

/**
 * Generate a batch of realistic mock images based on real TWI survey data.
 * @param folderName - Folder path containing a date (e.g. "surveys/2024-03-15/")
 * @param count - Number of images to generate
 */
export function generateMockBatch(
    folderName: string,
    count: number
): (Partial<LabeledImage> & { fileName: string; imageUrl: string })[] {
    // Support both "surveys/2024-03-15/" and "high_resolution_photos/2018/" patterns
    const dateMatch = folderName.match(/(\d{4}-\d{2}-\d{2})/);
    const yearMatch = folderName.match(/\/(\d{4})\//);
    const folderDate = dateMatch ? dateMatch[1] : yearMatch ? `${yearMatch[1]}-05-18` : "2024-05-18";

    return Array.from({ length: count }, (_, i) => generateMockImage(folderDate, i));
}

/**
 * Map GPS coordinates to the nearest known TWI colony (within ~0.5 degrees).
 */
export function findNearestColony(
    lat: number,
    lon: number
): (typeof COLONIES)[0] | null {
    let nearest = null;
    let minDist = Infinity;
    for (const c of COLONIES) {
        const dist = Math.sqrt((c.lat - lat) ** 2 + (c.lon - lon) ** 2);
        if (dist < minDist && dist < 0.5) {
            minDist = dist;
            nearest = c;
        }
    }
    return nearest;
}
