import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
    Bird, Search, X, Play, Pause, Download, Sparkles, MapPin,
    RotateCcw, TrendingUp, Activity, BarChart3, ArrowRight,
    ClipboardList, History, Zap, ArrowUpRight, ArrowDownRight,
    Database, Terminal, Cpu, Bot, Globe, Loader2, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ManagerHeader } from "@/components/layout/ManagerHeader";

// --- Types ---
type RawRow = {
    name: string;
    birds: number;
    nests: number;
    species: string;
    year: number;
    Notes?: string;
};
type ColonyData = {
    name: string;
    lat: number;
    lng: number;
    birds: number;
    nests: number;
    region: string;
    species: Set<string>;
    rows: RawRow[];
};
type YearData = {
    totalBirds: number;
    totalNests: number;
    colonies: Map<string, ColonyData>;
    rows: RawRow[];
};
type ChatMsg = { id: string; role: "user" | "bot" | "thinking"; text: string };

export default function ManagerMapView() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Map<number, YearData>>(new Map());
    const [years, setYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState<number>(2024);
    const [activeColony, setActiveColony] = useState<ColonyData | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [search, setSearch] = useState("");
    const [trendModalOpen, setTrendModalOpen] = useState(false);
    const [trendSpecies, setTrendSpecies] = useState("TOTAL");
    // Add missing state for setSelectedTrendSpecies
    const [selectedTrendSpecies, setSelectedTrendSpecies] = useState<string>("TOTAL");
    const [chatOpen, setChatOpen] = useState(true);
    const [chatInput, setChatInput] = useState("");
    const [messages, setMessages] = useState<ChatMsg[]>([
        { id: "1", role: "bot", text: "Ask about your dataset!" }
    ]);

    const chatEndRef = useRef<HTMLDivElement>(null);

    // --- CSV Engine ---
    useEffect(() => {
        const process = async () => {
            try {
                const res = await fetch("/data.csv");
                const text = await res.text();
                const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
                const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ''));
                const getIdx = (tags: string[]) => headers.findIndex(h => tags.includes(h));

                const idx = {
                    yr: getIdx(["Year", "year"]), name: getIdx(["ColonyName", "Colony"]),
                    birds: getIdx(["total_birds", "birds"]), nests: getIdx(["total_nests", "nests"]),
                    reg: getIdx(["GeoRegion", "Region"]), sp: getIdx(["SpeciesCode", "Species"]),
                    lat: getIdx(["Latitude_y", "Latitude"]), lng: getIdx(["Longitude_y", "Longitude"])
                };

                const yearMap = new Map<number, YearData>();
                lines.slice(1).forEach(l => {
                    const row = l.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
                    const yr = parseInt(row[idx.yr]);
                    if (isNaN(yr)) return;

                    if (!yearMap.has(yr)) yearMap.set(yr, { totalBirds: 0, totalNests: 0, colonies: new Map(), rows: [] });
                    const yrD = yearMap.get(yr)!;
                    const name = row[idx.name] || "Unknown Node";
                    const birds = parseFloat(row[idx.birds]) || 0;
                    const nests = parseFloat(row[idx.nests]) || 0;
                    const sp = row[idx.sp] || "UKN";

                    yrD.totalBirds += birds; yrD.totalNests += nests;
                    const raw = { name, birds, nests, species: sp, year: yr };
                    yrD.rows.push(raw);

                    if (!yrD.colonies.has(name)) {
                        yrD.colonies.set(name, {
                            name, region: row[idx.reg] || "Coast", lat: parseFloat(row[idx.lat]) || 0,
                            lng: parseFloat(row[idx.lng]) || 0, birds: 0, nests: 0,
                            species: new Set(), rows: []
                        });
                    }
                    const col = yrD.colonies.get(name)!;
                    col.birds += birds; col.nests += nests; col.species.add(sp); col.rows.push(raw);
                });

                const sorted = Array.from(yearMap.keys()).sort((a, b) => a - b);
                setYears(sorted);
                setData(yearMap);
                setSelectedYear(sorted[sorted.length - 1]);
                setLoading(false);
            } catch (e) { console.error(e); setLoading(false); }
        };
        process();
    }, []);

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // --- AI Intelligence Engine ---
    const handleCommand = (input: string) => {
        const text = input.toLowerCase();
        setMessages(m => [...m, { id: Date.now().toString(), role: "user", text: input }]);
        setChatInput("");

        // Show thinking state
        const thinkingId = (Date.now() + 1).toString();
        setMessages(m => [...m, { id: thinkingId, role: "thinking", text: "Processing biological datasets..." }]);

        setTimeout(() => {
            let responseText = "Intelligence Query Received. Awaiting context...";
            const yearMatch = text.match(/\b(19|20)\d{2}\b/);

            if (yearMatch) {
                const yr = parseInt(yearMatch[0]);
                const yrData = data.get(yr);

                if (yrData) {
                    setSelectedYear(yr);
                    // Find Top Colony
                    const topColony = Array.from(yrData.colonies.values()).sort((a, b) => b.birds - a.birds)[0];

                    // Find Apex Species
                    const speciesCounts: Record<string, number> = {};
                    yrData.rows.forEach(r => {
                        speciesCounts[r.species] = (speciesCounts[r.species] || 0) + r.birds;
                    });
                    const topSpecies = Object.entries(speciesCounts).sort((a, b) => b[1] - a[1])[0];

                    responseText = `[ ANALYSIS COMPLETE: ${yr} ]\n\n` +
                        `• CENSUS POPULATION: ${Math.round(yrData.totalBirds).toLocaleString()}\n` +
                        `• NESTING VOLUME: ${Math.round(yrData.totalNests).toLocaleString()}\n\n` +
                        `[ SUPERLATIVES ]\n` +
                        `• PEAK NODE: ${topColony.name} (${Math.round(topColony.birds).toLocaleString()} birds)\n` +
                        `• APEX TAXA: ${topSpecies ? topSpecies[0] : 'N/A'} (${Math.round(topSpecies?.[1] || 0).toLocaleString()} counts)\n\n` +
                        `System context is now synchronized to this epoch.`;
                } else {
                    responseText = `ERROR: The year ${yr} is not indexed in the Louisiana Delta cache.`;
                }
            } else if (text.includes("summary")) {
                const current = data.get(selectedYear);
                responseText = `[ CURRENT REGIONAL STATE: ${selectedYear} ]\n\nTotal nodes active: ${current?.colonies.size}.\nBiological baseline: ${Math.round(current?.totalBirds || 0).toLocaleString()} individual units.`;
            }

            // Remove thinking message and add actual response
            setMessages(m => m.filter(msg => msg.role !== "thinking").concat({
                id: Date.now().toString(),
                role: "bot",
                text: responseText
            }));
        }, 1200);
    };

    // --- Scrubber ---
    useEffect(() => {
        let timer: ReturnType<typeof setInterval> | undefined;
        if (isPlaying) {
            timer = setInterval(() => {
                setSelectedYear(prev => {
                    const idx = years.indexOf(prev);
                    return years[(idx + 1) % years.length];
                });
            }, 1800);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isPlaying, years]);

    const filteredColonies = useMemo(() => {
        const yr = data.get(selectedYear);
        return yr ? Array.from(yr.colonies.values()).filter(c => c.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.birds - a.birds) : [];
    }, [data, selectedYear, search]);

    const historicalLine = useMemo(() => {
        if (!activeColony) return [];
        return years.map(yr => {
            const site = data.get(yr)?.colonies.get(activeColony.name);
            if (!site) return { yr, val: 0 };
            return { yr, val: trendSpecies === "TOTAL" ? site.birds : site.rows.filter(r => r.species === trendSpecies).reduce((a, b) => a + b.birds, 0) };
        });
    }, [activeColony, years, data, trendSpecies]);

    return (
        <div className="h-screen w-full flex flex-col bg-[#050505] text-[#e1e1e1] overflow-hidden">
            <style>{`
                .glass { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(25px); border: 1px solid rgba(255, 255, 255, 0.06); }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 10px; }
                .text-glow { text-shadow: 0 0 20px rgba(59, 130, 246, 0.6); }
                @keyframes pulse-thinking { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                .thinking-pulse { animation: pulse-thinking 1.5s infinite; }
            `}</style>

            <ManagerHeader />

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-black/20">
                    <Cpu className="animate-spin h-14 w-14 text-primary shadow-[0_0_40px_rgba(59,130,246,0.3)]" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Loading Data</p>
                </div>
            ) : (
                <div className="flex-1 flex overflow-hidden relative">

                    {/* Left Panel: Rankings */}
                    <aside className="w-[320px] border-r border-white/5 bg-black/40 flex flex-col shrink-0 z-20">
                        <div className="p-6 border-b border-white/5 bg-primary/5 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Spatial Node Ranking</span>
                            <BarChart3 className="h-4 w-4 opacity-30" />
                        </div>
                        <div className="p-4 border-b border-white/5">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 opacity-30 group-focus-within:text-primary" />
                                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Nodes..." className="pl-9 h-9 bg-white/5 border-none rounded-xl text-[11px]" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                            {filteredColonies.map((c, i) => {
                                const active = activeColony?.name === c.name;
                                const pct = (c.birds / (filteredColonies[0]?.birds || 1)) * 100;
                                return (
                                    <button key={c.name} onClick={() => setActiveColony(c)} className={`w-full text-left p-4 rounded-2xl transition-all relative group ${active ? 'bg-primary text-white shadow-2xl translate-x-1' : 'hover:bg-white/5'}`}>
                                        <div className="flex justify-between items-center relative z-10">
                                            <span className={`text-[9px] font-mono font-black ${active ? 'text-white/50' : 'text-primary'}`}>#{(i + 1).toString().padStart(2, '0')}</span>
                                            <span className="text-[11px] font-black truncate max-w-[130px] uppercase">{c.name}</span>
                                            <span className={`text-[10px] font-mono font-black ${active ? 'text-white' : 'text-primary'}`}>{Math.round(c.birds).toLocaleString()}</span>
                                        </div>
                                        <div className={`mt-3 h-0.5 w-full rounded-full overflow-hidden ${active ? 'bg-white/20' : 'bg-white/5'}`}>
                                            <div className={`h-full transition-all duration-1000 ${active ? 'bg-white' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Middle: Data Deep Dive */}
                    <main className="flex-1 mt-10 overflow-y-auto custom-scrollbar relative p-10 bg-black/10">
                        {activeColony ? (
                            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center"><MapPin className="h-5 w-5 text-primary" /></div>
                                            <span className="text-[11px] font-black text-primary uppercase tracking-[0.4em]">{activeColony.region}</span>
                                        </div>
                                        <h1 className="text-7xl font-black uppercase">{activeColony.name}</h1>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <Button variant="outline" className="h-14 rounded-2xl gap-3 font-black border-white/10 px-8 hover:bg-primary/10 transition-all" onClick={() => setTrendModalOpen(true)}>
                                            <TrendingUp className="h-4 w-4 text-primary" /> Strategic Trend
                                        </Button>
                                        <Button className="h-14 rounded-2xl gap-3 font-black uppercase tracking-widest px-8 shadow-2xl shadow-primary/40 bg-primary text-white">
                                            <Download className="h-4 w-4" /> Export Node
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    {[
                                        { label: "Population", val: activeColony.birds, icon: Bird },
                                        { label: "Nesting", val: activeColony.nests, icon: Globe },
                                        { label: "Taxa Types", val: activeColony.species.size, icon: Database },
                                    ].map((s, i) => (
                                        <div key={i} className="glass p-8 rounded-[2.5rem] border-white/5 flex flex-col justify-between h-52 group hover:border-primary/50 transition-all cursor-default">
                                            <s.icon className="h-6 w-6 text-primary" />
                                            <div>
                                                <p className="text-[9px] font-black uppercase opacity-40 tracking-widest mb-1">{s.label}</p>
                                                <p className="text-5xl font-black tracking-tighter">{Math.round(s.val).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="glass rounded-[3rem] overflow-hidden border-white/5 bg-black/20">
                                    <div className="p-8 border-b border-white/5 bg-white/5 flex items-center gap-3">
                                        <Terminal className="h-5 w-5 text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Year {selectedYear} Survey Stream</span>
                                    </div>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-black uppercase opacity-30 border-b border-white/5">
                                                <th className="p-8">Taxa</th>
                                                <th className="p-8">Count</th>
                                                <th className="p-8">Assessment</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[13px] font-bold">
                                            {activeColony.rows.slice(0, 30).map((r, i) => (
                                                <tr key={i} className="border-b border-white/5 hover:bg-primary/5 transition-colors">
                                                    <td className="p-8 text-primary font-black uppercase">{r.species}</td>
                                                    <td className="p-8 font-mono text-lg">{Math.round(r.birds).toLocaleString()}</td>
                                                    <td className="p-8 opacity-40 text-[11px] uppercase tracking-widest italic">{r.Notes ? "Note Captured" : "Verified"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-5 select-none grayscale">
                                <Bird className="h-48 w-48 mb-8" />
                                <h2 className="text-xl font-black uppercase tracking-[1.5em]">System Idle</h2>
                            </div>
                        )}
                    </main>

                    {/* Right Panel: Intelligence Tab */}
                    <aside className={`w-[420px] border-l border-white/10 bg-[#080808] flex flex-col mt-10 pt-10 shrink-0 transition-all duration-700 z-30 ${chatOpen ? 'mr-0' : '-mr-[420px]'}`}>
                        <div className="p-8 border-b border-white/10 bg-primary/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg"><Bot className="h-5 w-5 text-white" /></div>
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest leading-none">AI Command</h3>
                                    <p className="text-[10px] font-bold text-primary mt-1.5 uppercase tracking-widest animate-pulse">Neural Active</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                            {messages.map(m => (
                                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {m.role === 'thinking' ? (
                                        <div className="flex items-center gap-3 px-6 py-4 rounded-[1.8rem] glass border-white/10 text-primary thinking-pulse italic text-xs">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>{m.text}</span>
                                        </div>
                                    ) : (
                                        <div className={`max-w-[90%] px-6 py-5 rounded-[2rem] text-[13px] leading-relaxed shadow-xl whitespace-pre-line ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none shadow-primary/20' : 'glass border-white/10 rounded-tl-none italic text-muted-foreground'}`}>
                                            {m.text}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="p-8 border-t border-white/10 bg-black/40 flex gap-3">
                            <Input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCommand(chatInput)} placeholder="Analyze 2022..." className="h-14 rounded-2xl bg-transparent border-white/10 focus-visible:ring-primary text-sm px-6" />
                            <Button className="h-14 w-14 rounded-2xl shrink-0 bg-primary" onClick={() => handleCommand(chatInput)}><ArrowRight className="h-5 w-5 text-white" /></Button>
                        </div>
                    </aside>
                </div>
            )}

            {/* --- Historical Trend Modal --- */}
            <Dialog open={trendModalOpen} onOpenChange={setTrendModalOpen}>
                <DialogContent className="max-w-6xl bg-[#080808]/95 backdrop-blur-3xl border-white/10 rounded-[4rem] p-0 overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.8)] neo-shadow">
                    <div className="flex h-[650px] relative">

                        {/* Sidebar: Species Selection */}
                        <div className="w-72 border-r border-white/5 bg-black/40 p-10 flex flex-col shrink-0">
                            <div className="flex items-center gap-3 mb-10 opacity-60">
                                <Database className="h-4 w-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Taxa Registry</span>
                            </div>
                            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-4">
                                <button
                                    onClick={() => { setTrendSpecies("TOTAL"); setSelectedTrendSpecies("TOTAL"); }}
                                    className={`w-full text-left p-5 rounded-2xl text-[10px] font-black uppercase transition-all duration-300 ${trendSpecies === "TOTAL" ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-white/5 opacity-50 hover:opacity-100"}`}
                                >
                                    Aggregated Pop.
                                </button>
                                {Array.from(activeColony?.species || []).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => { setTrendSpecies(s); setSelectedTrendSpecies(s); }}
                                        className={`w-full text-left p-5 rounded-2xl text-[11px] font-bold transition-all duration-300 ${trendSpecies === s ? "bg-primary/20 text-primary border border-primary/20" : "opacity-40 hover:opacity-100 hover:bg-white/5"}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Main Graph Area */}
                        <div className="flex-1 p-12 flex flex-col bg-gradient-to-br from-transparent to-primary/[0.02]">
                            <div className="flex justify-between items-start mb-16 relative z-10">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 opacity-50">
                                        <History className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.5em]">Temporal Trajectory</span>
                                    </div>
                                    <h3 className="text-5xl font-black italic tracking-tighter uppercase text-glow">{activeColony?.name}</h3>
                                    <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">
                                        {trendSpecies === "TOTAL" ? "Consolidated Biological Density" : `Target Species: ${trendSpecies}`}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full h-12 w-12 bg-white/5 hover:bg-red-500/20 hover:text-red-500 transition-all"
                                    onClick={() => setTrendModalOpen(false)}
                                >
                                    <X className="h-6 w-6" />
                                </Button>
                            </div>

                            {/* The Interactive Graph */}
                            <div className="flex-1 relative flex flex-col justify-end pb-12">
                                {/* SVG Container with Padding to prevent clipping */}
                                <div className="relative h-full w-full px-4">
                                    <svg
                                        className="w-full h-full overflow-visible transition-all duration-1000"
                                        viewBox="0 0 100 100"
                                        preserveAspectRatio="none"
                                    >
                                        <defs>
                                            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>

                                        {/* Area Fill */}
                                        <path
                                            d={`M 0,100 L ${historicalLine.map((t, i) => `${(i / (historicalLine.length - 1)) * 100},${100 - (t.val / (Math.max(...historicalLine.map(x => x.val), 1))) * 100}`).join(' L ')} L 100,100 Z`}
                                            fill="url(#lineGradient)"
                                            className="transition-all duration-1000 ease-in-out"
                                        />

                                        {/* Main Trend Line */}
                                        <path
                                            d={`M ${historicalLine.map((t, i) => `${(i / (historicalLine.length - 1)) * 100},${100 - (t.val / (Math.max(...historicalLine.map(x => x.val), 1))) * 100}`).join(' L ')}`}
                                            fill="none"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="transition-all duration-1000 ease-in-out"
                                            style={{ filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.5))' }}
                                        />

                                        {/* Interactive Hover Dots & Vertical Triggers */}
                                        {historicalLine.map((t, i) => {
                                            const xPos = (i / (historicalLine.length - 1)) * 100;
                                            const yPos = 100 - (t.val / (Math.max(...historicalLine.map(x => x.val), 1))) * 100;
                                            return (
                                                <g key={i} className="group/point">
                                                    {/* Vertical Guide Line (Hidden until hover) */}
                                                    <line
                                                        x1={xPos} y1="0" x2={xPos} y2="100"
                                                        stroke="rgba(255,255,255,0.1)"
                                                        strokeWidth="0.5"
                                                        strokeDasharray="2,2"
                                                        className="opacity-0 group-hover/point:opacity-100 transition-opacity"
                                                    />

                                                    {/* Invisible Hit Zone (Rectangle for easier hovering) */}
                                                    <rect
                                                        x={xPos - 2} y="0" width="4" height="100"
                                                        fill="transparent"
                                                        className="cursor-crosshair"
                                                    />

                                                    {/* Visible Circle */}
                                                    <circle
                                                        cx={xPos}
                                                        cy={yPos}
                                                        r="1.5"
                                                        fill="white"
                                                        stroke="hsl(var(--primary))"
                                                        strokeWidth="1.5"
                                                        className="transition-all group-hover/point:r-3 group-hover/point:fill-primary"
                                                    />

                                                    {/* Hover Tooltip (Inside SVG context) */}
                                                    <foreignObject x={xPos - 15} y={yPos - 20} width="30" height="15" className="opacity-0 group-hover/point:opacity-100 transition-all pointer-events-none">
                                                        <div className="bg-primary text-white text-[8px] font-black rounded-full px-2 py-1 text-center shadow-lg uppercase tracking-tighter">
                                                            {Math.round(t.val).toLocaleString()}
                                                        </div>
                                                    </foreignObject>
                                                </g>
                                            );
                                        })}
                                    </svg>

                                    {/* X-Axis Labels */}
                                    <div className="flex justify-between mt-12 text-[10px] font-black opacity-30 tracking-[0.4em] uppercase text-white/80 border-t border-white/5 pt-6">
                                        <div className="flex flex-col items-start gap-1">
                                            <span>Initial Epoch</span>
                                            <span className="text-primary font-mono text-base tracking-tighter">{years[0]}</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 opacity-20">
                                            <span>Historical Analysis Hub</span>
                                            <Bird className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col items-end gap-1 text-right">
                                            <span>Current Terminus</span>
                                            <span className="text-primary font-mono text-base tracking-tighter">{years[years.length - 1]}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>



            {/* --- Temporal Controller --- */}
            <footer className="h-28 border-t border-white/10 bg-black/60 backdrop-blur-3xl px-12 flex items-center gap-12 shrink-0 z-[100]">
                <div className="flex items-center gap-8">
                    <Button onClick={() => { setIsPlaying(!isPlaying); if (!isPlaying) setActiveColony(null); }} className={`h-16 w-16 rounded-[2rem] shadow-2xl transition-all ${isPlaying ? "bg-red-500 animate-pulse" : "bg-primary"}`}>
                        {isPlaying ? <Pause className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 fill-current ml-1" />}
                    </Button>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-primary tracking-[0.5em] mb-1">Temporal Engine</span>
                        <span className="text-5xl font-black italic tracking-tighter leading-none text-glow">{selectedYear}</span>
                    </div>
                </div>

                <div className="flex-1 flex items-end gap-2 h-16 bg-white/5 rounded-[2rem] p-4 border border-white/5 shadow-inner">
                    {years.map(y => {
                        const active = y === selectedYear;
                        const v = data.get(y)?.totalBirds || 0;
                        const max = Math.max(...Array.from(data.values()).map(d => d.totalBirds), 1);
                        const h = (v / max) * 100;
                        return (
                            <button key={y} onClick={() => { setSelectedYear(y); setIsPlaying(false); }}
                                className={`flex-1 min-w-[10px] rounded-full transition-all duration-500 ${active ? "bg-primary h-full shadow-[0_0_35px_rgba(59,130,246,0.6)]" : "bg-white/10 h-[35%] hover:bg-white/30"}`}
                                title={`${y}: ${Math.round(v).toLocaleString()} count`}
                            />
                        );
                    })}
                </div>

                <Button size="icon" className={`h-16 w-16 rounded-full shadow-2xl transition-all duration-500 ${chatOpen ? "bg-white/10" : "bg-primary"}`} onClick={() => setChatOpen(!chatOpen)}>
                    {chatOpen ? <Terminal className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
                </Button>
            </footer>
        </div>
    );
}