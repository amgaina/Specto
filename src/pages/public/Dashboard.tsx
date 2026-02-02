import { useState, useEffect } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Camera,
    Award,
    Clock,
    Star,
    TrendingUp,
    Upload,
    CheckCircle2,
    Target,
    Zap,
    Gift,
    Trophy,
    Medal,
    Crown,
    Bird,
} from "lucide-react";

interface UserData {
    name: string;
    credits: number;
    volunteerHours: number;
    badges: string[];
}

interface BadgeInfo {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    color: string;
    requiredCredits: number;
}

const BADGES: BadgeInfo[] = [
    {
        id: "first-upload",
        name: "First Flight",
        description: "Upload your first photo",
        icon: Camera,
        color: "from-blue-500 to-cyan-500",
        requiredCredits: 5,
    },
    {
        id: "week-streak",
        name: "Dedicated Observer",
        description: "Upload photos for 7 consecutive days",
        icon: Zap,
        color: "from-amber-500 to-orange-500",
        requiredCredits: 50,
    },
    {
        id: "hundred-club",
        name: "Century Club",
        description: "Earn 100 credits",
        icon: Star,
        color: "from-purple-500 to-pink-500",
        requiredCredits: 100,
    },
    {
        id: "species-spotter",
        name: "Species Spotter",
        description: "Identify 10 different species",
        icon: Bird,
        color: "from-green-500 to-emerald-500",
        requiredCredits: 150,
    },
    {
        id: "silver-contributor",
        name: "Silver Contributor",
        description: "Earn 250 credits",
        icon: Medal,
        color: "from-slate-400 to-slate-500",
        requiredCredits: 250,
    },
    {
        id: "gold-contributor",
        name: "Gold Contributor",
        description: "Earn 500 credits",
        icon: Trophy,
        color: "from-yellow-500 to-amber-500",
        requiredCredits: 500,
    },
    {
        id: "platinum-guardian",
        name: "Platinum Guardian",
        description: "Earn 1000 credits",
        icon: Crown,
        color: "from-cyan-400 to-blue-500",
        requiredCredits: 1000,
    },
];

export default function PublicDashboard() {
    const [user, setUser] = useState<UserData>({
        name: "Citizen",
        credits: 125,
        volunteerHours: 8.5,
        badges: ["first-upload", "week-streak"],
    });

    useEffect(() => {
        const stored = localStorage.getItem("specto-user");
        if (stored) {
            const parsed = JSON.parse(stored);
            setUser({
                name: parsed.name || "Citizen",
                credits: parsed.credits || 125,
                volunteerHours: parsed.volunteerHours || 8.5,
                badges: parsed.badges || ["first-upload", "week-streak"],
            });
        }
    }, []);

    const earnedBadges = BADGES.filter((b) => user.badges.includes(b.id));
    const nextBadge = BADGES.find((b) => !user.badges.includes(b.id) && b.requiredCredits > user.credits);
    const progressToNext = nextBadge ? (user.credits / nextBadge.requiredCredits) * 100 : 100;

    const recentActivity = [
        { type: "upload", description: "Uploaded 3 photos from Rabbit Island", credits: 15, time: "2 hours ago" },
        { type: "verified", description: "Photo verified - Brown Pelican spotted", credits: 10, time: "Yesterday" },
        { type: "badge", description: "Earned 'Dedicated Observer' badge", credits: 25, time: "3 days ago" },
        { type: "upload", description: "Uploaded sunset wildlife photo", credits: 5, time: "4 days ago" },
    ];

    // Calculate volunteer hour eligibility (10 credits = 0.5 volunteer hours)
    const qualifiedVolunteerHours = Math.floor(user.credits / 10) * 0.5;

    return (
        <div className="min-h-screen bg-background">
            <PublicHeader />

            <main className="container mx-auto px-4 lg:px-8 pt-24 pb-12">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}! 👋</h1>
                    <p className="text-muted-foreground">
                        Thank you for contributing to Louisiana's coastal wildlife conservation.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="glass-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500">
                                    <Star className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{user.credits}</p>
                                    <p className="text-xs text-muted-foreground">Total Credits</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                                    <Clock className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{user.volunteerHours}h</p>
                                    <p className="text-xs text-muted-foreground">Volunteer Hours</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                                    <Award className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{earnedBadges.length}</p>
                                    <p className="text-xs text-muted-foreground">Badges Earned</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                                    <Camera className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">24</p>
                                    <p className="text-xs text-muted-foreground">Photos Uploaded</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Quick Actions */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <a
                                        href="/public/upload"
                                        className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-green-500/30 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/50 transition-all group"
                                    >
                                        <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 group-hover:scale-110 transition-transform">
                                            <Upload className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">Upload Photos</h3>
                                            <p className="text-sm text-muted-foreground">Earn 5 credits per photo</p>
                                        </div>
                                    </a>

                                    <a
                                        href="/public/achievements"
                                        className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-all group"
                                    >
                                        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 group-hover:scale-110 transition-transform">
                                            <Trophy className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">View Badges</h3>
                                            <p className="text-sm text-muted-foreground">{BADGES.length - earnedBadges.length} more to unlock</p>
                                        </div>
                                    </a>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentActivity.map((activity, i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                                            <div className={`p-2 rounded-lg ${activity.type === "badge"
                                                    ? "bg-purple-500/20"
                                                    : activity.type === "verified"
                                                        ? "bg-green-500/20"
                                                        : "bg-blue-500/20"
                                                }`}>
                                                {activity.type === "badge" ? (
                                                    <Award className="h-4 w-4 text-purple-500" />
                                                ) : activity.type === "verified" ? (
                                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <Camera className="h-4 w-4 text-blue-500" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{activity.description}</p>
                                                <p className="text-xs text-muted-foreground">{activity.time}</p>
                                            </div>
                                            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                                                +{activity.credits}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Next Badge Progress */}
                        {nextBadge && (
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="h-5 w-5" />
                                        Next Badge
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center mb-4">
                                        <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${nextBadge.color} mb-3 opacity-50`}>
                                            <nextBadge.icon className="h-8 w-8 text-white" />
                                        </div>
                                        <h3 className="font-semibold">{nextBadge.name}</h3>
                                        <p className="text-sm text-muted-foreground">{nextBadge.description}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>{user.credits} credits</span>
                                            <span>{nextBadge.requiredCredits} needed</span>
                                        </div>
                                        <Progress value={progressToNext} className="h-2" />
                                        <p className="text-xs text-center text-muted-foreground">
                                            {nextBadge.requiredCredits - user.credits} credits to go!
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Volunteer Hours Info */}
                        <Card className="glass-card border-green-500/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-green-500" />
                                    Volunteer Hours
                                </CardTitle>
                                <CardDescription>
                                    Your contributions count towards volunteer service
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center p-4 rounded-xl bg-green-500/10 mb-4">
                                    <p className="text-3xl font-bold text-green-500">{qualifiedVolunteerHours}h</p>
                                    <p className="text-sm text-muted-foreground">Qualified Hours</p>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p>• 10 credits = 0.5 volunteer hours</p>
                                    <p>• Hours verified monthly</p>
                                    <p>• Download certificate anytime</p>
                                </div>
                                <Button className="w-full mt-4" variant="outline" asChild>
                                    <a href="/public/volunteer">View Details</a>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Earned Badges Preview */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Your Badges</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {earnedBadges.map((badge) => (
                                        <div
                                            key={badge.id}
                                            className={`p-2 rounded-lg bg-gradient-to-br ${badge.color}`}
                                            title={badge.name}
                                        >
                                            <badge.icon className="h-5 w-5 text-white" />
                                        </div>
                                    ))}
                                </div>
                                {earnedBadges.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        Upload photos to earn your first badge!
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
