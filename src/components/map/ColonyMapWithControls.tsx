import { useMemo, useState } from "react";
import { ColonyMap, REGION_COLORS, getRegionColor } from "./ColonyMap";
import { useData } from "@/hooks/useData";
import { getColonyStats } from "@/lib/dataService";
import type { ColonyStats } from "@/lib/dataService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bird, MapPin, Home } from "lucide-react";

interface ColonyMapWithControlsProps {
    className?: string;
    onColonySelect?: (colony: ColonyStats) => void;
    selectedColonyName?: string | null;
}

export function ColonyMapWithControls({
    className = "h-full",
    onColonySelect,
    selectedColonyName,
}: ColonyMapWithControlsProps) {
    const { records, colonyStats, uniqueGeoRegions, uniqueSpecies, availableYears, selectedYear, setSelectedYear } = useData();
    const [regionFilter, setRegionFilter] = useState<string>("all");
    const [speciesFilter, setSpeciesFilter] = useState<string>("all");

    // Recompute colony stats when year filter changes
    const filteredColonies = useMemo(() => {
        let filtered = selectedYear
            ? getColonyStats(records, selectedYear)
            : colonyStats;

        if (regionFilter !== "all") {
            filtered = filtered.filter(c => c.geoRegion === regionFilter);
        }
        if (speciesFilter !== "all") {
            // Filter records by species first, then recompute colony stats
            const speciesRecords = records.filter(r =>
                r.SpeciesCode === speciesFilter &&
                (!selectedYear || r.Year === selectedYear)
            );
            const speciesColonyStats = getColonyStats(speciesRecords);
            filtered = speciesColonyStats.filter(c =>
                regionFilter === "all" || c.geoRegion === regionFilter
            );
        }

        return filtered;
    }, [records, colonyStats, selectedYear, regionFilter, speciesFilter]);

    const stats = useMemo(() => ({
        colonies: filteredColonies.length,
        totalBirds: filteredColonies.reduce((s, c) => s + c.totalBirds, 0),
        totalNests: filteredColonies.reduce((s, c) => s + c.totalNests, 0),
    }), [filteredColonies]);

    // Get unique regions that appear in the filtered data
    const regionColors = useMemo(() => {
        const regions = new Set(filteredColonies.map(c => c.geoRegion).filter(Boolean));
        return Array.from(regions).map(r => ({ region: r, color: getRegionColor(r) })).slice(0, 8);
    }, [filteredColonies]);

    return (
        <div className={className}>
            {/* Controls Bar */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-black/40 border-b border-white/5">
                {/* Stats */}
                <div className="flex items-center gap-4 mr-auto">
                    <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span className="font-bold">{stats.colonies}</span>
                        <span className="text-muted-foreground">colonies</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <Bird className="h-3.5 w-3.5 text-primary" />
                        <span className="font-bold">{stats.totalBirds.toLocaleString()}</span>
                        <span className="text-muted-foreground">birds</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <Home className="h-3.5 w-3.5 text-primary" />
                        <span className="font-bold">{stats.totalNests.toLocaleString()}</span>
                        <span className="text-muted-foreground">nests</span>
                    </div>
                </div>

                {/* Year Filter */}
                <Select
                    value={selectedYear?.toString() ?? "all"}
                    onValueChange={(v) => setSelectedYear(v === "all" ? null : parseInt(v))}
                >
                    <SelectTrigger className="w-[100px] h-8 text-xs bg-white/5 border-white/10">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {availableYears.map(y => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Region Filter */}
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                    <SelectTrigger className="w-[160px] h-8 text-xs bg-white/5 border-white/10">
                        <SelectValue placeholder="Region" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Regions</SelectItem>
                        {uniqueGeoRegions.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Species Filter */}
                <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                    <SelectTrigger className="w-[120px] h-8 text-xs bg-white/5 border-white/10">
                        <SelectValue placeholder="Species" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Species</SelectItem>
                        {uniqueSpecies.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Map */}
            <div className="flex-1 relative" style={{ minHeight: 400 }}>
                <ColonyMap
                    colonies={filteredColonies}
                    onColonyClick={onColonySelect}
                    selectedColony={selectedColonyName}
                    className="h-full w-full"
                    interactive
                    fitBounds={false}
                />

                {/* Legend overlay */}
                <div className="absolute bottom-4 left-4 z-[1000] bg-black/80 backdrop-blur-sm rounded-xl p-3 border border-white/10 max-w-[200px]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Regions</p>
                    <div className="space-y-1">
                        {regionColors.map(({ region, color }) => (
                            <div key={region} className="flex items-center gap-2 text-[10px]">
                                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                <span className="text-white/70 truncate">{region}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-2 border-t border-white/10 pt-2">
                        Marker size = population
                    </p>
                </div>
            </div>
        </div>
    );
}
