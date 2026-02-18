import { useRef, useEffect, useMemo, useCallback } from "react";
import L from "leaflet";
import type { ColonyStats } from "@/lib/dataService";

const REGION_COLORS: Record<string, string> = {
    "Biloxi South": "#3B82F6",
    "Breton Sound": "#10B981",
    "Barataria Bay": "#F59E0B",
    "Terrebonne Bay": "#8B5CF6",
    "Vermilion Bay": "#EC4899",
    "Calcasieu Lake": "#14B8A6",
    "Sabine Lake": "#6366F1",
    "Coastal Marshes": "#84CC16",
    "Deltaic Coastal Marshes and Barrier Islands": "#22D3EE",
    DEFAULT: "#6B7280",
};

function getRegionColor(region: string): string {
    for (const [key, color] of Object.entries(REGION_COLORS)) {
        if (key === "DEFAULT") continue;
        if (region.toLowerCase().includes(key.toLowerCase())) return color;
    }
    return REGION_COLORS.DEFAULT;
}

function markerRadius(birds: number): number {
    return Math.sqrt(Math.max(birds, 1)) * 0.3 + 3;
}

export interface ColonyMapProps {
    colonies: ColonyStats[];
    onColonyClick?: (colony: ColonyStats) => void;
    selectedColony?: string | null;
    className?: string;
    interactive?: boolean;
    fitBounds?: boolean;
}

export function ColonyMap({
    colonies,
    onColonyClick,
    selectedColony,
    className = "h-full w-full",
    interactive = true,
    fitBounds: shouldFitBounds = false,
}: ColonyMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.CircleMarker[]>([]);

    const validColonies = useMemo(
        () => colonies.filter(c => c.latitude && c.longitude),
        [colonies]
    );

    // Initialize map once
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            center: [29.5, -90.0],
            zoom: 7,
            zoomControl: interactive,
            dragging: interactive,
            scrollWheelZoom: interactive,
            doubleClickZoom: interactive,
            touchZoom: interactive,
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        }).addTo(map);

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, [interactive]);

    // Update markers when colonies/selection changes
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        // Clear old markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        validColonies.forEach((colony) => {
            const isSelected = selectedColony === colony.colonyName;
            const color = getRegionColor(colony.geoRegion);
            const radius = isSelected
                ? markerRadius(colony.totalBirds) * 1.5
                : markerRadius(colony.totalBirds);

            const marker = L.circleMarker([colony.latitude!, colony.longitude!], {
                radius,
                color: isSelected ? "#fff" : color,
                fillColor: color,
                fillOpacity: isSelected ? 0.9 : 0.6,
                weight: isSelected ? 3 : 1.5,
            }).addTo(map);

            marker.bindPopup(`
                <div style="font-size:13px;min-width:180px;">
                    <p style="font-weight:bold;font-size:14px;margin:0 0 4px 0;">${colony.colonyName}</p>
                    <p style="font-size:11px;opacity:0.7;margin:0 0 8px 0;">${colony.geoRegion}</p>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 16px;font-size:12px;">
                        <span style="opacity:0.6;">Birds:</span>
                        <span style="font-weight:600;text-align:right;">${colony.totalBirds.toLocaleString()}</span>
                        <span style="opacity:0.6;">Nests:</span>
                        <span style="font-weight:600;text-align:right;">${colony.totalNests.toLocaleString()}</span>
                        <span style="opacity:0.6;">Species:</span>
                        <span style="font-weight:600;text-align:right;">${colony.uniqueSpecies}</span>
                        <span style="opacity:0.6;">Surveys:</span>
                        <span style="font-weight:600;text-align:right;">${colony.observations}</span>
                    </div>
                </div>
            `);

            if (onColonyClick) {
                marker.on("click", () => onColonyClick(colony));
            }

            markersRef.current.push(marker);
        });

        // Fit bounds if requested
        if (shouldFitBounds && validColonies.length > 0) {
            const bounds = validColonies.map(c => [c.latitude!, c.longitude!] as [number, number]);
            map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
        }
    }, [validColonies, selectedColony, onColonyClick, shouldFitBounds]);

    // Invalidate map size when container resizes
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const timer = setTimeout(() => map.invalidateSize(), 100);
        return () => clearTimeout(timer);
    }, [className]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ background: "#0a0a0a" }}
        />
    );
}

export { REGION_COLORS, getRegionColor };
