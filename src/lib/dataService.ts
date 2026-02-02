// Data types and service for Louisiana Avian Monitoring Data
export interface AvianRecord {
  Year: number;
  Date: string;
  ColonyName: string;
  Latitude_x: number | null;
  Longitude_x: number | null;
  DottingAreaNumber: number;
  CameraNumber: number;
  CardNumber: number;
  PhotoNumber: string;
  PQ: string;
  SpeciesCode: string;
  WBN: number;
  ChickNestwithoutAdult: number;
  AbandNest: number;
  EmptyNest: number;
  PBN: number;
  Site: number;
  Brood: number;
  OtherAdultsInColony: number;
  OtherImmInColony: number;
  ChicksNestlings: number;
  RoostingBirds: number;
  RoostingAdults: number;
  RoostingImmatures: number;
  UnknownAge: number;
  Dotter: string;
  ColonyID: string;
  ColonyGroupBuffer: string;
  State: string;
  Longitude_y: number | null;
  Latitude_y: number | null;
  PrimaryHabitat: string;
  LandForm: string;
  GeoRegion: string;
  ExtrapArea: string;
  TerrestEcoRegion: string;
  MarineEcoRegion: string;
  total_nests: number;
  total_birds: number;
  date2: string;
  month: string;
  uid: string;
  day: string;
  thumbnail_new: string;
  screenshot_new: string;
  HighResImage_new: string;
}

// Species code mapping to common names
export const SPECIES_NAMES: Record<string, string> = {
  FOTE: "Forster's Tern",
  LAGU: "Laughing Gull",
  SNEG: "Snowy Egret",
  TRHE: "Tricolored Heron",
  ROSP: "Roseate Spoonbill",
  REEG: "Reddish Egret",
  BRPE: "Brown Pelican",
  GBHE: "Great Blue Heron",
  GREG: "Great Egret",
  BCNH: "Black-crowned Night-Heron",
  YCNH: "Yellow-crowned Night-Heron",
  WHIB: "White Ibis",
  CAEG: "Cattle Egret",
  LBHE: "Little Blue Heron",
  NEBU: "Neotropic Cormorant",
  DCCO: "Double-crested Cormorant",
  ANHI: "Anhinga",
  WOST: "Wood Stork",
  LETE: "Least Tern",
  BLSK: "Black Skimmer",
  ROYT: "Royal Tern",
  SATE: "Sandwich Tern",
  CATE: "Caspian Tern",
  COTE: "Common Tern",
  GBTE: "Gull-billed Tern",
};

// Species colors for visualizations
export const SPECIES_COLORS: Record<string, string> = {
  FOTE: "#3B82F6", // Blue
  LAGU: "#10B981", // Green
  SNEG: "#F59E0B", // Amber
  TRHE: "#8B5CF6", // Purple
  ROSP: "#EC4899", // Pink
  REEG: "#EF4444", // Red
  BRPE: "#6366F1", // Indigo
  GBHE: "#14B8A6", // Teal
  GREG: "#84CC16", // Lime
  BCNH: "#F97316", // Orange
  YCNH: "#FBBF24", // Yellow
  WHIB: "#A3E635", // Light Green
  CAEG: "#22D3EE", // Cyan
  LBHE: "#818CF8", // Light Indigo
  DEFAULT: "#6B7280", // Gray
};

export function getSpeciesName(code: string): string {
  return SPECIES_NAMES[code] || code;
}

export function getSpeciesColor(code: string): string {
  return SPECIES_COLORS[code] || SPECIES_COLORS.DEFAULT;
}

// Parse CSV data
export function parseCSV(csvText: string): AvianRecord[] {
  const lines = csvText.split("\n");
  const headers = lines[0].split(",");

  const records: AvianRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle commas within quoted strings
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length < headers.length - 5) continue;

    try {
      const record: AvianRecord = {
        Year: parseInt(values[0]) || 0,
        Date: values[1] || "",
        ColonyName: values[2] || "",
        Latitude_x: parseFloat(values[3]) || null,
        Longitude_x: parseFloat(values[4]) || null,
        DottingAreaNumber: parseInt(values[5]) || 0,
        CameraNumber: parseInt(values[6]) || 0,
        CardNumber: parseInt(values[7]) || 0,
        PhotoNumber: values[8] || "",
        PQ: values[9] || "",
        SpeciesCode: values[10] || "",
        WBN: parseFloat(values[11]) || 0,
        ChickNestwithoutAdult: parseFloat(values[12]) || 0,
        AbandNest: parseFloat(values[13]) || 0,
        EmptyNest: parseFloat(values[14]) || 0,
        PBN: parseFloat(values[15]) || 0,
        Site: parseFloat(values[16]) || 0,
        Brood: parseFloat(values[17]) || 0,
        OtherAdultsInColony: parseFloat(values[18]) || 0,
        OtherImmInColony: parseFloat(values[19]) || 0,
        ChicksNestlings: parseFloat(values[20]) || 0,
        RoostingBirds: parseFloat(values[21]) || 0,
        RoostingAdults: parseFloat(values[22]) || 0,
        RoostingImmatures: parseFloat(values[23]) || 0,
        UnknownAge: parseFloat(values[24]) || 0,
        Dotter: values[25] || "",
        ColonyID: values[36] || "",
        ColonyGroupBuffer: values[38] || "",
        State: values[39] || "",
        Longitude_y: parseFloat(values[40]) || null,
        Latitude_y: parseFloat(values[41]) || null,
        PrimaryHabitat: values[42] || "",
        LandForm: values[43] || "",
        GeoRegion: values[44] || "",
        ExtrapArea: values[45] || "",
        TerrestEcoRegion: values[46] || "",
        MarineEcoRegion: values[47] || "",
        total_nests: parseFloat(values[54]) || 0,
        total_birds: parseFloat(values[55]) || 0,
        date2: values[56] || "",
        month: values[57] || "",
        uid: values[58] || "",
        day: values[59] || "",
        thumbnail_new: values[53] || "",
        screenshot_new: values[52] || "",
        HighResImage_new: values[51] || "",
      };

      if (record.Year > 0 && record.SpeciesCode) {
        records.push(record);
      }
    } catch (e) {
      console.error("Error parsing line:", i, e);
    }
  }

  return records;
}

// Aggregation functions
export interface YearlyStats {
  year: number;
  totalBirds: number;
  totalNests: number;
  uniqueSpecies: number;
  uniqueColonies: number;
  observations: number;
}

export interface SpeciesStats {
  speciesCode: string;
  speciesName: string;
  totalBirds: number;
  totalNests: number;
  observations: number;
  color: string;
}

export interface ColonyStats {
  colonyName: string;
  colonyId: string;
  latitude: number | null;
  longitude: number | null;
  totalBirds: number;
  totalNests: number;
  uniqueSpecies: number;
  observations: number;
  geoRegion: string;
}

export interface MonthlyStats {
  month: string;
  totalBirds: number;
  totalNests: number;
  observations: number;
}

export function getYearlyStats(records: AvianRecord[]): YearlyStats[] {
  const yearMap = new Map<number, {
    birds: number;
    nests: number;
    species: Set<string>;
    colonies: Set<string>;
    count: number;
  }>();

  records.forEach((record) => {
    const existing = yearMap.get(record.Year) || {
      birds: 0,
      nests: 0,
      species: new Set<string>(),
      colonies: new Set<string>(),
      count: 0,
    };

    existing.birds += record.total_birds || 0;
    existing.nests += record.total_nests || 0;
    existing.species.add(record.SpeciesCode);
    existing.colonies.add(record.ColonyName);
    existing.count += 1;

    yearMap.set(record.Year, existing);
  });

  return Array.from(yearMap.entries())
    .map(([year, stats]) => ({
      year,
      totalBirds: Math.round(stats.birds),
      totalNests: Math.round(stats.nests),
      uniqueSpecies: stats.species.size,
      uniqueColonies: stats.colonies.size,
      observations: stats.count,
    }))
    .sort((a, b) => a.year - b.year);
}

export function getSpeciesStats(records: AvianRecord[], year?: number): SpeciesStats[] {
  const filtered = year ? records.filter((r) => r.Year === year) : records;
  const speciesMap = new Map<string, { birds: number; nests: number; count: number }>();

  filtered.forEach((record) => {
    const existing = speciesMap.get(record.SpeciesCode) || {
      birds: 0,
      nests: 0,
      count: 0,
    };

    existing.birds += record.total_birds || 0;
    existing.nests += record.total_nests || 0;
    existing.count += 1;

    speciesMap.set(record.SpeciesCode, existing);
  });

  return Array.from(speciesMap.entries())
    .map(([code, stats]) => ({
      speciesCode: code,
      speciesName: getSpeciesName(code),
      totalBirds: Math.round(stats.birds),
      totalNests: Math.round(stats.nests),
      observations: stats.count,
      color: getSpeciesColor(code),
    }))
    .sort((a, b) => b.totalBirds - a.totalBirds);
}

export function getColonyStats(records: AvianRecord[], year?: number): ColonyStats[] {
  const filtered = year ? records.filter((r) => r.Year === year) : records;
  const colonyMap = new Map<string, {
    colonyId: string;
    lat: number | null;
    lng: number | null;
    birds: number;
    nests: number;
    species: Set<string>;
    count: number;
    geoRegion: string;
  }>();

  filtered.forEach((record) => {
    const existing = colonyMap.get(record.ColonyName) || {
      colonyId: record.ColonyID,
      lat: null,
      lng: null,
      birds: 0,
      nests: 0,
      species: new Set<string>(),
      count: 0,
      geoRegion: record.GeoRegion,
    };

    existing.birds += record.total_birds || 0;
    existing.nests += record.total_nests || 0;
    existing.species.add(record.SpeciesCode);
    existing.count += 1;

    // Use Latitude_y/Longitude_y as primary, fallback to _x
    if (!existing.lat && (record.Latitude_y || record.Latitude_x)) {
      existing.lat = record.Latitude_y || record.Latitude_x;
    }
    if (!existing.lng && (record.Longitude_y || record.Longitude_x)) {
      existing.lng = record.Longitude_y || record.Longitude_x;
    }

    colonyMap.set(record.ColonyName, existing);
  });

  return Array.from(colonyMap.entries())
    .map(([name, stats]) => ({
      colonyName: name,
      colonyId: stats.colonyId,
      latitude: stats.lat,
      longitude: stats.lng,
      totalBirds: Math.round(stats.birds),
      totalNests: Math.round(stats.nests),
      uniqueSpecies: stats.species.size,
      observations: stats.count,
      geoRegion: stats.geoRegion,
    }))
    .sort((a, b) => b.totalBirds - a.totalBirds);
}

export function getMonthlyStats(records: AvianRecord[], year?: number): MonthlyStats[] {
  const filtered = year ? records.filter((r) => r.Year === year) : records;
  const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthMap = new Map<string, { birds: number; nests: number; count: number }>();

  // Initialize all months
  monthOrder.forEach((m) => monthMap.set(m, { birds: 0, nests: 0, count: 0 }));

  filtered.forEach((record) => {
    const month = record.month?.substring(0, 3) || "";
    if (!month) return;

    const existing = monthMap.get(month) || { birds: 0, nests: 0, count: 0 };
    existing.birds += record.total_birds || 0;
    existing.nests += record.total_nests || 0;
    existing.count += 1;
    monthMap.set(month, existing);
  });

  return monthOrder.map((month) => {
    const stats = monthMap.get(month) || { birds: 0, nests: 0, count: 0 };
    return {
      month,
      totalBirds: Math.round(stats.birds),
      totalNests: Math.round(stats.nests),
      observations: stats.count,
    };
  });
}

export function getGeoRegionStats(records: AvianRecord[], year?: number): { region: string; totalBirds: number; totalNests: number; colonies: number }[] {
  const filtered = year ? records.filter((r) => r.Year === year) : records;
  const regionMap = new Map<string, { birds: number; nests: number; colonies: Set<string> }>();

  filtered.forEach((record) => {
    const region = record.GeoRegion || "Unknown";
    const existing = regionMap.get(region) || {
      birds: 0,
      nests: 0,
      colonies: new Set<string>(),
    };

    existing.birds += record.total_birds || 0;
    existing.nests += record.total_nests || 0;
    existing.colonies.add(record.ColonyName);

    regionMap.set(region, existing);
  });

  return Array.from(regionMap.entries())
    .filter(([region]) => region && region !== "Unknown")
    .map(([region, stats]) => ({
      region,
      totalBirds: Math.round(stats.birds),
      totalNests: Math.round(stats.nests),
      colonies: stats.colonies.size,
    }))
    .sort((a, b) => b.totalBirds - a.totalBirds);
}

export function getSpeciesTrend(records: AvianRecord[], speciesCode: string): { year: number; totalBirds: number; totalNests: number }[] {
  const filtered = records.filter((r) => r.SpeciesCode === speciesCode);
  const yearMap = new Map<number, { birds: number; nests: number }>();

  filtered.forEach((record) => {
    const existing = yearMap.get(record.Year) || { birds: 0, nests: 0 };
    existing.birds += record.total_birds || 0;
    existing.nests += record.total_nests || 0;
    yearMap.set(record.Year, existing);
  });

  return Array.from(yearMap.entries())
    .map(([year, stats]) => ({
      year,
      totalBirds: Math.round(stats.birds),
      totalNests: Math.round(stats.nests),
    }))
    .sort((a, b) => a.year - b.year);
}

export function getAvailableYears(records: AvianRecord[]): number[] {
  const years = new Set<number>();
  records.forEach((r) => {
    if (r.Year > 0) years.add(r.Year);
  });
  return Array.from(years).sort((a, b) => a - b);
}

export function getUniqueSpecies(records: AvianRecord[]): string[] {
  const species = new Set<string>();
  records.forEach((r) => {
    if (r.SpeciesCode) species.add(r.SpeciesCode);
  });
  return Array.from(species).sort();
}

export function getUniqueColonies(records: AvianRecord[]): string[] {
  const colonies = new Set<string>();
  records.forEach((r) => {
    if (r.ColonyName) colonies.add(r.ColonyName);
  });
  return Array.from(colonies).sort();
}

export function getUniqueGeoRegions(records: AvianRecord[]): string[] {
  const regions = new Set<string>();
  records.forEach((r) => {
    if (r.GeoRegion) regions.add(r.GeoRegion);
  });
  return Array.from(regions).sort();
}
