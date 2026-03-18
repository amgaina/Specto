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
    return Math.sqrt(Math.max(birds, 1)) * 0.35 + 5;
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
    const markersRef = useRef<L.LayerGroup | null>(null);

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
            zoomControl: false,
            dragging: interactive,
            scrollWheelZoom: interactive,
            doubleClickZoom: interactive,
            touchZoom: interactive,
            attributionControl: false,
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        }).addTo(map);

        // Add zoom control to bottom-left to avoid overlapping with stat strip
        if (interactive) {
            L.control.zoom({ position: 'bottomleft' }).addTo(map);
        }

        mapRef.current = map;
        markersRef.current = L.layerGroup().addTo(map);

        return () => {
            map.remove();
            mapRef.current = null;
            markersRef.current = null;
        };
    }, [interactive]);

    // Update markers when colonies/selection changes
    useEffect(() => {
        const map = mapRef.current;
        const markerGroup = markersRef.current;
        if (!map || !markerGroup) return;

        markerGroup.clearLayers();

        validColonies.forEach((colony) => {
            const isSelected = selectedColony === colony.colonyName;
            const color = getRegionColor(colony.geoRegion);
            const radius = isSelected
                ? markerRadius(colony.totalBirds) * 1.6
                : markerRadius(colony.totalBirds);

            const pos: L.LatLngExpression = [colony.latitude!, colony.longitude!];

            // Glow halo — larger, semi-transparent circle underneath
            const glowRadius = radius * 2.2;
            const glow = L.circleMarker(pos, {
                radius: glowRadius,
                color: "transparent",
                fillColor: color,
                fillOpacity: isSelected ? 0.2 : 0.08,
                weight: 0,
                interactive: false,
            });
            markerGroup.addLayer(glow);

            // Main marker
            const marker = L.circleMarker(pos, {
                radius,
                color: isSelected ? "#ffffff" : color,
                fillColor: color,
                fillOpacity: isSelected ? 0.95 : 0.7,
                weight: isSelected ? 3 : 1.5,
            });

            // Pulsing ring for selected colony
            if (isSelected) {
                const pulseRing = L.circleMarker(pos, {
                    radius: radius * 2,
                    color: "#ffffff",
                    fillColor: "transparent",
                    fillOpacity: 0,
                    weight: 2,
                    opacity: 0.4,
                    interactive: false,
                    className: "pulse-ring-marker",
                });
                markerGroup.addLayer(pulseRing);
            }

            marker.bindPopup(`
                <div style="font-size:14px;min-width:200px;font-family:Inter,system-ui,sans-serif;">
                    <p style="font-weight:700;font-size:16px;margin:0 0 4px 0;">${colony.colonyName}</p>
                    <p style="font-size:11px;opacity:0.6;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:0.05em;">${colony.geoRegion}</p>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;font-size:13px;">
                        <span style="opacity:0.5;">Birds</span>
                        <span style="font-weight:700;text-align:right;">${colony.totalBirds.toLocaleString()}</span>
                        <span style="opacity:0.5;">Nests</span>
                        <span style="font-weight:700;text-align:right;">${colony.totalNests.toLocaleString()}</span>
                        <span style="opacity:0.5;">Species</span>
                        <span style="font-weight:700;text-align:right;">${colony.uniqueSpecies}</span>
                    </div>
                </div>
            `, { className: 'dark-popup' });

            if (onColonyClick) {
                marker.on("click", () => onColonyClick(colony));
            }

            // Hover effect — enlarge on hover
            marker.on("mouseover", () => {
                if (!isSelected) {
                    marker.setRadius(radius * 1.3);
                    glow.setStyle({ fillOpacity: 0.15 });
                }
            });
            marker.on("mouseout", () => {
                if (!isSelected) {
                    marker.setRadius(radius);
                    glow.setStyle({ fillOpacity: 0.08 });
                }
            });

            markerGroup.addLayer(marker);
        });

        // Fly to selected colony
        if (selectedColony) {
            const selected = validColonies.find(c => c.colonyName === selectedColony);
            if (selected) {
                map.flyTo([selected.latitude!, selected.longitude!], Math.max(map.getZoom(), 9), {
                    duration: 0.8,
                    easeLinearity: 0.5,
                });
            }
        }

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
            style={{ background: "#050505" }}
        />
    );
}

export { REGION_COLORS, getRegionColor };
