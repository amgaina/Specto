import { useMemo } from "react";
import { Bird, Home, MapPin, Camera, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useData } from "@/hooks/useData";
import { cn } from "@/lib/utils";

interface StatsOverviewProps {
    className?: string;
}

export function StatsOverview({ className }: StatsOverviewProps) {
    const { yearlyStats, speciesStats, colonyStats, filteredRecords, selectedYear, records } = useData();

    const stats = useMemo(() => {
        const currentYearStats = selectedYear
            ? yearlyStats.find((s) => s.year === selectedYear)
            : null;

        // Calculate previous year for comparison
        const prevYearStats = selectedYear && yearlyStats.length > 1
            ? yearlyStats.find((s) => s.year === selectedYear - 1)
            : null;

        // Total stats
        const totalBirds = currentYearStats?.totalBirds
            ?? yearlyStats.reduce((sum, s) => sum + s.totalBirds, 0);
        const totalNests = currentYearStats?.totalNests
            ?? yearlyStats.reduce((sum, s) => sum + s.totalNests, 0);
        const uniqueSpecies = speciesStats.length;
        const uniqueColonies = colonyStats.length;
        const totalObservations = currentYearStats?.observations ?? filteredRecords.length;

        // Trends
        let birdTrend = { direction: "stable" as "up" | "down" | "stable", value: "0%" };
        let nestTrend = { direction: "stable" as "up" | "down" | "stable", value: "0%" };

        if (prevYearStats && currentYearStats) {
            const birdChange = ((currentYearStats.totalBirds - prevYearStats.totalBirds) / prevYearStats.totalBirds) * 100;
            const nestChange = ((currentYearStats.totalNests - prevYearStats.totalNests) / prevYearStats.totalNests) * 100;

            birdTrend = {
                direction: birdChange > 5 ? "up" : birdChange < -5 ? "down" : "stable",
                value: `${birdChange > 0 ? "+" : ""}${birdChange.toFixed(1)}%`,
            };

            nestTrend = {
                direction: nestChange > 5 ? "up" : nestChange < -5 ? "down" : "stable",
                value: `${nestChange > 0 ? "+" : ""}${nestChange.toFixed(1)}%`,
            };
        }

        return {
            totalBirds,
            totalNests,
            uniqueSpecies,
            uniqueColonies,
            totalObservations,
            birdTrend,
            nestTrend,
            yearsOfData: yearlyStats.length,
        };
    }, [yearlyStats, speciesStats, colonyStats, filteredRecords, selectedYear]);

    const renderTrendIcon = (direction: "up" | "down" | "stable") => {
        switch (direction) {
            case "up":
                return <TrendingUp className="h-4 w-4 text-success" />;
            case "down":
                return <TrendingDown className="h-4 w-4 text-destructive" />;
            default:
                return <Minus className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getTrendColor = (direction: "up" | "down" | "stable") => {
        switch (direction) {
            case "up":
                return "text-success";
            case "down":
                return "text-destructive";
            default:
                return "text-muted-foreground";
        }
    };

    return (
        <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4", className)}>
            {/* Total Birds */}
            <div className="glass-card p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                        <Bird className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm text-muted-foreground truncate">Total Birds</p>
                    </div>
                </div>
                <div className="flex items-end justify-between">
                    <p className="font-display text-2xl font-bold">
                        {stats.totalBirds >= 1000
                            ? `${(stats.totalBirds / 1000).toFixed(1)}k`
                            : stats.totalBirds.toLocaleString()}
                    </p>
                    {selectedYear && stats.birdTrend.value !== "0%" && (
                        <div className={cn("flex items-center gap-1 text-sm", getTrendColor(stats.birdTrend.direction))}>
                            {renderTrendIcon(stats.birdTrend.direction)}
                            <span>{stats.birdTrend.value}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Total Nests */}
            <div className="glass-card p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 border border-warning/20">
                        <Home className="h-5 w-5 text-warning" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm text-muted-foreground truncate">Total Nests</p>
                    </div>
                </div>
                <div className="flex items-end justify-between">
                    <p className="font-display text-2xl font-bold">
                        {stats.totalNests >= 1000
                            ? `${(stats.totalNests / 1000).toFixed(1)}k`
                            : stats.totalNests.toLocaleString()}
                    </p>
                    {selectedYear && stats.nestTrend.value !== "0%" && (
                        <div className={cn("flex items-center gap-1 text-sm", getTrendColor(stats.nestTrend.direction))}>
                            {renderTrendIcon(stats.nestTrend.direction)}
                            <span>{stats.nestTrend.value}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Species Count */}
            <div className="glass-card p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 border border-success/20">
                        <Bird className="h-5 w-5 text-success" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm text-muted-foreground truncate">Species</p>
                    </div>
                </div>
                <p className="font-display text-2xl font-bold">{stats.uniqueSpecies}</p>
                <p className="text-xs text-muted-foreground mt-1">unique species</p>
            </div>

            {/* Colony Count */}
            <div className="glass-card p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 border border-info/20">
                        <MapPin className="h-5 w-5 text-info" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm text-muted-foreground truncate">Colonies</p>
                    </div>
                </div>
                <p className="font-display text-2xl font-bold">{stats.uniqueColonies}</p>
                <p className="text-xs text-muted-foreground mt-1">active colonies</p>
            </div>

            {/* Observations */}
            <div className="glass-card p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <Camera className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm text-muted-foreground truncate">Observations</p>
                    </div>
                </div>
                <p className="font-display text-2xl font-bold">
                    {stats.totalObservations >= 1000
                        ? `${(stats.totalObservations / 1000).toFixed(1)}k`
                        : stats.totalObservations.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    {selectedYear ? `in ${selectedYear}` : `across ${stats.yearsOfData} years`}
                </p>
            </div>
        </div>
    );
}
