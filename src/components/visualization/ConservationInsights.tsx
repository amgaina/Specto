import { useMemo } from "react";
import { useData } from "@/hooks/useData";
import { getColonyStats } from "@/lib/dataService";
import type { AvianRecord } from "@/lib/dataService";
import { AlertTriangle, TrendingUp, TrendingDown, Eye, Bird } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColonyTrend {
    name: string;
    region: string;
    peakBirds: number;
    latestBirds: number;
    changePercent: number;
    peakYear: number;
    latestYear: number;
}

function computeColonyTrends(records: AvianRecord[], availableYears: number[]): ColonyTrend[] {
    if (availableYears.length < 2) return [];

    const trends: ColonyTrend[] = [];
    const allColonyNames = new Set(records.map(r => r.ColonyName));

    allColonyNames.forEach(name => {
        const colRecords = records.filter(r => r.ColonyName === name);
        if (colRecords.length < 5) return; // need enough data

        // Aggregate birds per year for this colony
        const yearTotals = new Map<number, number>();
        colRecords.forEach(r => {
            yearTotals.set(r.Year, (yearTotals.get(r.Year) || 0) + (r.total_birds || 0));
        });

        let peakBirds = 0, peakYear = 0, latestBirds = 0, latestYear = 0;
        const region = colRecords[0]?.GeoRegion || "Unknown";

        yearTotals.forEach((birds, year) => {
            if (birds > peakBirds) { peakBirds = birds; peakYear = year; }
            if (year > latestYear) { latestYear = year; latestBirds = birds; }
        });

        if (peakBirds > 50) { // only meaningful colonies
            const changePercent = peakBirds > 0
                ? Math.round(((latestBirds - peakBirds) / peakBirds) * 100)
                : 0;

            trends.push({
                name,
                region,
                peakBirds: Math.round(peakBirds),
                latestBirds: Math.round(latestBirds),
                changePercent,
                peakYear,
                latestYear,
            });
        }
    });

    return trends;
}

interface ConservationInsightsProps {
    className?: string;
}

export function ConservationInsights({ className }: ConservationInsightsProps) {
    const { records, availableYears } = useData();

    const trends = useMemo(() => computeColonyTrends(records, availableYears), [records, availableYears]);

    const declining = useMemo(() =>
        trends.filter(t => t.changePercent < -30).sort((a, b) => a.changePercent - b.changePercent),
        [trends]
    );

    const recovering = useMemo(() =>
        trends.filter(t => t.changePercent > 50).sort((a, b) => b.changePercent - a.changePercent),
        [trends]
    );

    const surveyGaps = useMemo(() => {
        if (availableYears.length === 0) return [];
        const latestYear = availableYears[availableYears.length - 1];
        const recentThreshold = latestYear - 2;

        // Find colonies that appear in older data but not in recent years
        const allColonies = new Set(records.map(r => r.ColonyName));
        const recentColonies = new Set(records.filter(r => r.Year >= recentThreshold).map(r => r.ColonyName));

        return Array.from(allColonies)
            .filter(name => !recentColonies.has(name))
            .map(name => {
                const lastRecord = records
                    .filter(r => r.ColonyName === name)
                    .reduce((latest, r) => r.Year > latest.Year ? r : latest, records.find(r => r.ColonyName === name)!);
                return { name, lastSurveyYear: lastRecord.Year, region: lastRecord.GeoRegion };
            })
            .sort((a, b) => b.lastSurveyYear - a.lastSurveyYear);
    }, [records, availableYears]);

    const summary = useMemo(() => ({
        total: trends.length,
        declining: declining.length,
        recovering: recovering.length,
        stable: trends.filter(t => t.changePercent >= -30 && t.changePercent <= 50).length,
        gaps: surveyGaps.length,
    }), [trends, declining, recovering, surveyGaps]);

    if (trends.length === 0) return null;

    return (
        <div className={cn("glass-card p-6", className)}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                    <h3 className="font-display font-semibold">Conservation Insights</h3>
                    <p className="text-sm text-muted-foreground">
                        Automated alerts from {availableYears[0]}-{availableYears[availableYears.length - 1]} monitoring data
                    </p>
                </div>
            </div>

            {/* Summary badges */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive">
                    <TrendingDown className="h-3 w-3" />
                    {summary.declining} declining
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 text-xs font-medium text-success">
                    <TrendingUp className="h-3 w-3" />
                    {summary.recovering} recovering
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-xs font-medium text-muted-foreground">
                    <Bird className="h-3 w-3" />
                    {summary.stable} stable
                </div>
                {summary.gaps > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/20 text-xs font-medium text-warning">
                        <Eye className="h-3 w-3" />
                        {summary.gaps} survey gaps
                    </div>
                )}
            </div>

            {/* Declining colonies */}
            {declining.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Declining Colonies ({">"} 30% from peak)
                    </h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {declining.slice(0, 10).map(colony => (
                            <div key={colony.name} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{colony.name}</p>
                                    <p className="text-xs text-muted-foreground">{colony.region}</p>
                                </div>
                                <div className="text-right shrink-0 ml-4">
                                    <p className="text-sm font-bold text-destructive">{colony.changePercent}%</p>
                                    <p className="text-xs text-muted-foreground">
                                        {colony.peakBirds.toLocaleString()} ({colony.peakYear}) → {colony.latestBirds.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {declining.length > 10 && (
                            <p className="text-xs text-muted-foreground text-center pt-1">
                                ...and {declining.length - 10} more declining colonies
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Recovery stories */}
            {recovering.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Recovery Stories ({">"} 50% growth)
                    </h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {recovering.slice(0, 8).map(colony => (
                            <div key={colony.name} className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/10">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{colony.name}</p>
                                    <p className="text-xs text-muted-foreground">{colony.region}</p>
                                </div>
                                <div className="text-right shrink-0 ml-4">
                                    <p className="text-sm font-bold text-success">+{colony.changePercent}%</p>
                                    <p className="text-xs text-muted-foreground">
                                        {colony.peakYear} peak → {colony.latestBirds.toLocaleString()} latest
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Survey gaps */}
            {surveyGaps.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-warning mb-3 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Survey Gaps — Recommend Resurvey
                    </h4>
                    <div className="space-y-1 max-h-[150px] overflow-y-auto">
                        {surveyGaps.slice(0, 8).map(gap => (
                            <div key={gap.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-warning/5">
                                <span className="text-sm truncate">{gap.name}</span>
                                <span className="text-xs text-warning shrink-0 ml-2">Last surveyed {gap.lastSurveyYear}</span>
                            </div>
                        ))}
                        {surveyGaps.length > 8 && (
                            <p className="text-xs text-muted-foreground text-center pt-1">
                                {surveyGaps.length - 8} more colonies with survey gaps
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
