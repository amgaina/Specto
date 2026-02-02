import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bird, Shield, Database, Eye, EyeOff, Loader2, Users, Camera, UserPlus } from "lucide-react";

type UserRole = "wildlife-manager" | "data-admin" | "citizen-scientist";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!selectedRole) {
            setError("Please select a role");
            return;
        }

        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }

        if (password.length < 4) {
            setError("Password must be at least 4 characters");
            return;
        }

        if (isSignUp && password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (isSignUp && !fullName.trim()) {
            setError("Please enter your full name");
            return;
        }

        setIsLoading(true);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Store user info in localStorage for demo
        const user = {
            email,
            name: isSignUp ? fullName : email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            role: selectedRole,
            credits: selectedRole === "citizen-scientist" ? (isSignUp ? 0 : 125) : 0,
            volunteerHours: selectedRole === "citizen-scientist" ? (isSignUp ? 0 : 8.5) : 0,
            badges: selectedRole === "citizen-scientist" ? (isSignUp ? [] : ["first-upload", "week-streak"]) : [],
        };
        localStorage.setItem("specto-user", JSON.stringify(user));

        // Redirect based on role
        if (selectedRole === "wildlife-manager") {
            navigate("/manager");
        } else if (selectedRole === "data-admin") {
            navigate("/admin");
        } else {
            navigate("/public");
        }

        setIsLoading(false);
    };

    const roles = [
        {
            id: "wildlife-manager" as UserRole,
            title: "Wildlife Manager",
            description: "View and analyze wildlife monitoring data, explore maps and trends",
            icon: Bird,
            color: "from-amber-500 to-orange-600",
            bgColor: "bg-amber-500/10",
            borderColor: "border-amber-500/30",
        },
        {
            id: "data-admin" as UserRole,
            title: "Data Administrator",
            description: "Upload and manage survey data, images, and colony records",
            icon: Database,
            color: "from-blue-500 to-cyan-600",
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-500/30",
        },
        {
            id: "citizen-scientist" as UserRole,
            title: "Citizen Scientist",
            description: "Contribute photos, earn credits & badges, and log volunteer hours",
            icon: Camera,
            color: "from-green-500 to-emerald-600",
            bgColor: "bg-green-500/10",
            borderColor: "border-green-500/30",
        },
    ];

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
            </div>

            <div className="w-full max-w-4xl relative z-10">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-amber-600 shadow-lg shadow-primary/30">
                            <Bird className="h-8 w-8 text-primary-foreground" />
                        </div>
                        <span className="font-display text-3xl font-bold tracking-tight">Specto</span>
                    </div>
                    <h1 className="text-2xl font-semibold mb-2">Welcome Back</h1>
                    <p className="text-muted-foreground">Sign in to access the Coastal Wildlife Monitoring System</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Role Selection */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-medium flex items-center gap-2">
                            <Shield className="h-5 w-5 text-muted-foreground" />
                            Select Your Role
                        </h2>

                        <div className="space-y-3">
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => setSelectedRole(role.id)}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${selectedRole === role.id
                                            ? `${role.borderColor} ${role.bgColor} scale-[1.02]`
                                            : "border-border/50 hover:border-border hover:bg-muted/30"
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div
                                            className={`p-2.5 rounded-lg bg-gradient-to-br ${role.color} ${selectedRole === role.id ? "shadow-lg" : ""
                                                }`}
                                        >
                                            <role.icon className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1">{role.title}</h3>
                                            <p className="text-sm text-muted-foreground">{role.description}</p>
                                        </div>
                                        <div
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedRole === role.id ? `${role.borderColor} bg-current` : "border-muted-foreground/30"
                                                }`}
                                        >
                                            {selectedRole === role.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Login Form */}
                    <Card className="glass-card border-border/50">
                        <CardHeader>
                            <CardTitle>{isSignUp ? "Create Account" : "Sign In"}</CardTitle>
                            <CardDescription>
                                {isSignUp
                                    ? "Join our community of citizen scientists"
                                    : "Enter your credentials to continue"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {isSignUp && (
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input
                                            id="fullName"
                                            type="text"
                                            placeholder="John Doe"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="bg-background/50"
                                            autoComplete="name"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-background/50"
                                        autoComplete="email"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="bg-background/50 pr-10"
                                            autoComplete={isSignUp ? "new-password" : "current-password"}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {isSignUp && (
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="bg-background/50"
                                            autoComplete="new-password"
                                        />
                                    </div>
                                )}

                                {error && (
                                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                                        {error}
                                    </div>
                                )}

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {isSignUp ? "Creating account..." : "Signing in..."}
                                        </>
                                    ) : isSignUp ? (
                                        <>
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Create Account
                                        </>
                                    ) : (
                                        "Sign In"
                                    )}
                                </Button>

                                {selectedRole === "citizen-scientist" && (
                                    <div className="pt-2 border-t border-border/50">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsSignUp(!isSignUp);
                                                setError("");
                                            }}
                                            className="w-full text-sm text-center text-primary hover:underline"
                                        >
                                            {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
                                        </button>
                                    </div>
                                )}

                                <p className="text-xs text-center text-muted-foreground mt-4">
                                    Demo mode: Use any email and password (4+ characters)
                                </p>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
