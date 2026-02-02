import { useMemo, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { useData } from "@/hooks/useData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ColonyStatsChartProps {
    className?: string;
    limit?: number;
}

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
        if (region.toLowerCase().includes(key.toLowerCase())) {
            return color;
        }
    }
    return REGION_COLORS.DEFAULT;
}

export function ColonyStatsChart({ className, limit = 15 }: ColonyStatsChartProps) {
    const { colonyStats, geoRegionStats, selectedYear } = useData();
    const [showAll, setShowAll] = useState(false);
    const [viewMode, setViewMode] = useState<"colonies" | "regions">("colonies");

    const colonyChartData = useMemo(() => {
        const data = showAll ? colonyStats : colonyStats.slice(0, limit);
        return data.map((stat) => ({
            ...stat,
            shortName: stat.colonyName.length > 20
                ? stat.colonyName.substring(0, 18) + "..."
                : stat.colonyName,
            color: getRegionColor(stat.geoRegion),
        }));
    }, [colonyStats, limit, showAll]);

    const regionChartData = useMemo(() => {
        return geoRegionStats.map((stat) => ({
            ...stat,
            shortName: stat.region.length > 25
                ? stat.region.substring(0, 23) + "..."
                : stat.region,
            color: getRegionColor(stat.region),
        }));
    }, [geoRegionStats]);

    const currentData = viewMode === "colonies" ? colonyChartData : regionChartData;

    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: Record<string, unknown> }> }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload as Record<string, number | string | null>;
            return (
                <div className="glass-card p-3 shadow-lg border border-border/50 max-w-xs">
                    <p className="font-semibold text-foreground truncate">
                        {data.colonyName || data.region}
                    </p>
                    {data.geoRegion && (
                        <p className="text-xs text-muted-foreground mb-2">{data.geoRegion}</p>
                    )}
                    <div className="space-y-1 mt-2">
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-muted-foreground">Total Birds:</span>
                            <span className="font-medium">{data.totalBirds.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-muted-foreground">Total Nests:</span>
                            <span className="font-medium">{data.totalNests.toLocaleString()}</span>
                        </div>
                        {data.uniqueSpecies !== undefined && (
                            <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="text-muted-foreground">Species:</span>
                                <span className="font-medium">{data.uniqueSpecies}</span>
                            </div>
                        )}
                        {data.colonies !== undefined && (
                            <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="text-muted-foreground">Colonies:</span>
                                <span className="font-medium">{data.colonies}</span>
                            </div>
                        )}
                        {data.latitude && data.longitude && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                <MapPin className="h-3 w-3" />
                                {Number(data.latitude).toFixed(4)}, {Number(data.longitude).toFixed(4)}
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    const totalColonies = colonyStats.length;
    const totalRegions = geoRegionStats.length;

    if (currentData.length === 0) {
        return (
            <div className={cn("glass-card p-6", className)}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 border border-success/20">
                        <MapPin className="h-5 w-5 text-success" />
                    </div>
                    <div>
                        <h3 className="font-display font-semibold">Colony Statistics</h3>
                        <p className="text-sm text-muted-foreground">No colony data available</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("glass-card p-6", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 border border-success/20">
                        <MapPin className="h-5 w-5 text-success" />
                    </div>
                    <div>
                        <h3 className="font-display font-semibold">
                            {viewMode === "colonies" ? "Top Colonies" : "Geographic Regions"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {selectedYear
                                ? `${viewMode === "colonies" ? totalColonies : totalRegions} ${viewMode} in ${selectedYear}`
                                : `${viewMode === "colonies" ? totalColonies : totalRegions} ${viewMode} (all years)`}
                        </p>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
                    <Button
                        variant={viewMode === "colonies" ? "hero" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("colonies")}
                        className="h-7 px-3 text-xs"
                    >
                        Colonies
                    </Button>
                    <Button
                        variant={viewMode === "regions" ? "hero" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("regions")}
                        className="h-7 px-3 text-xs"
                    >
                        Regions
                    </Button>
                </div>
            </div>

            {/* Chart */}
            <ScrollArea className={showAll && viewMode === "colonies" ? "h-[400px]" : "h-[300px]"}>
                <div style={{ height: Math.max(300, currentData.length * 28) }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={currentData}
                            layout="vertical"
                            margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} horizontal={false} />
                            <XAxis
                                type="number"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                            />
                            <YAxis
                                type="category"
                                dataKey="shortName"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                width={100}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
                            <Bar dataKey="totalBirds" radius={[0, 4, 4, 0]}>
                                {currentData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </ScrollArea>

            {/* Show More/Less */}
            {viewMode === "colonies" && colonyStats.length > limit && (
                <div className="mt-4 pt-4 border-t border-border/50 text-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAll(!showAll)}
                        className="text-sm"
                    >
                        {showAll ? (
                            <>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Show Less
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                Show All {totalColonies} Colonies
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
