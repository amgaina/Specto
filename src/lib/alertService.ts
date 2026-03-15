import { AvianRecord, getSpeciesName } from "./dataService";

export type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";
export type AlertStatus = "active" | "acknowledged" | "resolved" | "dismissed";
export type AlertCategory =
  | "population"
  | "nest"
  | "behavior"
  | "health"
  | "predator"
  | "habitat"
  | "citizen"
  | "data-gap"
  | "endangered"
  | "weather";

export interface Alert {
  id: string;
  title: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverity;
  status: AlertStatus;
  colony: string;
  species?: string;
  region: string;
  timestamp: Date;
  action: string;
  details?: string;
  source: "data" | "weather";
  dataPoints?: { year: number; count: number }[];
}

// Endangered / conservation-concern species codes
const ENDANGERED_SPECIES = ["ROSP", "REEG", "WOST"];

function dummyTimestamp(offsetMinutes: number): Date {
  return new Date(Date.now() - offsetMinutes * 60_000);
}

interface ColonySpeciesYearData {
  colony: string;
  species: string;
  region: string;
  year: number;
  totalBirds: number;
  totalNests: number;
  abandNest: number;
  emptyNest: number;
}

function aggregateByColonySpeciesYear(records: AvianRecord[]): ColonySpeciesYearData[] {
  const key = (r: AvianRecord) => `${r.ColonyName}||${r.SpeciesCode}||${r.Year}`;
  const map = new Map<string, {
    colony: string;
    species: string;
    region: string;
    year: number;
    totalBirds: number;
    totalNests: number;
    abandNest: number;
    emptyNest: number;
  }>();

  for (const r of records) {
    if (!r.ColonyName || !r.SpeciesCode || !r.Year) continue;
    const k = key(r);
    const existing = map.get(k);
    if (existing) {
      existing.totalBirds += r.total_birds || 0;
      existing.totalNests += r.total_nests || 0;
      existing.abandNest += r.AbandNest || 0;
      existing.emptyNest += r.EmptyNest || 0;
    } else {
      map.set(k, {
        colony: r.ColonyName,
        species: r.SpeciesCode,
        region: r.GeoRegion || "Unknown",
        year: r.Year,
        totalBirds: r.total_birds || 0,
        totalNests: r.total_nests || 0,
        abandNest: r.AbandNest || 0,
        emptyNest: r.EmptyNest || 0,
      });
    }
  }

  return Array.from(map.values());
}

function fmt(n: number): string {
  return n.toLocaleString();
}

export function generateConservationAlerts(records: AvianRecord[]): Alert[] {
  const alerts: Alert[] = [];
  const agg = aggregateByColonySpeciesYear(records);

  // Group by colony+species for year-over-year comparisons
  const csMap = new Map<string, ColonySpeciesYearData[]>();
  for (const d of agg) {
    const k = `${d.colony}||${d.species}`;
    const arr = csMap.get(k) || [];
    arr.push(d);
    csMap.set(k, arr);
  }

  // Get all years sorted
  const allYears = [...new Set(agg.map(d => d.year))].sort((a, b) => a - b);
  const latestYear = allYears[allYears.length - 1];
  const prevYear = allYears.length >= 2 ? allYears[allYears.length - 2] : null;

  let offsetCounter = 5; // for staggered timestamps

  // --- 1. Population Decline & Surge (compare last two years) ---
  if (prevYear) {
    for (const [, entries] of csMap) {
      const sorted = entries.sort((a, b) => a.year - b.year);
      const last = sorted.find(e => e.year === latestYear);
      const prev = sorted.find(e => e.year === prevYear);
      if (!last || !prev || prev.totalBirds < 10) continue; // skip tiny counts

      const changePct = ((last.totalBirds - prev.totalBirds) / prev.totalBirds) * 100;

      if (changePct <= -30) {
        const severity: AlertSeverity = changePct <= -60 ? "critical" : "high";
        alerts.push({
          id: `DATA-POP-DECLINE-${last.colony}-${last.species}`,
          title: `${getSpeciesName(last.species)} population decline at ${last.colony}`,
          description: `${last.species} declined by ${Math.abs(Math.round(changePct))}% from ${fmt(Math.round(prev.totalBirds))} to ${fmt(Math.round(last.totalBirds))} birds between ${prevYear} and ${latestYear}.`,
          category: "population",
          severity,
          status: "active",
          colony: last.colony,
          species: last.species,
          region: last.region,
          timestamp: dummyTimestamp(offsetCounter),
          action: "Investigate potential environmental stressors, habitat loss, or food shortage in the colony area. Schedule field assessment.",
          details: `Year-over-year analysis shows a ${Math.abs(Math.round(changePct))}% decline. ${prevYear}: ${fmt(Math.round(prev.totalBirds))} birds, ${latestYear}: ${fmt(Math.round(last.totalBirds))} birds. This exceeds the 30% decline threshold for conservation concern.`,
          source: "data",
          dataPoints: sorted.map(e => ({ year: e.year, count: Math.round(e.totalBirds) })),
        });
        offsetCounter += 3;
      } else if (changePct >= 50) {
        alerts.push({
          id: `DATA-POP-SURGE-${last.colony}-${last.species}`,
          title: `${getSpeciesName(last.species)} population surge at ${last.colony}`,
          description: `${last.species} increased by ${Math.round(changePct)}% from ${fmt(Math.round(prev.totalBirds))} to ${fmt(Math.round(last.totalBirds))} birds between ${prevYear} and ${latestYear}.`,
          category: "population",
          severity: "medium",
          status: "active",
          colony: last.colony,
          species: last.species,
          region: last.region,
          timestamp: dummyTimestamp(offsetCounter),
          action: "Assess carrying capacity and inter-species competition. Monitor nest density metrics for overcrowding.",
          details: `Significant population increase detected. ${prevYear}: ${fmt(Math.round(prev.totalBirds))} birds, ${latestYear}: ${fmt(Math.round(last.totalBirds))} birds. May indicate habitat improvement or displacement from other colonies.`,
          source: "data",
          dataPoints: sorted.map(e => ({ year: e.year, count: Math.round(e.totalBirds) })),
        });
        offsetCounter += 3;
      }
    }
  }

  // --- 2. Nest Abandonment (latest year, per colony) ---
  const colonyLatest = new Map<string, { colony: string; region: string; totalNests: number; abandNest: number; emptyNest: number }>();
  for (const d of agg) {
    if (d.year !== latestYear) continue;
    const existing = colonyLatest.get(d.colony);
    if (existing) {
      existing.totalNests += d.totalNests;
      existing.abandNest += d.abandNest;
      existing.emptyNest += d.emptyNest;
    } else {
      colonyLatest.set(d.colony, {
        colony: d.colony,
        region: d.region,
        totalNests: d.totalNests,
        abandNest: d.abandNest,
        emptyNest: d.emptyNest,
      });
    }
  }

  for (const [, data] of colonyLatest) {
    if (data.totalNests < 5) continue;
    const abandonRatio = (data.abandNest + data.emptyNest) / data.totalNests;
    if (abandonRatio > 0.3) {
      alerts.push({
        id: `DATA-NEST-ABAND-${data.colony}`,
        title: `High nest abandonment at ${data.colony}`,
        description: `${Math.round(abandonRatio * 100)}% of nests are abandoned or empty (${fmt(Math.round(data.abandNest + data.emptyNest))} of ${fmt(Math.round(data.totalNests))} total nests) in ${latestYear}.`,
        category: "nest",
        severity: "high",
        status: "active",
        colony: data.colony,
        region: data.region,
        timestamp: dummyTimestamp(offsetCounter),
        action: "Deploy field team to assess nest abandonment causes. Check for disturbance, predation, or environmental contamination.",
        details: `Abandoned nests: ${fmt(Math.round(data.abandNest))}, Empty nests: ${fmt(Math.round(data.emptyNest))}, Total nests: ${fmt(Math.round(data.totalNests))}. Abandonment rate of ${Math.round(abandonRatio * 100)}% exceeds the 30% threshold.`,
        source: "data",
      });
      offsetCounter += 3;
    }
  }

  // --- 3. Colony Disappearance (present in earlier years but absent in latest) ---
  const coloniesByYear = new Map<number, Set<string>>();
  for (const d of agg) {
    const set = coloniesByYear.get(d.year) || new Set();
    set.add(d.colony);
    coloniesByYear.set(d.year, set);
  }
  const latestColonies = coloniesByYear.get(latestYear) || new Set();
  if (prevYear) {
    const prevColonies = coloniesByYear.get(prevYear) || new Set();
    for (const colony of prevColonies) {
      if (!latestColonies.has(colony)) {
        // Find the region from older data
        const regionEntry = agg.find(d => d.colony === colony);
        alerts.push({
          id: `DATA-DISAPPEAR-${colony}`,
          title: `Colony disappeared: ${colony}`,
          description: `${colony} was surveyed in ${prevYear} but has no records in ${latestYear}. The colony may have been abandoned or relocated.`,
          category: "data-gap",
          severity: "critical",
          status: "active",
          colony,
          region: regionEntry?.region || "Unknown",
          timestamp: dummyTimestamp(offsetCounter),
          action: "Schedule urgent field survey to determine colony status. Check for habitat destruction or disturbance.",
          details: `Colony was present in ${prevYear} survey data but completely absent from ${latestYear}. This could indicate colony collapse, relocation, or a survey gap.`,
          source: "data",
        });
        offsetCounter += 3;
      }
    }
  }

  // --- 4. New Species Detection (species at colony for first time in latest year) ---
  for (const [, entries] of csMap) {
    const sorted = entries.sort((a, b) => a.year - b.year);
    if (sorted.length === 1 && sorted[0].year === latestYear && sorted[0].totalBirds >= 5) {
      const d = sorted[0];
      // Check if this colony existed in earlier years (only flag truly new species, not new colonies)
      const colonyHasHistory = agg.some(a => a.colony === d.colony && a.year < latestYear);
      if (colonyHasHistory) {
        alerts.push({
          id: `DATA-NEWSP-${d.colony}-${d.species}`,
          title: `New species detected: ${getSpeciesName(d.species)} at ${d.colony}`,
          description: `${d.species} (${getSpeciesName(d.species)}) was observed for the first time at ${d.colony} in ${latestYear} with ${fmt(Math.round(d.totalBirds))} birds.`,
          category: "behavior",
          severity: "info",
          status: "active",
          colony: d.colony,
          species: d.species,
          region: d.region,
          timestamp: dummyTimestamp(offsetCounter),
          action: "Document new species presence. Add to regular monitoring protocol for this colony.",
          details: `First recorded appearance of ${getSpeciesName(d.species)} at this colony. ${fmt(Math.round(d.totalBirds))} birds counted. May indicate range expansion or habitat changes attracting new species.`,
          source: "data",
        });
        offsetCounter += 3;
      }
    }
  }

  // --- 5. Endangered Species Detection ---
  for (const d of agg) {
    if (d.year !== latestYear) continue;
    if (!ENDANGERED_SPECIES.includes(d.species)) continue;
    if (d.totalBirds < 1) continue;

    alerts.push({
      id: `DATA-ENDANG-${d.colony}-${d.species}`,
      title: `${getSpeciesName(d.species)} detected — Conservation species alert`,
      description: `${d.species} (${getSpeciesName(d.species)}) confirmed at ${d.colony} with ${fmt(Math.round(d.totalBirds))} birds in ${latestYear}. Species is of conservation concern.`,
      category: "endangered",
      severity: "critical",
      status: "active",
      colony: d.colony,
      species: d.species,
      region: d.region,
      timestamp: dummyTimestamp(offsetCounter),
      action: "Activate enhanced protection protocol. Restrict access to nesting area. Notify state wildlife agency.",
      details: `${getSpeciesName(d.species)} is classified as a species of conservation concern. ${fmt(Math.round(d.totalBirds))} birds and ${fmt(Math.round(d.totalNests))} nests recorded at ${d.colony} in ${latestYear}. Detection triggers mandatory reporting to Louisiana Department of Wildlife and Fisheries.`,
      source: "data",
    });
    offsetCounter += 2;
  }

  // --- 6. Survey Gap (colony with >2 year gap between surveys) ---
  const colYearsMap = new Map<string, number[]>();
  for (const d of agg) {
    const arr = colYearsMap.get(d.colony) || [];
    if (!arr.includes(d.year)) arr.push(d.year);
    colYearsMap.set(d.colony, arr);
  }

  for (const [colony, years] of colYearsMap) {
    const sorted = years.sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i] - sorted[i - 1];
      if (gap > 2) {
        const regionEntry = agg.find(d => d.colony === colony);
        alerts.push({
          id: `DATA-GAP-${colony}-${sorted[i - 1]}-${sorted[i]}`,
          title: `Survey gap at ${colony}: ${gap} years`,
          description: `No survey data for ${colony} between ${sorted[i - 1]} and ${sorted[i]} — a ${gap}-year monitoring gap.`,
          category: "data-gap",
          severity: "medium",
          status: "active",
          colony,
          region: regionEntry?.region || "Unknown",
          timestamp: dummyTimestamp(offsetCounter),
          action: "Review historical survey schedules. Ensure continuous monitoring coverage for this colony.",
          details: `Last survey before gap: ${sorted[i - 1]}. Next survey after gap: ${sorted[i]}. Gap of ${gap} years exceeds the 2-year threshold. Data continuity is essential for trend analysis.`,
          source: "data",
        });
        offsetCounter += 2;
        break; // only report the largest/most recent gap per colony
      }
    }
  }

  // --- 7. Habitat Concern (declining bird counts across 3+ consecutive surveys) ---
  const colonyYearBirds = new Map<string, { year: number; birds: number; region: string }[]>();
  for (const d of agg) {
    const arr = colonyYearBirds.get(d.colony) || [];
    const existing = arr.find(e => e.year === d.year);
    if (existing) {
      existing.birds += d.totalBirds;
    } else {
      arr.push({ year: d.year, birds: d.totalBirds, region: d.region });
    }
    colonyYearBirds.set(d.colony, arr);
  }

  for (const [colony, yearData] of colonyYearBirds) {
    const sorted = yearData.sort((a, b) => a.year - b.year);
    if (sorted.length < 3) continue;

    // Check last 3+ consecutive declining
    let declineStreak = 0;
    for (let i = sorted.length - 1; i > 0; i--) {
      if (sorted[i].birds < sorted[i - 1].birds) {
        declineStreak++;
      } else {
        break;
      }
    }

    if (declineStreak >= 3) {
      const startIdx = sorted.length - 1 - declineStreak;
      const startData = sorted[startIdx];
      const endData = sorted[sorted.length - 1];
      const totalDecline = Math.round(((startData.birds - endData.birds) / startData.birds) * 100);

      alerts.push({
        id: `DATA-HABITAT-${colony}`,
        title: `Sustained decline at ${colony}`,
        description: `Bird counts at ${colony} have declined across ${declineStreak + 1} consecutive survey years, from ${fmt(Math.round(startData.birds))} to ${fmt(Math.round(endData.birds))} birds (${totalDecline}% total decline).`,
        category: "habitat",
        severity: "high",
        status: "active",
        colony,
        region: endData.region,
        timestamp: dummyTimestamp(offsetCounter),
        action: "Conduct comprehensive habitat assessment. Evaluate environmental factors contributing to sustained decline.",
        details: `Decline trend: ${sorted.slice(startIdx).map(d => `${d.year}: ${fmt(Math.round(d.birds))}`).join(" → ")}. A sustained multi-year decline suggests habitat degradation rather than normal population fluctuation.`,
        source: "data",
        dataPoints: sorted.map(d => ({ year: d.year, count: Math.round(d.birds) })),
      });
      offsetCounter += 3;
    }
  }

  // Sort by severity then timestamp
  const severityOrder: Record<AlertSeverity, number> = {
    critical: 0, high: 1, medium: 2, low: 3, info: 4,
  };
  alerts.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity])
      return severityOrder[a.severity] - severityOrder[b.severity];
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  return alerts;
}
