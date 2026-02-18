import { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import { CalendarDays } from "lucide-react";
import { useData } from "@/hooks/useData";
import { cn } from "@/lib/utils";

interface MonthlyActivityChartProps {
    className?: string;
}

export function MonthlyActivityChart({ className }: MonthlyActivityChartProps) {
    const { monthlyStats, selectedYear } = useData();

    const chartData = useMemo(() => {
        return monthlyStats.map((stat) => ({
            ...stat,
            hasData: stat.observations > 0,
        }));
    }, [monthlyStats]);

    const peakMonth = useMemo(() => {
        let max = { month: "", birds: 0 };
        monthlyStats.forEach((stat) => {
            if (stat.totalBirds > max.birds) {
                max = { month: stat.month, birds: stat.totalBirds };
            }
        });
        return max;
    }, [monthlyStats]);

    const nestingSeasonMonths = ["Apr", "May", "Jun", "Jul"];

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: Record<string, number> }>; label?: string }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const isNestingSeason = label ? nestingSeasonMonths.includes(label) : false;

            return (
                <div className="glass-card p-3 shadow-lg border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-foreground">{label}</p>
                        {isNestingSeason && (
                            <span className="text-xs px-2 py-0.5 bg-warning/20 text-warning rounded-full">
                                Nesting Season
                            </span>
                        )}
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-muted-foreground">Total Birds:</span>
                            <span className="font-medium">{data.totalBirds.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-muted-foreground">Total Nests:</span>
                            <span className="font-medium">{data.totalNests.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-muted-foreground">Observations:</span>
                            <span className="font-medium">{data.observations.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const totalObservations = monthlyStats.reduce((sum, s) => sum + s.observations, 0);

    if (totalObservations === 0) {
        return (
            <div className={cn("glass-card p-6", className)}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 border border-info/20">
                        <CalendarDays className="h-5 w-5 text-info" />
                    </div>
                    <div>
                        <h3 className="font-display font-semibold">Monthly Activity</h3>
                        <p className="text-sm text-muted-foreground">No monthly data available</p>
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 border border-info/20">
                        <CalendarDays className="h-5 w-5 text-info" />
                    </div>
                    <div>
                        <h3 className="font-display font-semibold">Monthly Activity</h3>
                        <p className="text-sm text-muted-foreground">
                            {selectedYear ? `Seasonal patterns in ${selectedYear}` : "Seasonal patterns (all years)"}
                        </p>
                    </div>
                </div>

                {peakMonth.birds > 0 && (
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Peak Month</p>
                        <p className="font-display text-lg font-bold text-info">{peakMonth.month}</p>
                    </div>
                )}
            </div>

            {/* Chart */}
            <div className="h-[250px] overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--info))" stopOpacity={1} />
                                <stop offset="100%" stopColor="hsl(var(--info))" stopOpacity={0.6} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                        <XAxis
                            dataKey="month"
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
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />

                        {/* Nesting season highlight */}
                        <ReferenceLine x="Apr" stroke="hsl(var(--warning))" strokeDasharray="3 3" opacity={0.5} />
                        <ReferenceLine x="Jul" stroke="hsl(var(--warning))" strokeDasharray="3 3" opacity={0.5} />

                        <Bar
                            dataKey="totalBirds"
                            fill="url(#monthlyGradient)"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Season Legend */}
            <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-info" />
                        <span className="text-muted-foreground">Bird Activity</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-warning border-dashed" style={{ borderStyle: "dashed" }} />
                        <span className="text-muted-foreground">Nesting Season (Apr-Jul)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
