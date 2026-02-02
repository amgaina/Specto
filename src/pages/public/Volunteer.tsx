import { useState, useEffect } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Clock,
    Download,
    Award,
    Star,
    Calendar,
    FileText,
    CheckCircle2,
    Target,
    TrendingUp,
    Users,
} from "lucide-react";

interface VolunteerMilestone {
    hours: number;
    title: string;
    reward: string;
    achieved: boolean;
}

export default function VolunteerHours() {
    const [userCredits, setUserCredits] = useState(125);
    const [volunteerHours, setVolunteerHours] = useState(8.5);
    const [userName, setUserName] = useState("Citizen Scientist");

    useEffect(() => {
        const stored = localStorage.getItem("specto-user");
        if (stored) {
            const user = JSON.parse(stored);
            setUserCredits(user.credits || 125);
            setVolunteerHours(user.volunteerHours || 8.5);
            setUserName(user.name || "Citizen Scientist");
        }
    }, []);

    // 10 credits = 0.5 volunteer hours
    const qualifiedHours = Math.floor(userCredits / 10) * 0.5;
    const nextMilestoneCredits = Math.ceil((qualifiedHours + 0.5) * 10 / 0.5) * 0.5 * 10 / 0.5;

    const milestones: VolunteerMilestone[] = [
        { hours: 5, title: "Getting Started", reward: "Certificate of Participation", achieved: qualifiedHours >= 5 },
        { hours: 10, title: "Active Volunteer", reward: "Digital Badge + Letter", achieved: qualifiedHours >= 10 },
        { hours: 25, title: "Dedicated Contributor", reward: "Official Recognition", achieved: qualifiedHours >= 25 },
        { hours: 50, title: "Conservation Champion", reward: "Award Certificate", achieved: qualifiedHours >= 50 },
        { hours: 100, title: "Wildlife Guardian", reward: "Special Honor + Merch", achieved: qualifiedHours >= 100 },
    ];

    const nextMilestone = milestones.find((m) => !m.achieved);
    const progressToMilestone = nextMilestone
        ? (qualifiedHours / nextMilestone.hours) * 100
        : 100;

    const activityLog = [
        { date: "2026-02-01", activity: "Photo uploads (3)", credits: 15, hours: 0.75 },
        { date: "2026-01-30", activity: "Species identification", credits: 25, hours: 1.25 },
        { date: "2026-01-28", activity: "Photo uploads (5)", credits: 25, hours: 1.25 },
        { date: "2026-01-25", activity: "Community verification", credits: 20, hours: 1.0 },
        { date: "2026-01-22", activity: "Photo uploads (8)", credits: 40, hours: 2.0 },
    ];

    return (
        <div className="min-h-screen bg-background">
            <PublicHeader />

            <main className="container mx-auto px-4 lg:px-8 pt-24 pb-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Volunteer Hours</h1>
                    <p className="text-muted-foreground">
                        Track your contribution hours and download certificates for school, work, or organizations
                    </p>
                </div>

                {/* Stats Overview */}
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <Card className="glass-card border-green-500/30">
                        <CardContent className="p-6 text-center">
                            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 mb-3">
                                <Clock className="h-8 w-8 text-white" />
                            </div>
                            <p className="text-4xl font-bold text-green-500">{qualifiedHours}h</p>
                            <p className="text-muted-foreground">Qualified Volunteer Hours</p>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardContent className="p-6 text-center">
                            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 mb-3">
                                <Star className="h-8 w-8 text-white" />
                            </div>
                            <p className="text-4xl font-bold">{userCredits}</p>
                            <p className="text-muted-foreground">Total Credits Earned</p>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardContent className="p-6 text-center">
                            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-3">
                                <Award className="h-8 w-8 text-white" />
                            </div>
                            <p className="text-4xl font-bold">{milestones.filter((m) => m.achieved).length}</p>
                            <p className="text-muted-foreground">Milestones Achieved</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* How It Works */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>How Volunteer Hours Work</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                                    <div className="p-4 rounded-xl bg-muted/30 text-center">
                                        <div className="text-2xl font-bold text-primary mb-1">10</div>
                                        <p className="text-sm text-muted-foreground">Credits</p>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <span className="text-2xl">=</span>
                                    </div>
                                    <div className="p-4 rounded-xl bg-green-500/10 text-center">
                                        <div className="text-2xl font-bold text-green-500 mb-1">0.5</div>
                                        <p className="text-sm text-muted-foreground">Volunteer Hours</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/30 space-y-2 text-sm text-muted-foreground">
                                    <p>• Hours are calculated automatically from your credit earnings</p>
                                    <p>• Verified monthly by Specto Coastal Watch organization</p>
                                    <p>• Certificates accepted by schools, employers, and volunteer organizations</p>
                                    <p>• Download official documentation anytime</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Activity Log */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {activityLog.map((log, i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                                            <div className="text-center min-w-[60px]">
                                                <p className="text-xs text-muted-foreground">{new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{log.activity}</p>
                                                <p className="text-xs text-muted-foreground">+{log.credits} credits</p>
                                            </div>
                                            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                                                +{log.hours}h
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Next Milestone */}
                        {nextMilestone && (
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="h-5 w-5" />
                                        Next Milestone
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center mb-4">
                                        <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-3">
                                            <Award className="h-10 w-10 text-primary" />
                                        </div>
                                        <h3 className="font-semibold text-lg">{nextMilestone.title}</h3>
                                        <p className="text-sm text-muted-foreground">{nextMilestone.hours} hours required</p>
                                    </div>
                                    <Progress value={progressToMilestone} className="h-3 mb-2" />
                                    <p className="text-sm text-center text-muted-foreground">
                                        {(nextMilestone.hours - qualifiedHours).toFixed(1)} hours to go
                                    </p>
                                    <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                        <p className="text-xs text-center">
                                            <span className="font-medium text-amber-500">Reward:</span>{" "}
                                            <span className="text-muted-foreground">{nextMilestone.reward}</span>
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Download Certificate */}
                        <Card className="glass-card border-primary/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Volunteer Certificate
                                </CardTitle>
                                <CardDescription>Download your official documentation</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-xl bg-muted/30 text-center">
                                    <p className="font-semibold">{userName}</p>
                                    <p className="text-2xl font-bold text-green-500 my-2">{qualifiedHours} Hours</p>
                                    <p className="text-xs text-muted-foreground">Verified Volunteer Service</p>
                                </div>
                                <Button className="w-full" disabled={qualifiedHours < 1}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Certificate
                                </Button>
                                {qualifiedHours < 1 && (
                                    <p className="text-xs text-center text-muted-foreground">
                                        Earn at least 1 hour to download certificate
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Milestones List */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>All Milestones</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {milestones.map((milestone, i) => (
                                        <div
                                            key={i}
                                            className={`flex items-center gap-3 p-3 rounded-lg ${milestone.achieved ? "bg-green-500/10" : "bg-muted/30 opacity-60"
                                                }`}
                                        >
                                            {milestone.achieved ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <Clock className="h-5 w-5 text-muted-foreground" />
                                            )}
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{milestone.title}</p>
                                                <p className="text-xs text-muted-foreground">{milestone.hours}h required</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
