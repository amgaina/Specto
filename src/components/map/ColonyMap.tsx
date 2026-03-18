import { useRef, useEffect, useMemo } from "react";
import L from "leaflet";
import type { ColonyStats } from "@/lib/dataService";

// Status-based colors — meaningful to wildlife managers
const STATUS_COLORS = {
    growing: "#16A34A",   // Green — population increasing
    stable: "#2563EB",    // Blue — population stable
    declining: "#DC2626", // Red — population declining
    unknown: "#9CA3AF",   // Gray — insufficient data
};

// Region colors kept for optional use
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

// Stepped size classes — clear visual hierarchy
function markerRadius(birds: number): number {
    if (birds >= 10000) return 28;
    if (birds >= 2000) return 20;
    if (birds >= 500) return 14;
    if (birds >= 100) return 10;
    return 7;
}

export type ColorMode = "status" | "region";

export interface ColonyMapProps {
    colonies: ColonyStats[];
    colonyTrends?: Map<string, "growing" | "stable" | "declining" | "unknown">;
    colorMode?: ColorMode;
    onColonyClick?: (colony: ColonyStats) => void;
    selectedColony?: string | null;
    className?: string;
    interactive?: boolean;
    fitBounds?: boolean;
}

export function ColonyMap({
    colonies,
    colonyTrends,
    colorMode = "status",
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
        });

        // BRIGHT tile layer with geographic labels
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map);

        if (interactive) {
            L.control.zoom({ position: 'topright' }).addTo(map);
        }

        // Add CSS for smooth marker transitions
        const style = document.createElement('style');
        style.textContent = `
            .leaflet-interactive { transition: r 0.4s ease-out, fill-opacity 0.4s ease-out, stroke-width 0.3s ease-out; }
            .colony-popup .leaflet-popup-content-wrapper { background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); border: 1px solid #e5e7eb; }
            .colony-popup .leaflet-popup-tip { background: white; }
            .colony-popup .leaflet-popup-content { margin: 14px 16px; }
            @keyframes selected-pulse { 0%, 100% { stroke-opacity: 0.6; } 50% { stroke-opacity: 0.2; } }
            .selected-marker { animation: selected-pulse 2s ease-in-out infinite; }
        `;
        document.head.appendChild(style);

        mapRef.current = map;
        markersRef.current = L.layerGroup().addTo(map);

        return () => {
            map.remove();
            mapRef.current = null;
            markersRef.current = null;
            style.remove();
        };
    }, [interactive]);

    // Update markers
    useEffect(() => {
        const map = mapRef.current;
        const markerGroup = markersRef.current;
        if (!map || !markerGroup) return;

        markerGroup.clearLayers();

        validColonies.forEach((colony) => {
            const isSelected = selectedColony === colony.colonyName;
            const trend = colonyTrends?.get(colony.colonyName) ?? "unknown";

            const color = colorMode === "status"
                ? STATUS_COLORS[trend]
                : getRegionColor(colony.geoRegion);

            const baseRadius = markerRadius(colony.totalBirds);
            const radius = isSelected ? baseRadius * 1.4 : baseRadius;
            const pos: L.LatLngExpression = [colony.latitude!, colony.longitude!];

            // Selected colony ring
            if (isSelected) {
                const ring = L.circleMarker(pos, {
                    radius: radius + 6,
                    color: color,
                    fillColor: "transparent",
                    fillOpacity: 0,
                    weight: 3,
                    opacity: 0.4,
                    interactive: false,
                    className: "selected-marker",
                });
                markerGroup.addLayer(ring);
            }

            // Main marker — solid fill, white border, drop shadow feel
            const marker = L.circleMarker(pos, {
                radius,
                color: "#ffffff",
                fillColor: color,
                fillOpacity: isSelected ? 1 : 0.85,
                weight: isSelected ? 3 : 2,
            });

            // Tooltip on hover (instant info, no click needed)
            marker.bindTooltip(
                `<div style="font-family:Inter,system-ui,sans-serif;padding:2px 0;">
                    <div style="font-weight:700;font-size:14px;color:#1f2937;">${colony.colonyName}</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:2px;">${colony.geoRegion}</div>
                    <div style="font-size:13px;font-weight:600;color:#1f2937;margin-top:6px;">${colony.totalBirds.toLocaleString()} birds · ${colony.totalNests.toLocaleString()} nests</div>
                </div>`,
                { direction: 'top', offset: [0, -radius], className: 'colony-tooltip' }
            );

            // Full popup on click
            marker.bindPopup(`
                <div style="font-size:14px;min-width:220px;font-family:Inter,system-ui,sans-serif;">
                    <p style="font-weight:700;font-size:17px;margin:0 0 2px 0;color:#111827;">${colony.colonyName}</p>
                    <p style="font-size:12px;color:#6b7280;margin:0 0 12px 0;">${colony.geoRegion}</p>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;font-size:14px;">
                        <span style="color:#6b7280;">Birds</span>
                        <span style="font-weight:700;text-align:right;color:#111827;">${colony.totalBirds.toLocaleString()}</span>
                        <span style="color:#6b7280;">Nests</span>
                        <span style="font-weight:700;text-align:right;color:#111827;">${colony.totalNests.toLocaleString()}</span>
                        <span style="color:#6b7280;">Species</span>
                        <span style="font-weight:700;text-align:right;color:#111827;">${colony.uniqueSpecies}</span>
                    </div>
                    <div style="margin-top:10px;padding-top:8px;border-top:1px solid #e5e7eb;">
                        <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;color:white;background:${color};">
                            ${trend === "growing" ? "Growing" : trend === "declining" ? "Declining" : trend === "stable" ? "Stable" : "No Trend Data"}
                        </span>
                    </div>
                </div>
            `, { className: 'colony-popup', maxWidth: 280 });

            if (onColonyClick) {
                marker.on("click", () => onColonyClick(colony));
            }

            // Hover enlarge
            marker.on("mouseover", () => {
                if (!isSelected) marker.setRadius(baseRadius * 1.25);
            });
            marker.on("mouseout", () => {
                if (!isSelected) marker.setRadius(baseRadius);
            });

            markerGroup.addLayer(marker);
        });

        // Fly to selected colony
        if (selectedColony) {
            const selected = validColonies.find(c => c.colonyName === selectedColony);
            if (selected) {
                map.flyTo([selected.latitude!, selected.longitude!], Math.max(map.getZoom(), 9), {
                    duration: 0.8,
                });
            }
        }

        if (shouldFitBounds && validColonies.length > 0) {
            const bounds = validColonies.map(c => [c.latitude!, c.longitude!] as [number, number]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
        }
    }, [validColonies, selectedColony, onColonyClick, shouldFitBounds, colonyTrends, colorMode]);

    // Invalidate map size on resize
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
            style={{ background: "#f0f4f8" }}
        />
    );
}

export { REGION_COLORS, getRegionColor, STATUS_COLORS };
