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
    PieChart,
    Pie,
    Legend,
} from "recharts";
import { Bird, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { useData } from "@/hooks/useData";
import { getSpeciesName, getSpeciesColor, getSpeciesTrend } from "@/lib/dataService";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SpeciesDistributionChartProps {
    className?: string;
    limit?: number;
}

type ChartView = "bar" | "pie";

export function SpeciesDistributionChart({ className, limit = 10 }: SpeciesDistributionChartProps) {
    const { speciesStats, records, selectedYear } = useData();
    const [chartView, setChartView] = useState<ChartView>("bar");
    const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);

    const chartData = useMemo(() => {
        return speciesStats.slice(0, limit).map((stat) => ({
            ...stat,
            name: stat.speciesName,
            shortName: stat.speciesCode,
        }));
    }, [speciesStats, limit]);

    const pieData = useMemo(() => {
        const top = speciesStats.slice(0, limit);
        const other = speciesStats.slice(limit);
        const otherTotal = other.reduce((sum, s) => sum + s.totalBirds, 0);

        const data = top.map((stat) => ({
            name: stat.speciesCode,
            fullName: stat.speciesName,
            value: stat.totalBirds,
            color: stat.color,
        }));

        if (otherTotal > 0) {
            data.push({
                name: "Other",
                fullName: `Other (${other.length} species)`,
                value: otherTotal,
                color: "#6B7280",
            });
        }

        return data;
    }, [speciesStats, limit]);

    const speciesTrendData = useMemo(() => {
        if (!selectedSpecies) return null;
        return getSpeciesTrend(records, selectedSpecies);
    }, [records, selectedSpecies]);

    const getSpeciesTrendIndicator = (code: string) => {
        const trend = getSpeciesTrend(records, code);
        if (trend.length < 2) return "stable";

        const recent = trend.slice(-3);
        const earlier = trend.slice(-6, -3);

        if (recent.length === 0 || earlier.length === 0) return "stable";

        const recentAvg = recent.reduce((sum, t) => sum + t.totalBirds, 0) / recent.length;
        const earlierAvg = earlier.reduce((sum, t) => sum + t.totalBirds, 0) / earlier.length;

        const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;

        if (change > 10) return "up";
        if (change < -10) return "down";
        return "stable";
    };

    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: Record<string, unknown> }> }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload as Record<string, number | string>;
            return (
                <div className="glass-card p-3 shadow-lg border border-border/50">
                    <p className="font-semibold text-foreground">{data.speciesName || data.fullName}</p>
                    <p className="text-sm text-muted-foreground">{data.speciesCode || data.name}</p>
                    <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-muted-foreground">Total Birds:</span>
                            <span className="font-medium">{(data.totalBirds || data.value).toLocaleString()}</span>
                        </div>
                        {data.totalNests !== undefined && (
                            <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="text-muted-foreground">Total Nests:</span>
                                <span className="font-medium">{data.totalNests.toLocaleString()}</span>
                            </div>
                        )}
                        {data.observations !== undefined && (
                            <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="text-muted-foreground">Observations:</span>
                                <span className="font-medium">{data.observations.toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderTrendIcon = (trend: string) => {
        switch (trend) {
            case "up":
                return <ArrowUpRight className="h-4 w-4 text-success" />;
            case "down":
                return <ArrowDownRight className="h-4 w-4 text-destructive" />;
            default:
                return <Minus className="h-4 w-4 text-muted-foreground" />;
        }
    };

    if (chartData.length === 0) {
        return (
            <div className={cn("glass-card p-6", className)}>
                <p className="text-muted-foreground text-center">No species data available</p>
            </div>
        );
    }

    return (
        <div className={cn("glass-card p-6", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                        <Bird className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-display font-semibold">Species Distribution</h3>
                        <p className="text-sm text-muted-foreground">
                            {selectedYear ? `Top ${limit} species in ${selectedYear}` : `Top ${limit} species (all years)`}
                        </p>
                    </div>
                </div>

                {/* Chart View Toggle */}
                <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
                    <Button
                        variant={chartView === "bar" ? "hero" : "ghost"}
                        size="sm"
                        onClick={() => setChartView("bar")}
                        className="h-7 px-3 text-xs"
                    >
                        Bar
                    </Button>
                    <Button
                        variant={chartView === "pie" ? "hero" : "ghost"}
                        size="sm"
                        onClick={() => setChartView("pie")}
                        className="h-7 px-3 text-xs"
                    >
                        Pie
                    </Button>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[300px] overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                    {chartView === "bar" ? (
                        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
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
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                width={50}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
                            <Bar
                                dataKey="totalBirds"
                                radius={[0, 4, 4, 0]}
                                onClick={(data) => setSelectedSpecies(data.speciesCode)}
                                className="cursor-pointer"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        opacity={selectedSpecies && selectedSpecies !== entry.speciesCode ? 0.4 : 1}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    ) : (
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                                onClick={(data) => setSelectedSpecies(data.name !== "Other" ? data.name : null)}
                                className="cursor-pointer"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        opacity={selectedSpecies && selectedSpecies !== entry.name ? 0.4 : 1}
                                        stroke="hsl(var(--background))"
                                        strokeWidth={2}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                formatter={(value) => (
                                    <span className="text-xs text-muted-foreground">{value}</span>
                                )}
                            />
                        </PieChart>
                    )}
                </ResponsiveContainer>
            </div>

            {/* Species Legend / Details */}
            <div className="mt-4 pt-4 border-t border-border/50">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {chartData.slice(0, 5).map((species) => (
                        <button
                            key={species.speciesCode}
                            onClick={() => setSelectedSpecies(
                                selectedSpecies === species.speciesCode ? null : species.speciesCode
                            )}
                            className={cn(
                                "flex items-center gap-2 p-2 rounded-lg text-left transition-all",
                                selectedSpecies === species.speciesCode
                                    ? "bg-primary/10 border border-primary/30"
                                    : "hover:bg-muted/50"
                            )}
                        >
                            <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: species.color }}
                            />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">{species.speciesCode}</p>
                                <p className="text-xs text-muted-foreground truncate">{species.totalBirds.toLocaleString()}</p>
                            </div>
                            {renderTrendIcon(getSpeciesTrendIndicator(species.speciesCode))}
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected Species Info */}
            {selectedSpecies && (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h4 className="font-semibold">{getSpeciesName(selectedSpecies)}</h4>
                            <p className="text-sm text-muted-foreground">{selectedSpecies}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedSpecies(null)}>
                            Clear
                        </Button>
                    </div>
                    {speciesTrendData && speciesTrendData.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                            Observed in {speciesTrendData.length} years, from {speciesTrendData[0].year} to{" "}
                            {speciesTrendData[speciesTrendData.length - 1].year}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
