import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
    Bird, MapPin, Home, Search, X, Play, Pause,
    ChevronLeft, ChevronRight, SkipBack, SkipForward,
    TrendingUp, TrendingDown, Info, Waves, Target, Clock, Layers
} from "lucide-react";

// Precise bounds for the Louisiana Coastline project
const MAP_BOUNDS = { minLat: 28.8, maxLat: 30.5, minLng: -93.5, maxLng: -88.5 };

const SPECIES_THEMES: Record<string, string> = {
    BRPE: "#f59e0b", GREG: "#10b981", ROSP: "#ec4899", ROTE: "#f97316",
    LAGU: "#3b82f6", SNEG: "#a855f7", FOTE: "#06b6d4",
};

type ColonyData = {
    name: string;
    lat: number;
    lng: number;
    birds: number;
    nests: number;
    region: string;
    species: Set<string>;
};

type YearData = {
    totalBirds: number;
    totalNests: number;
    colonies: Map<string, ColonyData>;
};

export default function AdminMapView() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Map<number, YearData>>(new Map());
    const [years, setYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState<number>(2024);
    const [activeColony, setActiveColony] = useState<ColonyData | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [search, setSearch] = useState("");
    const [playSpeed, setPlaySpeed] = useState(1000);

    // --- High-Performance CSV Data Engine ---
    useEffect(() => {
        const loadCSV = async () => {
            try {
                const res = await fetch("/data.csv");
                const text = await res.text();
                const lines = text.split("\n").filter(l => l.trim());
                const headers = lines[0].split(",").map(h => h.trim());

                const idx = {
                    year: headers.indexOf("Year"),
                    lat: headers.indexOf("Latitude_y"),
                    lng: headers.indexOf("Longitude_y"),
                    name: headers.indexOf("ColonyName"),
                    birds: headers.indexOf("total_birds"),
                    nests: headers.indexOf("total_nests"),
                    species: headers.indexOf("SpeciesCode"),
                    region: headers.indexOf("GeoRegion")
                };

                const yearMap: Map<number, YearData> = new Map();
                for (let i = 1; i < lines.length; i++) {
                    const row = lines[i].split(",");
                    const year = parseInt(row[idx.year]);
                    if (isNaN(year)) continue;

                    let yearData = yearMap.get(year);
                    if (!yearData) {
                        yearData = { totalBirds: 0, totalNests: 0, colonies: new Map() };
                        yearMap.set(year, yearData);
                    }
                    const name = row[idx.name];
                    const birds = parseFloat(row[idx.birds]) || 0;
                    const nests = parseFloat(row[idx.nests]) || 0;

                    yearData.totalBirds += birds;
                    yearData.totalNests += nests;

                    let col = yearData.colonies.get(name);
                    if (!col) {
                        col = {
                            name,
                            lat: parseFloat(row[idx.lat]),
                            lng: parseFloat(row[idx.lng]),
                            birds: 0,
                            nests: 0,
                            region: row[idx.region] || "Coast",
                            species: new Set<string>()
                        };
                        yearData.colonies.set(name, col);
                    }
                    col.birds += birds;
                    col.nests += nests;
                    if (row[idx.species]) col.species.add(row[idx.species]);
                }

                const sortedYears = Array.from(yearMap.keys()).sort((a, b) => a - b);
                setYears(sortedYears);
                setData(yearMap);
                setSelectedYear(sortedYears[sortedYears.length - 1]);
                setLoading(false);
            } catch (err) { console.error("CSV Engine Failure:", err); }
        };
        loadCSV();
    }, []);

    // --- Logic & Projections ---
    const currentYearData = useMemo(() => data.get(selectedYear), [data, selectedYear]);

    const projectToSVG = useCallback((lat: number, lng: number) => {
        const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100;
        const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;
        return { x, y };
    }, []);

    const filteredColonies = useMemo(() => {
        if (!currentYearData) return [];
        return Array.from(currentYearData.colonies.values())
            .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => b.birds - a.birds);
    }, [currentYearData, search]);

    // Narrative logic
    const ecologicalStory = useMemo(() => {
        const prevData = data.get(selectedYear - 1);
        if (!prevData || !currentYearData) return "Initializing ecological baseline.";
        const change = currentYearData.totalBirds - prevData.totalBirds;
        if (change > 5000) return "Rapid population surge detected in delta wetlands.";
        if (change < -5000) return "Significant migration or decline observed in coastal sites.";
        return "Stable nesting patterns maintained across survey regions.";
    }, [selectedYear, data, currentYearData]);

    useEffect(() => {
        if (!isPlaying) return;
        const timer = setInterval(() => {
            setSelectedYear(y => {
                const i = years.indexOf(y);
                return i < years.length - 1 ? years[i + 1] : years[0];
            });
        }, playSpeed);
        return () => clearInterval(timer);
    }, [isPlaying, years, playSpeed]);

    if (loading) return (
        <div className="h-screen bg-[#020617] flex flex-col items-center justify-center p-8">
            <Bird className="h-12 w-12 text-cyan-500 animate-bounce mb-4" />
            <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Specto Spatial Engine</h2>
            <Progress value={65} className="w-64 h-1 bg-slate-800" />
            <p className="text-slate-500 text-[10px] mt-4 font-mono uppercase tracking-widest">Compiling_Bird_Survey_Archives...</p>
        </div>
    );

    return (
        <div className="h-screen w-full bg-[#020617] text-slate-200 flex flex-col overflow-hidden font-sans">
            {/* Command Bar */}
            <header className="h-14 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-6">
                    <Link to="/admin" className="flex items-center gap-2 group">
                        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-1.5 rounded-lg shadow-lg group-hover:scale-110 transition-transform">
                            <Bird className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="font-black text-sm tracking-tighter text-white uppercase">Specto<span className="text-cyan-500">Center</span></h1>
                    </Link>
                    <div className="h-4 w-px bg-white/10" />
                    <div className="flex gap-6">
                        <StatCard label="Observed" value={Math.round(currentYearData?.totalBirds || 0).toLocaleString()} color="text-cyan-400" />
                        <StatCard label="Nesting" value={Math.round(currentYearData?.totalNests || 0).toLocaleString()} color="text-emerald-400" />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Locate Colony..."
                            className="w-48 bg-white/5 border-white/10 h-9 text-xs pl-9 focus:w-64 transition-all rounded-full"
                        />
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Data Sidebar */}
                <aside className="w-80 border-r border-white/5 bg-slate-900/20 backdrop-blur-md flex flex-col">
                    <div className="p-4 flex items-center justify-between border-b border-white/5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Target className="h-3 w-3" /> Area Leaderboard
                        </span>
                        <Badge variant="outline" className="text-[10px] border-white/10 text-cyan-500">{filteredColonies.length}</Badge>
                    </div>
                    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
                        {filteredColonies.map((c, i) => (
                            <button
                                key={c.name}
                                onClick={() => setActiveColony(c)}
                                className={`w-full text-left p-3 rounded-xl transition-all ${activeColony?.name === c.name ? 'bg-cyan-500/10 ring-1 ring-cyan-500/30' : 'hover:bg-white/5'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <p className="text-xs font-bold text-slate-200 truncate w-40">{c.name}</p>
                                    <span className="text-[10px] font-mono text-cyan-400 font-bold">{Math.round(c.birds).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-500" style={{ width: `${Math.min((c.birds / 15000) * 100, 100)}%` }} />
                                    </div>
                                    <span className="text-[9px] text-slate-600 font-mono uppercase">{c.region}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Spatial Engine (SVG) */}
                <main className="flex-1 relative bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)]">
                    <svg className="w-full h-full p-16" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                        {/* Background Terrain Pattern */}
                        <path
                            d="M0,45 Q20,50 40,48 T80,55 T100,50"
                            fill="none"
                            stroke="rgba(6,182,212,0.05)"
                            strokeWidth="12"
                            strokeLinecap="round"
                        />

                        {/* Data Nodes */}
                        {filteredColonies.map(c => {
                            const { x, y } = projectToSVG(c.lat, c.lng);
                            const isActive = activeColony?.name === c.name;
                            const size = Math.sqrt(c.birds) / 10 + 0.8;

                            return (
                                <g key={c.name} onClick={() => setActiveColony(c)} className="cursor-pointer">
                                    <circle
                                        cx={x} cy={y}
                                        r={isActive ? size * 1.5 : size}
                                        fill={isActive ? "#06b6d4" : "rgba(6,182,212,0.3)"}
                                        className="transition-all duration-300"
                                    />
                                    {isActive && (
                                        <circle cx={x} cy={y} r={size * 2} fill="none" stroke="#06b6d4" strokeWidth="0.2">
                                            <animate attributeName="r" from={size} to={size * 4} dur="1.5s" repeatCount="indefinite" opacity="0" />
                                        </circle>
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    {/* Story Overlay */}
                    <div className="absolute top-6 left-6 w-80 pointer-events-none">
                        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl pointer-events-auto">
                            <div className="flex items-center gap-2 mb-4">
                                <Badge variant="outline" className="text-[9px] border-cyan-500/30 text-cyan-400 uppercase font-mono tracking-tighter">CHAPTER {years.indexOf(selectedYear) + 1}</Badge>
                                <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">LA Delta Survey</span>
                            </div>
                            <h2 className="text-4xl font-black text-white italic mb-2">{selectedYear}</h2>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">{ecologicalStory}</p>
                        </div>
                    </div>

                    {/* Inspection Panel */}
                    {activeColony && (
                        <div className="absolute top-6 right-6 w-72 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl animate-in fade-in slide-in-from-right-4">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-sm text-white">{activeColony.name}</h3>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-white" onClick={() => setActiveColony(null)}><X className="h-4 w-4" /></Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-white/5 p-3 rounded-2xl">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase">Population</p>
                                    <p className="text-lg font-black text-cyan-400">{Math.round(activeColony.birds).toLocaleString()}</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-2xl">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase">Nesting</p>
                                    <p className="text-lg font-black text-emerald-400">{Math.round(activeColony.nests).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[9px] text-slate-500 font-bold uppercase">Species Profile</p>
                                <div className="flex flex-wrap gap-1">
                                    {Array.from(activeColony.species).map((s: string) => (
                                        <Badge key={s} className="bg-white/5 border-white/10 text-[9px] text-slate-300 font-mono">
                                            {s}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Cinematic Timeline */}
            <footer className="h-24 bg-slate-950 border-t border-white/5 px-8 flex items-center gap-10 z-50">
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`h-12 w-12 rounded-2xl shadow-xl transition-all ${isPlaying ? 'bg-red-500' : 'bg-cyan-500 hover:bg-cyan-400'}`}
                    >
                        {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-1" />}
                    </Button>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Speed Control</span>
                        <Select value={playSpeed.toString()} onValueChange={(v) => setPlaySpeed(parseInt(v))}>
                            <SelectTrigger className="h-6 w-16 bg-transparent border-none text-[10px] p-0 font-bold text-cyan-500 shadow-none">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10">
                                <SelectItem value="1500" className="text-xs">0.5x</SelectItem>
                                <SelectItem value="1000" className="text-xs">1.0x</SelectItem>
                                <SelectItem value="500" className="text-xs">2.0x</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">
                        <span>Epoch: {years[0]}</span>
                        <div className="h-px flex-1 mx-6 bg-white/5" />
                        <span className="text-cyan-500">Current Chapter: {selectedYear}</span>
                    </div>
                    <div className="flex items-end gap-1 h-10 mb-1">
                        {years.map(y => {
                            const yData = data.get(y);
                            const height = ((yData?.totalBirds || 0) / 120000) * 100;
                            return (
                                <button
                                    key={y}
                                    onClick={() => { setIsPlaying(false); setSelectedYear(y); }}
                                    className={`flex-1 min-w-[3px] rounded-t-sm transition-all duration-300 ${y === selectedYear ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-white/5 hover:bg-white/10'}`}
                                    style={{ height: `${Math.max(height, 10)}%` }}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chronology</span>
                    <span className="text-5xl font-black text-white italic tracking-tighter -mt-2">{selectedYear}</span>
                </div>
            </footer>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
    return (
        <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-none mb-1">{label}</span>
            <span className={`text-sm font-mono font-black tracking-tight ${color}`}>{value}</span>
        </div>
    );
}