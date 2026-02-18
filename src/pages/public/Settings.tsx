import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    User,
    Bell,
    Shield,
    Camera,
    LogOut,
    Mail,
    MapPin,
    Star,
    Award,
    Clock,
} from "lucide-react";

export default function PublicSettings() {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        name: "Citizen Scientist",
        email: "citizen@example.com",
        location: "",
        credits: 125,
        volunteerHours: 8.5,
        badges: ["first-upload", "week-streak"],
    });

    useEffect(() => {
        const stored = localStorage.getItem("specto-user");
        if (stored) {
            const parsed = JSON.parse(stored);
            setUser({
                name: parsed.name || "Citizen Scientist",
                email: parsed.email || "citizen@example.com",
                location: parsed.location || "",
                credits: parsed.credits || 125,
                volunteerHours: parsed.volunteerHours || 8.5,
                badges: parsed.badges || ["first-upload", "week-streak"],
            });
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("specto-user");
        navigate("/login");
    };

    const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="min-h-screen bg-background">
            <PublicHeader />

            <main className="container mx-auto px-4 lg:px-8 pt-12 pb-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Settings</h1>
                    <p className="text-muted-foreground">Manage your profile and preferences</p>
                </div>

                <div className="max-w-2xl space-y-6">
                    {/* Profile Overview */}
                    <Card className="glass-card">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-6">
                                <Avatar className="h-20 w-20">
                                    <AvatarFallback className="text-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold">{user.name}</h2>
                                    <p className="text-muted-foreground">{user.email}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                                            <Star className="h-3 w-3 mr-1" />
                                            {user.credits} credits
                                        </Badge>
                                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {user.volunteerHours}h volunteer
                                        </Badge>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm">
                                    <Camera className="h-4 w-4 mr-2" />
                                    Change Photo
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Profile Settings */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Profile Information
                            </CardTitle>
                            <CardDescription>Update your personal details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" defaultValue={user.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" defaultValue={user.email} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location" className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Location (Optional)
                                </Label>
                                <Input id="location" placeholder="e.g., New Orleans, LA" defaultValue={user.location} />
                                <p className="text-xs text-muted-foreground">
                                    Your location helps us tag your photo contributions
                                </p>
                            </div>
                            <Button>Save Changes</Button>
                        </CardContent>
                    </Card>

                    {/* Notification Settings */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Notifications
                            </CardTitle>
                            <CardDescription>Choose what updates you receive</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { label: "Credit earned notifications", description: "Get notified when you earn credits", defaultChecked: true },
                                { label: "Badge achievements", description: "Celebrate when you unlock new badges", defaultChecked: true },
                                { label: "Volunteer hour updates", description: "Monthly summary of your hours", defaultChecked: true },
                                { label: "Community highlights", description: "Featured photos and top contributors", defaultChecked: false },
                                { label: "Conservation news", description: "Updates about Louisiana wildlife", defaultChecked: false },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{item.label}</p>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                    <Switch defaultChecked={item.defaultChecked} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Privacy Settings */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Privacy
                            </CardTitle>
                            <CardDescription>Control your profile visibility</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { label: "Show on leaderboard", description: "Display your name on public contributor rankings", defaultChecked: true },
                                { label: "Public profile", description: "Allow others to view your badges and stats", defaultChecked: true },
                                { label: "Photo attribution", description: "Show your name on contributed photos", defaultChecked: true },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{item.label}</p>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                    <Switch defaultChecked={item.defaultChecked} />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Account Actions */}
                    <Card className="glass-card border-destructive/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <LogOut className="h-5 w-5" />
                                Account
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button variant="destructive" onClick={handleLogout}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
