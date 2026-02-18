import { useState, useEffect } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Award,
    Star,
    Camera,
    Zap,
    Bird,
    Medal,
    Trophy,
    Crown,
    Lock,
    CheckCircle2,
    Target,
    Flame,
    Heart,
    Shield,
    Eye,
} from "lucide-react";

interface BadgeInfo {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    requiredCredits: number;
    category: "contribution" | "milestone" | "special";
}

const ALL_BADGES: BadgeInfo[] = [
    // Contribution Badges
    {
        id: "first-upload",
        name: "First Flight",
        description: "Upload your first wildlife photo",
        icon: Camera,
        color: "from-blue-500 to-cyan-500",
        bgColor: "bg-blue-500/20",
        requiredCredits: 5,
        category: "contribution",
    },
    {
        id: "week-streak",
        name: "Dedicated Observer",
        description: "Upload photos for 7 consecutive days",
        icon: Zap,
        color: "from-amber-500 to-orange-500",
        bgColor: "bg-amber-500/20",
        requiredCredits: 50,
        category: "contribution",
    },
    {
        id: "species-spotter",
        name: "Species Spotter",
        description: "Identify 10 different species in your photos",
        icon: Bird,
        color: "from-green-500 to-emerald-500",
        bgColor: "bg-green-500/20",
        requiredCredits: 150,
        category: "contribution",
    },
    {
        id: "early-bird",
        name: "Early Bird",
        description: "Upload a photo before 7 AM",
        icon: Eye,
        color: "from-pink-500 to-rose-500",
        bgColor: "bg-pink-500/20",
        requiredCredits: 25,
        category: "contribution",
    },
    {
        id: "monthly-warrior",
        name: "Monthly Warrior",
        description: "Upload at least one photo every day for a month",
        icon: Flame,
        color: "from-red-500 to-orange-500",
        bgColor: "bg-red-500/20",
        requiredCredits: 300,
        category: "contribution",
    },
    // Milestone Badges
    {
        id: "hundred-club",
        name: "Century Club",
        description: "Earn 100 credits",
        icon: Star,
        color: "from-purple-500 to-pink-500",
        bgColor: "bg-purple-500/20",
        requiredCredits: 100,
        category: "milestone",
    },
    {
        id: "silver-contributor",
        name: "Silver Contributor",
        description: "Earn 250 credits",
        icon: Medal,
        color: "from-slate-400 to-slate-500",
        bgColor: "bg-slate-400/20",
        requiredCredits: 250,
        category: "milestone",
    },
    {
        id: "gold-contributor",
        name: "Gold Contributor",
        description: "Earn 500 credits",
        icon: Trophy,
        color: "from-yellow-500 to-amber-500",
        bgColor: "bg-yellow-500/20",
        requiredCredits: 500,
        category: "milestone",
    },
    {
        id: "platinum-guardian",
        name: "Platinum Guardian",
        description: "Earn 1000 credits",
        icon: Crown,
        color: "from-cyan-400 to-blue-500",
        bgColor: "bg-cyan-400/20",
        requiredCredits: 1000,
        category: "milestone",
    },
    {
        id: "diamond-legend",
        name: "Diamond Legend",
        description: "Earn 2500 credits - True conservation hero!",
        icon: Shield,
        color: "from-violet-500 to-purple-600",
        bgColor: "bg-violet-500/20",
        requiredCredits: 2500,
        category: "milestone",
    },
    // Special Badges
    {
        id: "community-hero",
        name: "Community Hero",
        description: "Help verify 50 photos from other users",
        icon: Heart,
        color: "from-rose-500 to-pink-500",
        bgColor: "bg-rose-500/20",
        requiredCredits: 200,
        category: "special",
    },
    {
        id: "rare-find",
        name: "Rare Find",
        description: "Photograph a rare or endangered species",
        icon: Target,
        color: "from-teal-500 to-cyan-500",
        bgColor: "bg-teal-500/20",
        requiredCredits: 100,
        category: "special",
    },
];

export default function Achievements({ embedded = false }: { embedded?: boolean }) {
    const [userCredits, setUserCredits] = useState(125);
    const [earnedBadges, setEarnedBadges] = useState<string[]>(["first-upload", "week-streak"]);

    useEffect(() => {
        const stored = localStorage.getItem("specto-user");
        if (stored) {
            const user = JSON.parse(stored);
            setUserCredits(user.credits || 125);
            setEarnedBadges(user.badges || ["first-upload", "week-streak"]);
        }
    }, []);

    const contributionBadges = ALL_BADGES.filter((b) => b.category === "contribution");
    const milestoneBadges = ALL_BADGES.filter((b) => b.category === "milestone");
    const specialBadges = ALL_BADGES.filter((b) => b.category === "special");

    const totalEarned = earnedBadges.length;
    const totalBadges = ALL_BADGES.length;

    const renderBadgeCard = (badge: BadgeInfo) => {
        const isEarned = earnedBadges.includes(badge.id);
        const progress = Math.min((userCredits / badge.requiredCredits) * 100, 100);

        return (
            <div
                key={badge.id}
                className={`relative p-4 rounded-xl border transition-all ${isEarned
                        ? `${badge.bgColor} border-transparent`
                        : "border-border/50 bg-muted/20 opacity-60 hover:opacity-80"
                    }`}
            >
                {isEarned && (
                    <div className="absolute top-2 right-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                )}
                <div className="flex flex-col items-center text-center">
                    <div
                        className={`p-4 rounded-2xl bg-gradient-to-br ${badge.color} mb-3 ${!isEarned ? "grayscale" : ""
                            }`}
                    >
                        {isEarned ? (
                            <badge.icon className="h-8 w-8 text-white" />
                        ) : (
                            <Lock className="h-8 w-8 text-white/70" />
                        )}
                    </div>
                    <h3 className="font-semibold mb-1">{badge.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{badge.description}</p>

                    {!isEarned && (
                        <div className="w-full space-y-1">
                            <Progress value={progress} className="h-1.5" />
                            <p className="text-xs text-muted-foreground">
                                {userCredits} / {badge.requiredCredits} credits
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const content = (
        <div>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Achievements & Badges</h1>
                    <p className="text-muted-foreground">
                        Earn badges by contributing to wildlife conservation efforts
                    </p>
                </div>

                {/* Progress Overview */}
                <Card className="glass-card mb-8">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-6">
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
                                <Award className="h-10 w-10 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-xl font-bold">Badge Collection</h2>
                                    <span className="text-lg font-semibold">
                                        {totalEarned} / {totalBadges}
                                    </span>
                                </div>
                                <Progress value={(totalEarned / totalBadges) * 100} className="h-3" />
                                <p className="text-sm text-muted-foreground mt-2">
                                    You've earned {totalEarned} badge{totalEarned !== 1 ? "s" : ""}! Keep contributing to unlock more.
                                </p>
                            </div>
                            <div className="text-center px-6 border-l border-border">
                                <p className="text-3xl font-bold text-amber-500">{userCredits}</p>
                                <p className="text-sm text-muted-foreground">Total Credits</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contribution Badges */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Camera className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold">Contribution Badges</h2>
                        <Badge variant="outline" className="ml-2">
                            {contributionBadges.filter((b) => earnedBadges.includes(b.id)).length} / {contributionBadges.length}
                        </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {contributionBadges.map(renderBadgeCard)}
                    </div>
                </div>

                {/* Milestone Badges */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        <h2 className="text-xl font-semibold">Milestone Badges</h2>
                        <Badge variant="outline" className="ml-2">
                            {milestoneBadges.filter((b) => earnedBadges.includes(b.id)).length} / {milestoneBadges.length}
                        </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {milestoneBadges.map(renderBadgeCard)}
                    </div>
                </div>

                {/* Special Badges */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Star className="h-5 w-5 text-purple-500" />
                        <h2 className="text-xl font-semibold">Special Badges</h2>
                        <Badge variant="outline" className="ml-2">
                            {specialBadges.filter((b) => earnedBadges.includes(b.id)).length} / {specialBadges.length}
                        </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {specialBadges.map(renderBadgeCard)}
                    </div>
                </div>

                {/* How to Earn */}
                <Card className="glass-card mt-8">
                    <CardHeader>
                        <CardTitle>How to Earn Badges</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { icon: Camera, title: "Upload Photos", desc: "5 credits per photo" },
                                { icon: Bird, title: "Identify Species", desc: "+5 bonus credits" },
                                { icon: Zap, title: "Daily Streak", desc: "Bonus for consistency" },
                                { icon: Heart, title: "Help Others", desc: "Verify community photos" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                                    <item.icon className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-medium text-sm">{item.title}</p>
                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
        </div>
    );

    if (embedded) return content;

    return (
        <div className="min-h-screen bg-background">
            <PublicHeader />
            <main className="container mx-auto px-4 lg:px-8 pt-12 pb-12">
                {content}
            </main>
        </div>
    );
}
