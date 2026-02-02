import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Map, BarChart3, Image, Settings, Bird, Database, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ManagerHeaderProps {
    userName?: string;
}

const navigation = [
    { name: "Dashboard", href: "/manager", icon: BarChart3 },
    { name: "Data Explorer", href: "/manager/data", icon: Database },
    { name: "Map Explorer", href: "/manager/map", icon: Map },
    { name: "Image Analysis", href: "/manager/analysis", icon: Image },
    { name: "Settings", href: "/manager/settings", icon: Settings },
];

export function ManagerHeader({ userName }: ManagerHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Get user from localStorage
    const storedUser = localStorage.getItem("specto-user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const displayName = userName || user?.name || "Wildlife Manager";

    const handleLogout = () => {
        localStorage.removeItem("specto-user");
        navigate("/login");
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <nav className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-1">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-secondary text-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>

                {/* User Info & Logout */}
                <div className="hidden md:flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{displayName}</span>
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                            Wildlife Manager
                        </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                    </Button>
                </div>

                {/* Mobile Menu Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </nav>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl animate-fade-in">
                    <div className="container mx-auto px-4 py-4 space-y-2">
                        {/* User Info */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 mb-4">
                            <div className="p-2 rounded-lg bg-amber-500/20">
                                <Bird className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="font-medium">{displayName}</p>
                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                                    Wildlife Manager
                                </Badge>
                            </div>
                        </div>

                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                                        isActive
                                            ? "bg-secondary text-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                        <div className="pt-4 border-t border-border/50">
                            <Button variant="destructive" className="w-full" onClick={handleLogout}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
