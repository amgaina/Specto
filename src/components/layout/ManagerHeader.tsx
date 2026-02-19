import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Map, BarChart3, Image, Bird, Database, LogOut, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ManagerHeaderProps {
    userName?: string;
}

const navigation = [
    { name: "Dashboard", href: "/manager", icon: BarChart3 },
    { name: "Data Explorer", href: "/manager/data", icon: Database },
    { name: "AI Analysis", href: "/manager/analysis", icon: Image },
    { name: "Colony Map", href: "/manager/map", icon: Map },
    { name: "Alerts", href: "/manager/alerts", icon: Bell },
];

export function ManagerHeader({ userName }: ManagerHeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const storedUser = localStorage.getItem("specto-user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const displayName = userName || user?.name || "Wildlife Manager";

    const handleLogout = () => {
        localStorage.removeItem("specto-user");
        navigate("/login");
    };

    const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + "/");

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
            <nav className="container mx-auto flex h-11 items-center justify-between px-4 lg:px-8">
                {/* Logo */}
                <Link to="/manager" className="flex items-center gap-1.5 mr-4">
                    <div className="p-1 rounded-md bg-gradient-to-br from-amber-500 to-orange-600">
                        <Bird className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="font-display text-sm font-bold tracking-tight">Specto</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-0.5 flex-1">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                                isActive(item.href)
                                    ? "bg-secondary text-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            )}
                        >
                            <item.icon className="h-3.5 w-3.5" />
                            {item.name}
                        </Link>
                    ))}
                </div>

                {/* User Dropdown */}
                <div className="hidden md:flex items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
                                <div className="h-6 w-6 rounded-md bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-400">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium">{displayName}</span>
                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                                    Manager
                                </Badge>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => navigate("/manager/settings")}>
                                <Settings className="h-4 w-4 mr-2" /> Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="h-4 w-4 mr-2" /> Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Mobile Menu Button */}
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
            </nav>

            {mobileMenuOpen && (
                <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
                    <div className="container mx-auto px-4 py-3 space-y-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                                    isActive(item.href) ? "bg-secondary text-foreground" : "text-muted-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        ))}
                        <div className="pt-3 border-t border-border/50">
                            <Button variant="destructive" size="sm" className="w-full" onClick={handleLogout}>
                                <LogOut className="h-4 w-4 mr-2" /> Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
