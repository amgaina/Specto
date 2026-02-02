import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Bird,
    Camera,
    Award,
    Clock,
    User,
    LogOut,
    Menu,
    X,
    Home,
    Settings,
    Star,
} from "lucide-react";

interface User {
    email: string;
    name: string;
    role: string;
    credits: number;
    volunteerHours: number;
    badges: string[];
}

export function PublicHeader() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("specto-user");
        if (stored) {
            setUser(JSON.parse(stored));
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("specto-user");
        navigate("/login");
    };

    const navLinks = [
        { href: "/public", label: "Dashboard", icon: Home },
        { href: "/public/upload", label: "Upload", icon: Camera },
        { href: "/public/achievements", label: "Achievements", icon: Award },
        { href: "/public/volunteer", label: "Volunteer Hours", icon: Clock },
        { href: "/public/settings", label: "Settings", icon: Settings },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-sm" : "bg-transparent"
                }`}
        >
            <div className="container mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <a href="/public" className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                            <Bird className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-display text-xl font-bold tracking-tight">Specto</span>
                        <Badge variant="outline" className="ml-2 text-xs border-green-500/30 text-green-500">
                            Citizen
                        </Badge>
                    </a>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.href)
                                        ? "bg-green-500/20 text-green-500"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    }`}
                            >
                                <link.icon className="h-4 w-4" />
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    {/* User Section */}
                    <div className="flex items-center gap-4">
                        {/* Credits Badge */}
                        {user && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                                <Star className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-semibold text-amber-500">{user.credits} credits</span>
                            </div>
                        )}

                        {/* User Menu */}
                        <div className="hidden md:flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-medium">{user?.name}</p>
                                <p className="text-xs text-muted-foreground">Citizen Scientist</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleLogout}>
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-border/50">
                        <nav className="flex flex-col gap-2">
                            {navLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(link.href)
                                            ? "bg-green-500/20 text-green-500"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <link.icon className="h-5 w-5" />
                                    {link.label}
                                </a>
                            ))}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
