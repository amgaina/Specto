import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ManagerHeader } from "@/components/layout/ManagerHeader";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertTriangle,
    Bell,
    BellRing,
    Bird,
    CalendarPlus,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    Clock,
    CloudLightning,
    Eye,
    FileWarning,
    Leaf,
    Loader2,
    Map,
    MapPin,
    Megaphone,
    Phone,
    Search,
    Shield,
    ShieldAlert,
    Siren,
    TrendingDown,
    TrendingUp,
    Users,
    X,
    CheckCircle2,
    XCircle,
    Activity,
    Bookmark,
    Filter,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { useData } from "@/hooks/useData";
import { DataProvider } from "@/context/DataProvider";
import { SPECIES_NAMES } from "@/lib/dataService";
import {
    type Alert,
    type AlertSeverity,
    type AlertStatus,
    type AlertCategory,
    generateConservationAlerts,
} from "@/lib/alertService";
import { fetchWeatherAlerts } from "@/lib/weatherService";

const CATEGORY_CONFIG: Record<
    AlertCategory,
    { label: string; icon: typeof Bell; color: string; bgColor: string }
> = {
    population: {
        label: "Population Anomaly",
        icon: TrendingDown,
        color: "text-red-400",
        bgColor: "bg-red-500/20",
    },
    nest: {
        label: "Nest Movement/Decline",
        icon: Bird,
        color: "text-amber-400",
        bgColor: "bg-amber-500/20",
    },
    behavior: {
        label: "Unusual Behavior",
        icon: Eye,
        color: "text-purple-400",
        bgColor: "bg-purple-500/20",
    },
    health: {
        label: "Colony Health",
        icon: Activity,
        color: "text-rose-400",
        bgColor: "bg-rose-500/20",
    },
    predator: {
        label: "Predator/Threat",
        icon: ShieldAlert,
        color: "text-orange-400",
        bgColor: "bg-orange-500/20",
    },
    habitat: {
        label: "Habitat Change",
        icon: Leaf,
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/20",
    },
    citizen: {
        label: "Citizen Scientist",
        icon: Users,
        color: "text-blue-400",
        bgColor: "bg-blue-500/20",
    },
    "data-gap": {
        label: "Data Gap",
        icon: FileWarning,
        color: "text-slate-400",
        bgColor: "bg-slate-500/20",
    },
    endangered: {
        label: "Endangered Species",
        icon: Shield,
        color: "text-pink-400",
        bgColor: "bg-pink-500/20",
    },
    weather: {
        label: "Weather Alert",
        icon: CloudLightning,
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/20",
    },
};

const SEVERITY_CONFIG: Record<
    AlertSeverity,
    { label: string; className: string; dotColor: string }
> = {
    critical: {
        label: "Critical",
        className: "bg-red-500/20 text-red-300 border-red-500/30",
        dotColor: "bg-red-500",
    },
    high: {
        label: "High",
        className: "bg-orange-500/20 text-orange-300 border-orange-500/30",
        dotColor: "bg-orange-500",
    },
    medium: {
        label: "Medium",
        className: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        dotColor: "bg-amber-500",
    },
    low: {
        label: "Low",
        className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        dotColor: "bg-blue-500",
    },
    info: {
        label: "Info",
        className: "bg-slate-500/20 text-slate-300 border-slate-500/30",
        dotColor: "bg-slate-400",
    },
};

const STATUS_CONFIG: Record<
    AlertStatus,
    { label: string; icon: typeof Bell; className: string }
> = {
    active: {
        label: "Active",
        icon: BellRing,
        className: "text-red-400",
    },
    acknowledged: {
        label: "Acknowledged",
        icon: Eye,
        className: "text-amber-400",
    },
    resolved: {
        label: "Resolved",
        icon: CheckCircle2,
        className: "text-emerald-400",
    },
    dismissed: {
        label: "Dismissed",
        icon: XCircle,
        className: "text-slate-400",
    },
};


function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function getQuickActions(alert: Alert): { label: string; icon: typeof Bell; variant: "default" | "outline" | "ghost"; className?: string; toastTitle: string; toastDesc: string }[] {
    const actions: { label: string; icon: typeof Bell; variant: "default" | "outline" | "ghost"; className?: string; toastTitle: string; toastDesc: string }[] = [];
    const isCriticalOrHigh = alert.severity === "critical" || alert.severity === "high";

    if (alert.category === "weather") {
        actions.push(
            { label: "Emergency Protocol", icon: Siren, variant: "default", className: "bg-red-600 hover:bg-red-700 text-white", toastTitle: "Emergency Protocol Activated", toastDesc: `Storm response protocol initiated for ${alert.colony}. All field teams notified.` },
            { label: "Notify All Teams", icon: Megaphone, variant: "outline", toastTitle: "Broadcast Sent", toastDesc: `Weather alert broadcast to all field teams monitoring ${alert.colony} region.` },
        );
    } else if (alert.category === "endangered") {
        actions.push(
            { label: "Notify LDWF", icon: Megaphone, variant: "default", className: "bg-pink-600 hover:bg-pink-700 text-white", toastTitle: "Agency Notified", toastDesc: `Louisiana Dept. of Wildlife & Fisheries notified about ${alert.species} at ${alert.colony}.` },
            { label: "Call Field Team", icon: Phone, variant: "outline", toastTitle: "Calling Field Team", toastDesc: `Initiating call to field team lead for ${alert.colony} sector...` },
            { label: "Create Response Plan", icon: ClipboardList, variant: "outline", toastTitle: "Response Plan Created", toastDesc: `Protection plan generated for ${alert.species} at ${alert.colony}. Assigned to Dr. Sarah Mitchell.` },
        );
    } else if (alert.category === "population" && isCriticalOrHigh) {
        actions.push(
            { label: "Call Field Team", icon: Phone, variant: "outline", toastTitle: "Calling Field Team", toastDesc: `Initiating call to field team lead for ${alert.colony} sector...` },
            { label: "Create Response Plan", icon: ClipboardList, variant: "outline", toastTitle: "Response Plan Created", toastDesc: `Population decline investigation plan created for ${alert.species} at ${alert.colony}.` },
            { label: "Schedule Survey", icon: CalendarPlus, variant: "outline", toastTitle: "Survey Scheduled", toastDesc: `Emergency survey scheduled for ${alert.colony} — next available window: tomorrow 6:00 AM.` },
        );
    } else if (alert.category === "nest") {
        actions.push(
            { label: "Schedule Survey", icon: CalendarPlus, variant: "outline", toastTitle: "Survey Scheduled", toastDesc: `Nest assessment survey scheduled for ${alert.colony} — team bravo assigned.` },
            { label: "Call Field Team", icon: Phone, variant: "outline", toastTitle: "Calling Field Team", toastDesc: `Initiating call to nest monitoring team for ${alert.colony}...` },
        );
    } else if (alert.category === "data-gap") {
        actions.push(
            { label: "Schedule Survey", icon: CalendarPlus, variant: "outline", toastTitle: "Survey Scheduled", toastDesc: `Gap-fill survey scheduled for ${alert.colony} to restore data continuity.` },
        );
    } else if (alert.category === "habitat") {
        actions.push(
            { label: "Request Assessment", icon: ClipboardList, variant: "outline", toastTitle: "Assessment Requested", toastDesc: `Habitat assessment request filed for ${alert.colony}. Environmental team notified.` },
        );
    } else if (alert.category === "population") {
        actions.push(
            { label: "Schedule Survey", icon: CalendarPlus, variant: "outline", toastTitle: "Survey Scheduled", toastDesc: `Follow-up population survey scheduled for ${alert.colony}.` },
        );
    }

    // All alerts can view on map and add to watchlist
    actions.push(
        { label: "View on Map", icon: Map, variant: "ghost", toastTitle: "", toastDesc: "" },
    );

    if (alert.category !== "weather") {
        actions.push(
            { label: "Add to Watchlist", icon: Bookmark, variant: "ghost", toastTitle: "Added to Watchlist", toastDesc: `${alert.colony}${alert.species ? ` (${alert.species})` : ""} added to your monitoring watchlist.` },
        );
    }

    return actions;
}

function getResponsePlanSteps(alert: Alert): string[] {
    if (alert.category === "endangered") {
        return [
            `Establish 200m buffer zone around ${alert.species} nesting area at ${alert.colony}`,
            `File Form WL-9 with Louisiana Dept. of Wildlife & Fisheries within 24 hours`,
            `Deploy camera traps to monitor nest activity (minimum 2 units)`,
            `Restrict boat traffic and foot access to nesting quadrant`,
            `Schedule bi-weekly monitoring visits through end of nesting season`,
            `Coordinate with Dr. Sarah Mitchell (LDWF) for species recovery protocol`,
        ];
    }
    if (alert.category === "weather") {
        return [
            `Evacuate all field personnel from ${alert.colony} area`,
            `Secure monitoring equipment and camera stations`,
            `Activate satellite tracking on GPS-tagged individuals`,
            `Prepare post-storm assessment team (deploy within 48h of all-clear)`,
            `Notify partner agencies: USFWS, LDWF, coastal parish emergency mgmt`,
        ];
    }
    if (alert.category === "population" && (alert.severity === "critical" || alert.severity === "high")) {
        return [
            `Deploy field team to ${alert.colony} within 48 hours for ground assessment`,
            `Collect water and soil samples from nesting area for toxicology screening`,
            `Review aerial imagery from last 3 survey periods for habitat change`,
            `Check adjacent colonies for similar ${alert.species} population trends`,
            `File population decline report with state monitoring database`,
            `Schedule follow-up aerial survey within 2 weeks`,
        ];
    }
    if (alert.category === "nest") {
        return [
            `Conduct ground survey of abandoned nest sites at ${alert.colony}`,
            `Document evidence of predation, disturbance, or contamination`,
            `Install motion-activated cameras near affected nesting areas`,
            `Compare abandonment patterns with adjacent colonies`,
            `Report findings to regional coordinator within 7 days`,
        ];
    }
    if (alert.category === "habitat") {
        return [
            `Request satellite imagery comparison (current vs. 1 year ago) for ${alert.colony}`,
            `Measure vegetation cover, water levels, and substrate condition`,
            `Assess erosion rate and shoreline change at colony perimeter`,
            `Evaluate viability of habitat restoration or nest platform installation`,
            `Coordinate with Army Corps of Engineers if coastal infrastructure involved`,
        ];
    }
    return [
        `Review latest survey data for ${alert.colony}`,
        `Coordinate with field team lead for on-site assessment`,
        `Document findings and update monitoring database`,
        `Schedule follow-up survey within 30 days`,
    ];
}

function AlertCard({
    alert,
    onStatusChange,
    onNavigateToMap,
}: {
    alert: Alert;
    onStatusChange: (id: string, status: AlertStatus) => void;
    onNavigateToMap: (colony: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [showPlan, setShowPlan] = useState(false);
    const catConfig = CATEGORY_CONFIG[alert.category];
    const sevConfig = SEVERITY_CONFIG[alert.severity];
    const statConfig = STATUS_CONFIG[alert.status];
    const CategoryIcon = catConfig.icon;
    const StatusIcon = statConfig.icon;
    const quickActions = useMemo(() => getQuickActions(alert), [alert]);

    return (
        <Card
            className={cn(
                "glass-card transition-all duration-300 hover:border-primary/20",
                alert.status === "active" &&
                    alert.severity === "critical" &&
                    "border-red-500/30 shadow-red-500/5 shadow-lg"
            )}
        >
            <CardContent className="p-0">
                <div
                    className="flex items-start gap-4 p-4 cursor-pointer"
                    onClick={() => setExpanded(!expanded)}
                >
                    <div
                        className={cn(
                            "p-2.5 rounded-xl shrink-0 mt-0.5",
                            catConfig.bgColor
                        )}
                    >
                        <CategoryIcon
                            className={cn("h-5 w-5", catConfig.color)}
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <Badge
                                className={cn(
                                    "text-[10px] px-2 py-0 border",
                                    sevConfig.className
                                )}
                            >
                                <span
                                    className={cn(
                                        "w-1.5 h-1.5 rounded-full mr-1.5 inline-block",
                                        sevConfig.dotColor,
                                        alert.status === "active" &&
                                            (alert.severity === "critical" ||
                                                alert.severity === "high") &&
                                            "animate-pulse"
                                    )}
                                />
                                {sevConfig.label}
                            </Badge>
                            <Badge
                                variant="outline"
                                className="text-[10px] px-2 py-0"
                            >
                                {catConfig.label}
                            </Badge>
                            {alert.species && (
                                <Badge
                                    variant="secondary"
                                    className="text-[10px] px-2 py-0"
                                >
                                    {alert.species} —{" "}
                                    {SPECIES_NAMES[alert.species] ||
                                        alert.species}
                                </Badge>
                            )}
                        </div>

                        <h3 className="font-semibold text-sm leading-snug mb-1">
                            {alert.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {alert.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {alert.colony}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimeAgo(alert.timestamp)}
                            </span>
                            <span
                                className={cn(
                                    "flex items-center gap-1",
                                    statConfig.className
                                )}
                            >
                                <StatusIcon className="h-3 w-3" />
                                {statConfig.label}
                            </span>
                        </div>
                    </div>

                    <div className="shrink-0 hidden sm:block">
                        {expanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                    </div>
                </div>

                {expanded && (
                    <div className="border-t border-border/30 px-4 pb-4 pt-3 space-y-3 animate-in slide-in-from-top-1 duration-200">
                        {alert.details && (
                            <div className="bg-muted/20 rounded-lg p-3">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                    Details
                                </p>
                                <p className="text-sm leading-relaxed">
                                    {alert.details}
                                </p>
                            </div>
                        )}

                        <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                            <p className="text-xs font-medium text-primary mb-1">
                                Recommended Action
                            </p>
                            <p className="text-sm leading-relaxed">
                                {alert.action}
                            </p>
                        </div>

                        {/* Quick Actions */}
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                                Quick Actions
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {quickActions.map((action) => {
                                    const ActionIcon = action.icon;
                                    return (
                                        <Button
                                            key={action.label}
                                            size="sm"
                                            variant={action.variant}
                                            className={cn("h-7 text-xs", action.className)}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (action.label === "View on Map") {
                                                    onNavigateToMap(alert.colony);
                                                    return;
                                                }
                                                if (action.label === "Create Response Plan") {
                                                    setShowPlan(true);
                                                    toast.success(action.toastTitle, { description: action.toastDesc });
                                                    return;
                                                }
                                                toast.success(action.toastTitle, {
                                                    description: action.toastDesc,
                                                });
                                            }}
                                        >
                                            <ActionIcon className="h-3 w-3 mr-1.5" />
                                            {action.label}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Response Plan (shown when "Create Response Plan" is clicked) */}
                        {showPlan && (
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 animate-in slide-in-from-top-1 duration-200">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                                        <ClipboardList className="h-3.5 w-3.5" />
                                        Response Plan — {alert.colony}
                                    </p>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => { e.stopPropagation(); setShowPlan(false); }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                                <ol className="space-y-1.5">
                                    {getResponsePlanSteps(alert).map((step, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <span className="shrink-0 w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                                                {i + 1}
                                            </span>
                                            <span className="leading-relaxed">{step}</span>
                                        </li>
                                    ))}
                                </ol>
                                <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/20">
                                    Auto-generated plan · Assigned to current user · Created {new Date().toLocaleString()}
                                </p>
                            </div>
                        )}

                        {/* Status Actions */}
                        <div className="flex flex-wrap gap-2 pt-1 border-t border-border/20">
                            {alert.status === "active" && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onStatusChange(
                                                alert.id,
                                                "acknowledged"
                                            );
                                        }}
                                    >
                                        <Eye className="h-3 w-3 mr-1.5" />
                                        Acknowledge
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onStatusChange(
                                                alert.id,
                                                "resolved"
                                            );
                                        }}
                                    >
                                        <CheckCircle2 className="h-3 w-3 mr-1.5" />
                                        Resolve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs text-muted-foreground"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onStatusChange(
                                                alert.id,
                                                "dismissed"
                                            );
                                        }}
                                    >
                                        <X className="h-3 w-3 mr-1.5" />
                                        Dismiss
                                    </Button>
                                </>
                            )}
                            {alert.status === "acknowledged" && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onStatusChange(alert.id, "resolved");
                                    }}
                                >
                                    <CheckCircle2 className="h-3 w-3 mr-1.5" />
                                    Mark Resolved
                                </Button>
                            )}
                            {(alert.status === "resolved" ||
                                alert.status === "dismissed") && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onStatusChange(alert.id, "active");
                                    }}
                                >
                                    <BellRing className="h-3 w-3 mr-1.5" />
                                    Reopen
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function AlertsContent() {
    const navigate = useNavigate();
    const { records, colonyStats, loading: dataLoading } = useData();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [weatherLastChecked, setWeatherLastChecked] = useState<Date | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [severityFilter, setSeverityFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [activeTab, setActiveTab] = useState("active");

    // Generate conservation alerts from real CSV data
    const conservationAlerts = useMemo(() => {
        if (records.length === 0) return [];
        return generateConservationAlerts(records);
    }, [records]);

    // Fetch weather alerts
    useEffect(() => {
        if (colonyStats.length === 0) return;
        let cancelled = false;

        async function loadWeather() {
            setWeatherLoading(true);
            try {
                const result = await fetchWeatherAlerts(colonyStats);
                if (!cancelled) {
                    setWeatherLastChecked(result.lastChecked);
                    // Merge conservation + weather alerts
                    setAlerts([...conservationAlerts, ...result.alerts]);
                }
            } catch (err) {
                console.error("Weather alerts failed:", err);
                if (!cancelled) {
                    setAlerts(conservationAlerts);
                }
            } finally {
                if (!cancelled) setWeatherLoading(false);
            }
        }

        loadWeather();
        return () => { cancelled = true; };
    }, [colonyStats, conservationAlerts]);

    // Set conservation alerts immediately (weather will merge in later)
    useEffect(() => {
        if (conservationAlerts.length > 0 && alerts.length === 0) {
            setAlerts(conservationAlerts);
        }
    }, [conservationAlerts]);

    const handleStatusChange = (id: string, newStatus: AlertStatus) => {
        setAlerts((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
        );
    };

    const filteredAlerts = useMemo(() => {
        return alerts
            .filter((alert) => {
                if (activeTab === "active")
                    return (
                        alert.status === "active" ||
                        alert.status === "acknowledged"
                    );
                if (activeTab === "resolved")
                    return alert.status === "resolved";
                if (activeTab === "dismissed")
                    return alert.status === "dismissed";
                return true;
            })
            .filter((alert) => {
                if (severityFilter !== "all")
                    return alert.severity === severityFilter;
                return true;
            })
            .filter((alert) => {
                if (categoryFilter !== "all")
                    return alert.category === categoryFilter;
                return true;
            })
            .filter((alert) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return (
                    alert.title.toLowerCase().includes(q) ||
                    alert.description.toLowerCase().includes(q) ||
                    alert.colony.toLowerCase().includes(q) ||
                    (alert.species &&
                        alert.species.toLowerCase().includes(q))
                );
            })
            .sort((a, b) => {
                const severityOrder: Record<AlertSeverity, number> = {
                    critical: 0,
                    high: 1,
                    medium: 2,
                    low: 3,
                    info: 4,
                };
                if (severityOrder[a.severity] !== severityOrder[b.severity])
                    return (
                        severityOrder[a.severity] - severityOrder[b.severity]
                    );
                return b.timestamp.getTime() - a.timestamp.getTime();
            });
    }, [alerts, activeTab, severityFilter, categoryFilter, searchQuery]);

    const stats = useMemo(() => {
        const active = alerts.filter(
            (a) => a.status === "active" || a.status === "acknowledged"
        );
        return {
            total: alerts.length,
            active: active.length,
            critical: active.filter((a) => a.severity === "critical").length,
            high: active.filter((a) => a.severity === "high").length,
            resolved: alerts.filter((a) => a.status === "resolved").length,
        };
    }, [alerts]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        const active = alerts.filter(
            (a) => a.status === "active" || a.status === "acknowledged"
        );
        for (const alert of active) {
            counts[alert.category] = (counts[alert.category] || 0) + 1;
        }
        return counts;
    }, [alerts]);

    return (
        <div className="min-h-screen bg-background">
            <ManagerHeader />

            <main className="container mx-auto px-4 lg:px-8 pt-12 pb-12">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-amber-600">
                            <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">
                                Alert Center
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                Monitor and respond to wildlife alerts across
                                all colonies
                                {weatherLoading && (
                                    <span className="inline-flex items-center gap-1 ml-2 text-cyan-400">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Checking weather...
                                    </span>
                                )}
                                {weatherLastChecked && !weatherLoading && (
                                    <span className="ml-2 text-muted-foreground/60">
                                        · Weather checked {formatTimeAgo(weatherLastChecked)}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {dataLoading && (
                    <Card className="glass-card mb-6">
                        <CardContent className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-primary mr-3" />
                            <p className="text-muted-foreground">Analyzing colony data for alerts...</p>
                        </CardContent>
                    </Card>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <Card className="glass-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-500/20">
                                    <BellRing className="h-5 w-5 text-red-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {stats.active}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Active Alerts
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-red-400">
                                        {stats.critical}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Critical
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/20">
                                    <TrendingUp className="h-5 w-5 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-orange-400">
                                        {stats.high}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        High Priority
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-500/20">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-emerald-400">
                                        {stats.resolved}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Resolved
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Category Overview */}
                <Card className="glass-card mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">
                            Active Alerts by Category
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2">
                            {Object.entries(CATEGORY_CONFIG).map(
                                ([key, config]) => {
                                    const Icon = config.icon;
                                    const count = categoryCounts[key] || 0;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() =>
                                                setCategoryFilter(
                                                    categoryFilter === key
                                                        ? "all"
                                                        : key
                                                )
                                            }
                                            className={cn(
                                                "flex flex-col items-center gap-1.5 p-3 rounded-xl border border-transparent transition-all text-center",
                                                categoryFilter === key
                                                    ? "bg-primary/10 border-primary/30"
                                                    : "hover:bg-muted/30"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "p-2 rounded-lg",
                                                    config.bgColor
                                                )}
                                            >
                                                <Icon
                                                    className={cn(
                                                        "h-4 w-4",
                                                        config.color
                                                    )}
                                                />
                                            </div>
                                            <span className="text-[10px] text-muted-foreground leading-tight">
                                                {config.label}
                                            </span>
                                            {count > 0 && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] px-1.5 py-0 h-4"
                                                >
                                                    {count}
                                                </Badge>
                                            )}
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs + Filters + Alert List */}
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="space-y-4"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <TabsList className="w-full sm:w-auto">
                            <TabsTrigger value="active" className="text-xs">
                                <BellRing className="h-3.5 w-3.5 mr-1.5" />
                                Active
                                <Badge
                                    variant="secondary"
                                    className="ml-1.5 text-[10px] px-1.5 py-0 h-4"
                                >
                                    {stats.active}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="resolved" className="text-xs">
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                Resolved
                            </TabsTrigger>
                            <TabsTrigger value="dismissed" className="text-xs">
                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                Dismissed
                            </TabsTrigger>
                            <TabsTrigger value="all" className="text-xs">
                                All
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex flex-1 items-center gap-2">
                            <div className="relative flex-1 max-w-xs">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Search alerts..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="pl-8 h-9 text-sm"
                                />
                            </div>

                            <Select
                                value={severityFilter}
                                onValueChange={setSeverityFilter}
                            >
                                <SelectTrigger className="w-[130px] h-9 text-xs">
                                    <Filter className="h-3 w-3 mr-1.5" />
                                    <SelectValue placeholder="Severity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Severity
                                    </SelectItem>
                                    <SelectItem value="critical">
                                        Critical
                                    </SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">
                                        Medium
                                    </SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="info">Info</SelectItem>
                                </SelectContent>
                            </Select>

                            {(severityFilter !== "all" ||
                                categoryFilter !== "all" ||
                                searchQuery) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 text-xs text-muted-foreground"
                                    onClick={() => {
                                        setSeverityFilter("all");
                                        setCategoryFilter("all");
                                        setSearchQuery("");
                                    }}
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    {["active", "resolved", "dismissed", "all"].map(
                        (tabValue) => (
                            <TabsContent
                                key={tabValue}
                                value={tabValue}
                                className="space-y-3 mt-4"
                            >
                                {filteredAlerts.length === 0 ? (
                                    <Card className="glass-card">
                                        <CardContent className="flex flex-col items-center justify-center py-16">
                                            <div className="p-4 rounded-full bg-muted/30 mb-4">
                                                <Bell className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <p className="text-lg font-medium mb-1">
                                                No alerts found
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {searchQuery ||
                                                severityFilter !== "all" ||
                                                categoryFilter !== "all"
                                                    ? "Try adjusting your filters"
                                                    : "All clear — no alerts in this category"}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    filteredAlerts.map((alert) => (
                                        <AlertCard
                                            key={alert.id}
                                            alert={alert}
                                            onStatusChange={
                                                handleStatusChange
                                            }
                                            onNavigateToMap={(colony) => {
                                                navigate(`/manager/map?colony=${encodeURIComponent(colony)}`);
                                            }}
                                        />
                                    ))
                                )}
                            </TabsContent>
                        )
                    )}
                </Tabs>
            </main>
        </div>
    );
}

export default function ManagerAlerts() {
    return (
        <DataProvider>
            <AlertsContent />
        </DataProvider>
    );
}
