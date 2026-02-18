import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bird, Camera, Award, LogOut, Menu, X, Home, Settings, Star } from "lucide-react";

interface User {
    email: string;
    name: string;
    role: string;
    credits: number;
    volunteerHours: number;
    badges: string[];
}

const navLinks = [
    { href: "/public", label: "Dashboard", icon: Home },
    { href: "/public/upload", label: "Upload", icon: Camera },
    { href: "/public/progress", label: "My Progress", icon: Award },
];

export function PublicHeader() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("specto-user");
        if (stored) setUser(JSON.parse(stored));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("specto-user");
        navigate("/login");
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between h-11">
                    {/* Logo */}
                    <Link to="/public" className="flex items-center gap-1.5 mr-4">
                        <div className="p-1 rounded-md bg-gradient-to-br from-green-500 to-emerald-600">
                            <Bird className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="font-display text-sm font-bold tracking-tight">Specto</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-0.5 flex-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                to={link.href}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    isActive(link.href)
                                        ? "bg-green-500/20 text-green-500"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }`}
                            >
                                <link.icon className="h-3.5 w-3.5" />
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right: Credits + User Dropdown */}
                    <div className="flex items-center gap-2">
                        {user && (
                            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                                <Star className="h-3 w-3 text-amber-500" />
                                <span className="text-xs font-semibold text-amber-500">{user.credits}</span>
                            </div>
                        )}

                        <div className="hidden md:flex">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
                                        <div className="h-6 w-6 rounded-md bg-green-500/20 flex items-center justify-center text-[10px] font-bold text-green-400">
                                            {(user?.name || "C").charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium">{user?.name || "Citizen"}</span>
                                        <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-500 px-1.5 py-0">
                                            Citizen
                                        </Badge>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => navigate("/public/settings")}>
                                        <Settings className="h-4 w-4 mr-2" /> Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout}>
                                        <LogOut className="h-4 w-4 mr-2" /> Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <div className="md:hidden py-3 border-t border-border/50">
                        <nav className="flex flex-col gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                                        isActive(link.href) ? "bg-green-500/20 text-green-500" : "text-muted-foreground"
                                    }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <link.icon className="h-4 w-4" />
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
