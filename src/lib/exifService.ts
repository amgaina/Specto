import ExifReader from "exifreader";
import { findNearestColony, SPECIES } from "./mockDataGenerator";

export interface ExifGeoResult {
    lat?: number;
    lon?: number;
    locationString?: string;
    colonyName?: string;
    region?: string;
    dateTaken?: string;
    suggestedSpecies?: string;
}

/**
 * Extract GPS coordinates and date from a JPEG/TIFF file's EXIF data.
 * Maps coordinates to the nearest known TWI colony site.
 * Gracefully returns empty result for PNGs or files without EXIF.
 */
export async function extractExifGeo(file: File): Promise<ExifGeoResult> {
    try {
        const buffer = await file.arrayBuffer();
        const tags = ExifReader.load(buffer, { expanded: true });

        const result: ExifGeoResult = {};

        // Extract GPS
        if (tags.gps?.Latitude != null && tags.gps?.Longitude != null) {
            result.lat = tags.gps.Latitude;
            result.lon = tags.gps.Longitude;
            result.locationString = `${Math.abs(result.lat).toFixed(4)} ${result.lat >= 0 ? "N" : "S"}, ${Math.abs(result.lon).toFixed(4)} ${result.lon < 0 ? "W" : "E"}`;

            // Map to nearest known TWI colony
            const colony = findNearestColony(result.lat, result.lon);
            if (colony) {
                result.colonyName = colony.name;
                result.region = colony.region;
            }
        }

        // Extract date taken
        const dateTag = tags.exif?.DateTimeOriginal || tags.exif?.DateTime;
        if (dateTag) {
            result.dateTaken = String(dateTag.description || dateTag.value);
        }

        return result;
    } catch {
        // PNG, WebP, or corrupt files — return empty (no EXIF)
        return {};
    }
}

/**
 * For demo purposes: generate plausible EXIF-like geo data for files
 * that lack real EXIF (e.g., PNG screenshots, demo images).
 * Rotates through real colony coordinates so every upload gets enriched.
 */
export function generateDemoGeo(index: number): ExifGeoResult {
    const colonies = [
        { name: "Raccoon Island", region: "Terrebonne Bay", lat: 29.0505, lon: -90.9266 },
        { name: "Rabbit Island", region: "Sabine-Calcasieu", lat: 29.8494, lon: -93.383 },
        { name: "Queen Bess Island", region: "Barataria Bay", lat: 29.3043, lon: -89.9592 },
        { name: "Breton Island", region: "Breton-Chandeleur Islands", lat: 29.4955, lon: -89.1742 },
        { name: "Felicity Island", region: "Terrebonne Bay", lat: 29.2558, lon: -90.44 },
        { name: "Wine Island", region: "Terrebonne Bay", lat: 29.0948, lon: -90.6108 },
    ];
    const colony = colonies[index % colonies.length];
    const species = SPECIES[index % SPECIES.length];

    return {
        lat: colony.lat,
        lon: colony.lon,
        locationString: `${colony.lat.toFixed(4)} N, ${Math.abs(colony.lon).toFixed(4)} W`,
        colonyName: colony.name,
        region: colony.region,
        suggestedSpecies: species.name,
    };
}
