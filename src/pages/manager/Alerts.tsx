import { useState, useMemo } from "react";
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
    ChevronDown,
    ChevronRight,
    Clock,
    Eye,
    FileWarning,
    Leaf,
    MapPin,
    Search,
    Shield,
    ShieldAlert,
    TrendingDown,
    TrendingUp,
    Users,
    X,
    CheckCircle2,
    XCircle,
    Activity,
    Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";
type AlertStatus = "active" | "acknowledged" | "resolved" | "dismissed";
type AlertCategory =
    | "population"
    | "nest"
    | "behavior"
    | "health"
    | "predator"
    | "habitat"
    | "citizen"
    | "data-gap"
    | "endangered";

interface Alert {
    id: string;
    title: string;
    description: string;
    category: AlertCategory;
    severity: AlertSeverity;
    status: AlertStatus;
    colony: string;
    species?: string;
    region: string;
    timestamp: Date;
    action: string;
    details?: string;
}

const SPECIES_MAP: Record<string, string> = {
    FOTE: "Forster's Tern",
    LAGU: "Laughing Gull",
    SNEG: "Snowy Egret",
    TRHE: "Tricolored Heron",
    BRPE: "Brown Pelican",
    ROSP: "Roseate Spoonbill",
    GBHE: "Great Blue Heron",
    BCNH: "Black-crowned Night Heron",
};

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

const mockAlerts: Alert[] = [
    {
        id: "ALT-001",
        title: "Laughing Gull population drop at Biloxi South 2",
        description:
            "LAGU population decreased by 43% compared to previous survey period. Nest count dropped from 94 to 33 active nests.",
        category: "population",
        severity: "critical",
        status: "active",
        colony: "Biloxi South 2",
        species: "LAGU",
        region: "Biloxi South",
        timestamp: new Date(Date.now() - 1800000),
        action: "Investigate potential environmental stressors or food shortage in the colony area.",
        details:
            "Historical data shows LAGU sites at Biloxi South 2 averaging 50-94 nests per survey. The latest reading of 33 represents a 2-standard-deviation drop. Weather data shows recent storm activity in the region.",
    },
    {
        id: "ALT-002",
        title: "Forster's Tern nest decline — 60% drop in active nests",
        description:
            "FOTE active nest count at Biloxi South 2 fell from 99 to 29 nests within a single survey interval. Abandoned nests detected.",
        category: "nest",
        severity: "critical",
        status: "active",
        colony: "Biloxi South 2",
        species: "FOTE",
        region: "Biloxi South",
        timestamp: new Date(Date.now() - 3600000),
        action: "Deploy field team to assess nest abandonment causes. Check for oil spill contamination or predation.",
        details:
            "Dotting area analysis reveals concentrated nest loss in areas 3-5. EmptyNest counts have surged. Possible correlation with recent petroleum industry activity in adjacent waters.",
    },
    {
        id: "ALT-003",
        title: "Tricolored Heron nesting in non-traditional location",
        description:
            "TRHE detected nesting outside established colony boundaries at Biloxi South 2, Area 5. Birds observed building nests in unusual ground-level positions.",
        category: "behavior",
        severity: "medium",
        status: "acknowledged",
        colony: "Biloxi South 2",
        species: "TRHE",
        region: "Biloxi South",
        timestamp: new Date(Date.now() - 7200000),
        action: "Monitor new nesting sites and evaluate habitat suitability. Consider expanding protected zone.",
        details:
            "TRHE typically nests in elevated vegetation. Ground-level nesting may indicate habitat stress or lack of suitable nesting substrate. 18 active nests observed in new area.",
    },
    {
        id: "ALT-004",
        title: "Abnormal mortality signs in Snowy Egret colony",
        description:
            "Multiple SNEG individuals showing signs of lethargy and abnormal feather condition at Biloxi South 2. Chick survival rate dropped below 30%.",
        category: "health",
        severity: "high",
        status: "active",
        colony: "Biloxi South 2",
        species: "SNEG",
        region: "Biloxi South",
        timestamp: new Date(Date.now() - 5400000),
        action: "Collect samples for disease testing. Contact veterinary wildlife team immediately.",
        details:
            "SNEG nest counts show only 2-7 nests remaining from a peak of 11. ChickNestwithoutAdult counts are elevated. Potential avian influenza or environmental toxin exposure.",
    },
    {
        id: "ALT-005",
        title: "Predator activity detected near nesting colony",
        description:
            "Aerial imagery analysis detected potential predator presence (large raptors) circling Biloxi South 2 colony during nesting season.",
        category: "predator",
        severity: "high",
        status: "acknowledged",
        colony: "Biloxi South 2",
        region: "Biloxi South",
        timestamp: new Date(Date.now() - 10800000),
        action: "Deploy predator deterrent measures. Increase monitoring frequency in affected areas.",
        details:
            "Image analysis from Camera 2 shows multiple frames with raptor silhouettes near nesting areas 1-3. Coincides with increased nest abandonment in these zones.",
    },
    {
        id: "ALT-006",
        title: "Coastal erosion threatening nesting habitat",
        description:
            "Satellite and survey data indicate significant shoreline erosion at Biloxi South colony group. Estimated 15% habitat loss since last assessment.",
        category: "habitat",
        severity: "high",
        status: "active",
        colony: "Biloxi South 2",
        region: "Biloxi South",
        timestamp: new Date(Date.now() - 14400000),
        action: "Initiate habitat restoration assessment. Consider relocating vulnerable nests to higher ground.",
        details:
            "Deltaic Coastal Marshes region showing accelerated erosion. GeoRegion data for Biloxi South indicates the ExtrapArea is shrinking. Primary habitat classification may need updating.",
    },
    {
        id: "ALT-007",
        title: "Unusual submission pattern from citizen scientist",
        description:
            "Citizen scientist (ID: KMR) submitted 47 records in 30 minutes with inconsistent species labeling between LAGU and FOTE across identical photo frames.",
        category: "citizen",
        severity: "medium",
        status: "active",
        colony: "Biloxi South 2",
        region: "Biloxi South",
        timestamp: new Date(Date.now() - 18000000),
        action: "Review submitted records for accuracy. Contact contributor for clarification on labeling methodology.",
        details:
            "Dotter KMR's recent submissions show LAGU and FOTE labels applied to the same DottingAreaNumber across consecutive PhotoNumbers. This may indicate confusion between species or systematic labeling error.",
    },
    {
        id: "ALT-008",
        title: "Missing survey data for June 2013 period",
        description:
            "No survey data available for Biloxi South 2 colony between June 18-30, 2013. A 12-day monitoring gap detected during peak nesting season.",
        category: "data-gap",
        severity: "medium",
        status: "resolved",
        colony: "Biloxi South 2",
        region: "Biloxi South",
        timestamp: new Date(Date.now() - 86400000),
        action: "Schedule supplemental survey to fill gap. Cross-reference with adjacent colony data.",
        details:
            "Last recorded survey was 06/18/13 with entries across multiple dotting areas. Next recorded data jumps ahead. Peak nesting activity requires continuous monitoring coverage.",
    },
    {
        id: "ALT-009",
        title: "Roseate Spoonbill detected — Endangered species alert",
        description:
            "ROSP (Roseate Spoonbill) confirmed nesting at monitoring site. Species classified as threatened in Louisiana region. Requires immediate protection measures.",
        category: "endangered",
        severity: "critical",
        status: "active",
        colony: "Biloxi South 2",
        species: "ROSP",
        region: "Biloxi South",
        timestamp: new Date(Date.now() - 900000),
        action: "Activate enhanced protection protocol. Restrict access to nesting area. Notify state wildlife agency.",
        details:
            "Roseate Spoonbill is classified as a species of conservation concern. Detection during active nesting triggers mandatory reporting to Louisiana Department of Wildlife and Fisheries. Enhanced monitoring and buffer zone establishment required.",
    },
    {
        id: "ALT-010",
        title: "Brown Pelican population surge at Biloxi South",
        description:
            "BRPE population increased by 78% across the Biloxi South colony group. Potential overcrowding concern with existing LAGU and FOTE colonies.",
        category: "population",
        severity: "medium",
        status: "acknowledged",
        colony: "Biloxi South 2",
        species: "BRPE",
        region: "Biloxi South",
        timestamp: new Date(Date.now() - 21600000),
        action: "Assess carrying capacity and inter-species competition. Monitor nest density metrics.",
        details:
            "Brown Pelican recovery has been notable post-restoration. However, rapid increase may stress shared habitat resources. Total bird counts significantly elevated in latest survey.",
    },
    {
        id: "ALT-011",
        title: "Storm surge warning — Coastal Marshes region",
        description:
            "Weather service reports Category 2 storm approaching Deltaic Coastal Marshes. Biloxi South colonies at direct risk within 48-hour window.",
        category: "predator",
        severity: "critical",
        status: "active",
        colony: "Biloxi South 2",
        region: "Biloxi South",
        timestamp: new Date(Date.now() - 600000),
        action: "Activate emergency response protocol. Assess feasibility of nest relocation for critical species.",
        details:
            "Mississippi Estuarine Area marine ecoregion under storm warning. Historical data shows colony population crashes following major storm events. FOTE and LAGU nests are particularly vulnerable.",
    },
    {
        id: "ALT-012",
        title: "Water quality degradation near colony",
        description:
            "Environmental sensors indicate elevated turbidity and potential contaminant levels in waters adjacent to Biloxi South nesting areas.",
        category: "habitat",
        severity: "medium",
        status: "active",
        colony: "Biloxi South 2",
        region: "Biloxi South",
        timestamp: new Date(Date.now() - 43200000),
        action: "Collect water samples for laboratory analysis. Monitor bird feeding behavior for changes.",
        details:
            "Coastal Marshes primary habitat relies on clean water for fish populations that support nesting bird colonies. Degraded water quality can cascade into reduced food availability and chick mortality.",
    },
    {
        id: "ALT-013",
        title: "Great Blue Heron — rare species detection",
        description:
            "GBHE detected for the first time at Biloxi South 2 monitoring site. Single breeding pair observed establishing territory.",
        category: "endangered",
        severity: "low",
        status: "acknowledged",
        colony: "Biloxi South 2",
        species: "GBHE",
        region: "Biloxi South",
        timestamp: new Date(Date.now() - 36000000),
        action: "Document nesting activity. Add species to regular monitoring protocol for this colony.",
        details:
            "While not endangered, GBHE is uncommon at this specific colony location. Presence may indicate improving habitat conditions or displacement from other areas.",
    },
    {
        id: "ALT-014",
        title: "Incomplete camera coverage — Area 8 data missing",
        description:
            "Camera 2, Card 2 shows no photos from DottingArea 8+ for the May 2013 survey. Equipment malfunction suspected.",
        category: "data-gap",
        severity: "low",
        status: "resolved",
        colony: "Biloxi South 2",
        region: "Biloxi South",
        timestamp: new Date(Date.now() - 172800000),
        action: "Inspect camera equipment. Schedule supplementary aerial survey if needed.",
        details:
            "Camera 2, Card 2 photo sequence ends at image 0746. Expected coverage through image 0760+ based on colony extent. May result in undercount for eastern colony areas.",
    },
    {
        id: "ALT-015",
        title: "Excessive abandoned nests in Area 4",
        description:
            "DottingArea 4 at Biloxi South 2 showing 35% nest abandonment rate — well above the 10% baseline for this colony.",
        category: "nest",
        severity: "high",
        status: "active",
        colony: "Biloxi South 2",
        species: "FOTE",
        region: "Biloxi South",
        timestamp: new Date(Date.now() - 9000000),
        action: "Investigate localized disturbance. Check for human interference or environmental contamination.",
        details:
            "AbandNest counts elevated in dotting area 4. EmptyNest values also increasing. Adjacent areas (3 and 5) showing early signs of similar trend. Urgent field assessment recommended.",
    },
];

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

function AlertCard({
    alert,
    onStatusChange,
}: {
    alert: Alert;
    onStatusChange: (id: string, status: AlertStatus) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const catConfig = CATEGORY_CONFIG[alert.category];
    const sevConfig = SEVERITY_CONFIG[alert.severity];
    const statConfig = STATUS_CONFIG[alert.status];
    const CategoryIcon = catConfig.icon;
    const StatusIcon = statConfig.icon;

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
                                    {SPECIES_MAP[alert.species] ||
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

                        <div className="flex flex-wrap gap-2 pt-1">
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

export default function ManagerAlerts() {
    const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
    const [searchQuery, setSearchQuery] = useState("");
    const [severityFilter, setSeverityFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [activeTab, setActiveTab] = useState("active");

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
                            </p>
                        </div>
                    </div>
                </div>

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
                        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
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
