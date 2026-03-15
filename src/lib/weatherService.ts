import type { ColonyStats } from "./dataService";
import type { Alert, AlertSeverity } from "./alertService";

interface NOAAAlert {
  properties: {
    event: string;
    severity: "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown";
    headline: string;
    description: string;
    areaDesc: string;
    effective: string;
    expires: string;
  };
}

interface NOAAResponse {
  features: NOAAAlert[];
}

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function mapSeverity(noaaSeverity: string): AlertSeverity {
  switch (noaaSeverity) {
    case "Extreme": return "critical";
    case "Severe": return "high";
    case "Moderate": return "medium";
    case "Minor": return "low";
    default: return "info";
  }
}

function getCacheKey(lat: number, lon: number): string {
  return `specto-weather-${lat.toFixed(4)}-${lon.toFixed(4)}`;
}

function getCachedAlerts(key: string): NOAAAlert[] | null {
  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCachedAlerts(key: string, data: NOAAAlert[]): void {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // sessionStorage full or unavailable
  }
}

async function fetchAlertsForPoint(lat: number, lon: number): Promise<NOAAAlert[]> {
  const roundedLat = parseFloat(lat.toFixed(4));
  const roundedLon = parseFloat(lon.toFixed(4));
  const cacheKey = getCacheKey(roundedLat, roundedLon);

  const cached = getCachedAlerts(cacheKey);
  if (cached !== null) return cached;

  try {
    const response = await fetch(
      `https://api.weather.gov/alerts/active?point=${roundedLat},${roundedLon}`,
      {
        headers: {
          "User-Agent": "(Specto Conservation Monitor, specto@example.com)",
          Accept: "application/geo+json",
        },
      }
    );

    if (!response.ok) {
      console.warn(`NOAA API returned ${response.status} for ${roundedLat},${roundedLon}`);
      return [];
    }

    const data: NOAAResponse = await response.json();
    const alerts = data.features || [];
    setCachedAlerts(cacheKey, alerts);
    return alerts;
  } catch (err) {
    console.warn("NOAA API fetch failed:", err);
    return [];
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWeatherAlerts(colonies: ColonyStats[]): Promise<{
  alerts: Alert[];
  lastChecked: Date;
}> {
  // Pick top 10 colonies by bird count that have valid coordinates
  const topColonies = colonies
    .filter(c => c.latitude && c.longitude)
    .sort((a, b) => b.totalBirds - a.totalBirds)
    .slice(0, 10);

  const weatherAlerts: Alert[] = [];
  const seenEvents = new Set<string>();

  for (let i = 0; i < topColonies.length; i++) {
    const colony = topColonies[i];
    if (!colony.latitude || !colony.longitude) continue;

    const noaaAlerts = await fetchAlertsForPoint(colony.latitude, colony.longitude);

    for (const noaaAlert of noaaAlerts) {
      const props = noaaAlert.properties;
      // Deduplicate by event+area
      const dedupeKey = `${props.event}-${props.areaDesc}`;
      if (seenEvents.has(dedupeKey)) continue;
      seenEvents.add(dedupeKey);

      weatherAlerts.push({
        id: `WEATHER-${colony.colonyName}-${props.event.replace(/\s+/g, "-")}`,
        title: `${props.event} — ${colony.colonyName} area`,
        description: props.headline || `${props.event} active near ${colony.colonyName}.`,
        category: "weather",
        severity: mapSeverity(props.severity),
        status: "active",
        colony: colony.colonyName,
        region: colony.geoRegion || props.areaDesc,
        timestamp: new Date(props.effective || Date.now()),
        action: `Monitor conditions. ${props.event} may affect nesting colonies. Consider protective measures if severity increases.`,
        details: props.description?.substring(0, 500) || undefined,
        source: "weather",
      });
    }

    // Rate limit: 1s delay between requests (skip if last)
    if (i < topColonies.length - 1) {
      await delay(1000);
    }
  }

  return {
    alerts: weatherAlerts,
    lastChecked: new Date(),
  };
}
