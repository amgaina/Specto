import { useMemo } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine,
} from "recharts";
import { TrendingUp, Bird, Home } from "lucide-react";
import { useData } from "@/hooks/useData";
import { cn } from "@/lib/utils";

interface YearlyTrendChartProps {
    className?: string;
    showNests?: boolean;
    showBirds?: boolean;
}

export function YearlyTrendChart({ className, showNests = true, showBirds = true }: YearlyTrendChartProps) {
    const { yearlyStats, selectedYear } = useData();

    const chartData = useMemo(() => {
        return yearlyStats.map((stat) => ({
            ...stat,
            isSelected: stat.year === selectedYear,
        }));
    }, [yearlyStats, selectedYear]);

    const totals = useMemo(() => {
        const data = selectedYear
            ? yearlyStats.filter((s) => s.year === selectedYear)
            : yearlyStats;

        return {
            totalBirds: data.reduce((sum, s) => sum + s.totalBirds, 0),
            totalNests: data.reduce((sum, s) => sum + s.totalNests, 0),
            avgBirds: Math.round(data.reduce((sum, s) => sum + s.totalBirds, 0) / (data.length || 1)),
            avgNests: Math.round(data.reduce((sum, s) => sum + s.totalNests, 0) / (data.length || 1)),
        };
    }, [yearlyStats, selectedYear]);

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-card p-3 shadow-lg border border-border/50">
                    <p className="font-semibold text-foreground mb-2">{label}</p>
                    {payload.map((entry, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground">{entry.name}:</span>
                            <span className="font-medium">{entry.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (chartData.length === 0) {
        return (
            <div className={cn("glass-card p-6", className)}>
                <p className="text-muted-foreground text-center">No data available</p>
            </div>
        );
    }

    return (
        <div className={cn("glass-card p-6", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 border border-success/20">
                        <TrendingUp className="h-5 w-5 text-success" />
                    </div>
                    <div>
                        <h3 className="font-display font-semibold">Population Trends</h3>
                        <p className="text-sm text-muted-foreground">
                            Bird counts and nesting activity over time
                        </p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-4">
                    {showBirds && (
                        <div className="text-right">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Bird className="h-4 w-4" />
                                <span>Avg Birds/Year</span>
                            </div>
                            <p className="font-display text-xl font-bold text-primary">
                                {totals.avgBirds.toLocaleString()}
                            </p>
                        </div>
                    )}
                    {showNests && (
                        <div className="text-right">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Home className="h-4 w-4" />
                                <span>Avg Nests/Year</span>
                            </div>
                            <p className="font-display text-xl font-bold text-warning">
                                {totals.avgNests.toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chart */}
            <div className="h-[300px] overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorBirds" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorNests" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis
                            dataKey="year"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine
                            x={2010}
                            stroke="hsl(var(--destructive))"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{
                                value: "Deepwater Horizon",
                                position: "top",
                                fill: "hsl(var(--destructive))",
                                fontSize: 10,
                                fontWeight: 600,
                            }}
                        />
                        <Legend />
                        {showBirds && (
                            <Area
                                type="monotone"
                                dataKey="totalBirds"
                                name="Total Birds"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                fill="url(#colorBirds)"
                                dot={(props) => {
                                    const { cx, cy, payload } = props as { cx: number; cy: number; payload: { isSelected: boolean } };
                                    if (payload.isSelected) {
                                        return (
                                            <circle
                                                cx={cx}
                                                cy={cy}
                                                r={6}
                                                fill="hsl(var(--primary))"
                                                stroke="hsl(var(--background))"
                                                strokeWidth={2}
                                            />
                                        );
                                    }
                                    return null;
                                }}
                            />
                        )}
                        {showNests && (
                            <Area
                                type="monotone"
                                dataKey="totalNests"
                                name="Total Nests"
                                stroke="hsl(var(--warning))"
                                strokeWidth={2}
                                fill="url(#colorNests)"
                                dot={(props) => {
                                    const { cx, cy, payload } = props as { cx: number; cy: number; payload: { isSelected: boolean } };
                                    if (payload.isSelected) {
                                        return (
                                            <circle
                                                cx={cx}
                                                cy={cy}
                                                r={6}
                                                fill="hsl(var(--warning))"
                                                stroke="hsl(var(--background))"
                                                strokeWidth={2}
                                            />
                                        );
                                    }
                                    return null;
                                }}
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
