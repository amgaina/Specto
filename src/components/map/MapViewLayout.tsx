import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
    Bird, Search, Play, Pause, Download, TrendingUp, TrendingDown,
    BarChart3, ArrowRight, Bot, Loader2,
    MessageCircle, Terminal, MapPin, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ColonyMap } from "./ColonyMap";
import type { ColonyStats } from "@/lib/dataService";

// --- Types ---
type RawRow = { name: string; birds: number; nests: number; species: string; year: number; };
type ColonyData = {
    name: string; lat: number; lng: number; birds: number; nests: number;
    region: string; species: Set<string>; rows: RawRow[];
};
type YearData = {
    totalBirds: number; totalNests: number;
    colonies: Map<string, ColonyData>; rows: RawRow[];
};
type ChatMsg = { id: string; role: "user" | "bot" | "thinking"; text: string };

interface MapViewLayoutProps { header: React.ReactNode; }

// --- Analysis helpers ---
function getColonyHistory(data: Map<number, YearData>, colonyName: string, years: number[]) {
    return years.map(yr => {
        const col = data.get(yr)?.colonies.get(colonyName);
        return { year: yr, birds: col?.birds ?? 0, nests: col?.nests ?? 0, species: col?.species.size ?? 0 };
    });
}

function computeTrend(values: number[]): { direction: "up" | "down" | "stable"; pct: number } {
    if (values.length < 2) return { direction: "stable", pct: 0 };
    const recent = values.slice(-3);
    const earlier = values.slice(0, Math.max(3, Math.floor(values.length / 2)));
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const avgEarlier = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    if (avgEarlier === 0) return { direction: avgRecent > 0 ? "up" : "stable", pct: 0 };
    const pct = Math.round(((avgRecent - avgEarlier) / avgEarlier) * 100);
    return { direction: pct > 10 ? "up" : pct < -10 ? "down" : "stable", pct: Math.abs(pct) };
}

function findAnomalies(history: { year: number; birds: number }[]): string[] {
    const alerts: string[] = [];
    const vals = history.filter(h => h.birds > 0);
    if (vals.length < 3) return alerts;
    const avg = vals.reduce((a, b) => a + b.birds, 0) / vals.length;
    const lastNonZero = vals[vals.length - 1];
    const peak = Math.max(...vals.map(v => v.birds));
    const peakYear = vals.find(v => v.birds === peak)?.year;

    // Check for recent sharp decline
    if (vals.length >= 2) {
        const last = vals[vals.length - 1].birds;
        const prev = vals[vals.length - 2].birds;
        if (prev > 0 && last < prev * 0.5) {
            alerts.push(`Sharp decline: ${Math.round((1 - last / prev) * 100)}% drop in ${vals[vals.length - 1].year}`);
        }
    }
    // Missing from recent surveys
    const allYears = history.map(h => h.year);
    const maxYear = Math.max(...allYears);
    const recentMissing = history.filter(h => h.year >= maxYear - 2 && h.birds === 0);
    if (recentMissing.length > 0 && vals.length > 0) {
        alerts.push(`Not surveyed in ${recentMissing.map(r => r.year).join(", ")}`);
    }
    // Below historical average
    if (lastNonZero && lastNonZero.birds < avg * 0.6) {
        alerts.push(`Current population ${Math.round((1 - lastNonZero.birds / avg) * 100)}% below historical average`);
    }
    // Recovery from low
    if (vals.length >= 3) {
        const low = Math.min(...vals.map(v => v.birds));
        if (lastNonZero && lastNonZero.birds > low * 2 && low > 0) {
            const lowYear = vals.find(v => v.birds === low)?.year;
            alerts.push(`Recovered ${Math.round((lastNonZero.birds / low - 1) * 100)}% from ${lowYear} low`);
        }
    }
    // Peak info
    if (peakYear && peak > 0 && lastNonZero && lastNonZero.birds < peak * 0.8) {
        alerts.push(`Peak was ${Math.round(peak).toLocaleString()} birds in ${peakYear}`);
    }
    return alerts;
}

function getSpeciesTrends(data: Map<number, YearData>, colonyName: string, years: number[]) {
    const speciesMap = new Map<string, number[]>();
    years.forEach(yr => {
        const col = data.get(yr)?.colonies.get(colonyName);
        if (!col) return;
        col.rows.forEach(r => {
            if (!speciesMap.has(r.species)) speciesMap.set(r.species, new Array(years.length).fill(0));
            const idx = years.indexOf(yr);
            speciesMap.get(r.species)![idx] += r.birds;
        });
    });
    return Array.from(speciesMap.entries()).map(([species, vals]) => {
        const total = vals.reduce((a, b) => a + b, 0);
        const trend = computeTrend(vals);
        const lastVal = vals.findLast(v => v > 0) ?? 0;
        return { species, total, lastVal, trend, sparkline: vals };
    }).sort((a, b) => b.total - a.total);
}

// Mini sparkline SVG
function Sparkline({ data, color = "hsl(var(--primary))", width = 60, height = 20 }: { data: number[]; color?: string; width?: number; height?: number }) {
    const max = Math.max(...data, 1);
    const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * height}`).join(" ");
    return (
        <svg width={width} height={height} className="inline-block">
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function TrendBadge({ trend }: { trend: { direction: "up" | "down" | "stable"; pct: number } }) {
    if (trend.direction === "up") return <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-400"><ArrowUpRight className="h-3 w-3" />+{trend.pct}%</span>;
    if (trend.direction === "down") return <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-red-400"><ArrowDownRight className="h-3 w-3" />-{trend.pct}%</span>;
    return <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-white/40"><Minus className="h-3 w-3" />Stable</span>;
}

export default function MapViewLayout({ header }: MapViewLayoutProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Map<number, YearData>>(new Map());
    const [years, setYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState<number>(2024);
    const [activeColony, setActiveColony] = useState<ColonyData | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [search, setSearch] = useState("");
    const [trendModalOpen, setTrendModalOpen] = useState(false);
    const [trendSpecies, setTrendSpecies] = useState("TOTAL");
    const [chatOpen, setChatOpen] = useState(true);
    const [chatInput, setChatInput] = useState("");
    const [messages, setMessages] = useState<ChatMsg[]>([
        { id: "1", role: "bot", text: "I analyze your colony data in real-time. Try:\n- \"analyze 2018\" — full year breakdown\n- \"declining\" — colonies losing population\n- \"compare 2015 vs 2020\"\n- \"top species\" — dominant species analysis\n- \"health report\" — ecosystem overview\n- Or click any colony for auto-analysis" }
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
                    const name = row[idx.name] || "Unknown";
                    const birds = parseFloat(row[idx.birds]) || 0;
                    const nests = parseFloat(row[idx.nests]) || 0;
                    const sp = row[idx.sp] || "UKN";
                    yrD.totalBirds += birds; yrD.totalNests += nests;
                    yrD.rows.push({ name, birds, nests, species: sp, year: yr });
                    if (!yrD.colonies.has(name)) {
                        yrD.colonies.set(name, {
                            name, region: row[idx.reg] || "Coast", lat: parseFloat(row[idx.lat]) || 0,
                            lng: parseFloat(row[idx.lng]) || 0, birds: 0, nests: 0,
                            species: new Set(), rows: []
                        });
                    }
                    const col = yrD.colonies.get(name)!;
                    col.birds += birds; col.nests += nests; col.species.add(sp);
                    col.rows.push({ name, birds, nests, species: sp, year: yr });
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

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    // Auto-analyze when colony is selected
    useEffect(() => {
        if (!activeColony || years.length === 0) return;
        const history = getColonyHistory(data, activeColony.name, years);
        const birdTrend = computeTrend(history.map(h => h.birds));
        const anomalies = findAnomalies(history);
        const speciesTrends = getSpeciesTrends(data, activeColony.name, years);

        const topGrowing = speciesTrends.filter(s => s.trend.direction === "up").slice(0, 3);
        const topDeclining = speciesTrends.filter(s => s.trend.direction === "down").slice(0, 3);

        let analysis = `[ AUTO-ANALYSIS: ${activeColony.name} ]\n\n`;
        analysis += `Overall trend: ${birdTrend.direction === "up" ? "+" : birdTrend.direction === "down" ? "-" : ""}${birdTrend.pct}% (${birdTrend.direction})\n`;
        analysis += `Species diversity: ${activeColony.species.size} taxa recorded\n`;
        analysis += `Current population: ${Math.round(activeColony.birds).toLocaleString()} birds\n\n`;

        if (topGrowing.length > 0) {
            analysis += `Growing species:\n${topGrowing.map(s => `  + ${s.species} (+${s.trend.pct}%)`).join('\n')}\n\n`;
        }
        if (topDeclining.length > 0) {
            analysis += `Declining species:\n${topDeclining.map(s => `  - ${s.species} (-${s.trend.pct}%)`).join('\n')}\n\n`;
        }
        if (anomalies.length > 0) {
            analysis += `Alerts:\n${anomalies.map(a => `  ! ${a}`).join('\n')}`;
        }

        setMessages(m => [...m, { id: Date.now().toString(), role: "bot", text: analysis }]);
    }, [activeColony?.name]);

    // --- AI Analysis Engine ---
    const handleCommand = useCallback((input: string) => {
        const text = input.toLowerCase();
        setMessages(m => [...m, { id: Date.now().toString(), role: "user", text: input }]);
        setChatInput("");
        setMessages(m => [...m, { id: (Date.now() + 1).toString(), role: "thinking", text: "Analyzing datasets..." }]);

        setTimeout(() => {
            let response = "";
            const yearMatch = text.match(/\b(19|20)\d{2}\b/);

            if (yearMatch && !text.includes("compare")) {
                const yr = parseInt(yearMatch[0]);
                const yrData = data.get(yr);
                if (yrData) {
                    setSelectedYear(yr);
                    const colonies = Array.from(yrData.colonies.values()).sort((a, b) => b.birds - a.birds);
                    const speciesCounts: Record<string, number> = {};
                    yrData.rows.forEach(r => { speciesCounts[r.species] = (speciesCounts[r.species] || 0) + r.birds; });
                    const sortedSpecies = Object.entries(speciesCounts).sort((a, b) => b[1] - a[1]);

                    const prevYr = data.get(yr - 1);
                    const yoyChange = prevYr ? ((yrData.totalBirds - prevYr.totalBirds) / prevYr.totalBirds * 100).toFixed(1) : null;

                    response = `[ YEAR ANALYSIS: ${yr} ]\n\n`;
                    response += `Population: ${Math.round(yrData.totalBirds).toLocaleString()} birds`;
                    if (yoyChange) response += ` (${parseFloat(yoyChange) > 0 ? '+' : ''}${yoyChange}% YoY)`;
                    response += `\nNesting: ${Math.round(yrData.totalNests).toLocaleString()} nests\n`;
                    response += `Active colonies: ${yrData.colonies.size}\n`;
                    response += `Species observed: ${Object.keys(speciesCounts).length}\n\n`;

                    response += `Top 5 colonies:\n`;
                    colonies.slice(0, 5).forEach((c, i) => {
                        response += `  ${i + 1}. ${c.name} — ${Math.round(c.birds).toLocaleString()} birds (${c.species.size} spp)\n`;
                    });

                    response += `\nDominant species:\n`;
                    sortedSpecies.slice(0, 5).forEach(([sp, count]) => {
                        const pct = ((count / yrData.totalBirds) * 100).toFixed(1);
                        response += `  ${sp}: ${Math.round(count).toLocaleString()} (${pct}%)\n`;
                    });

                    // Check for anomalies in this year
                    const avgBirdsPerYear = Array.from(data.values()).reduce((a, b) => a + b.totalBirds, 0) / data.size;
                    if (yrData.totalBirds < avgBirdsPerYear * 0.7) {
                        response += `\n⚠ Below-average year (${Math.round((1 - yrData.totalBirds / avgBirdsPerYear) * 100)}% below mean)`;
                    } else if (yrData.totalBirds > avgBirdsPerYear * 1.3) {
                        response += `\n✓ Above-average year (+${Math.round((yrData.totalBirds / avgBirdsPerYear - 1) * 100)}% above mean)`;
                    }
                } else {
                    response = `Year ${yr} not in dataset. Range: ${years[0]}-${years[years.length - 1]}`;
                }
            } else if (text.includes("compare")) {
                const yrs = text.match(/\b(20\d{2})\b/g);
                if (yrs && yrs.length >= 2) {
                    const y1 = parseInt(yrs[0]), y2 = parseInt(yrs[1]);
                    const d1 = data.get(y1), d2 = data.get(y2);
                    if (d1 && d2) {
                        const birdDelta = d2.totalBirds - d1.totalBirds;
                        const pct = ((birdDelta / d1.totalBirds) * 100).toFixed(1);

                        response = `[ COMPARISON: ${y1} vs ${y2} ]\n\n`;
                        response += `Birds: ${Math.round(d1.totalBirds).toLocaleString()} → ${Math.round(d2.totalBirds).toLocaleString()} (${parseFloat(pct) > 0 ? '+' : ''}${pct}%)\n`;
                        response += `Nests: ${Math.round(d1.totalNests).toLocaleString()} → ${Math.round(d2.totalNests).toLocaleString()}\n`;
                        response += `Colonies: ${d1.colonies.size} → ${d2.colonies.size}\n\n`;

                        // Find biggest winners/losers
                        const allNames = new Set([...d1.colonies.keys(), ...d2.colonies.keys()]);
                        const changes: { name: string; delta: number; pct: number }[] = [];
                        allNames.forEach(name => {
                            const b1 = d1.colonies.get(name)?.birds ?? 0;
                            const b2 = d2.colonies.get(name)?.birds ?? 0;
                            if (b1 > 50 || b2 > 50) {
                                changes.push({ name, delta: b2 - b1, pct: b1 > 0 ? Math.round((b2 / b1 - 1) * 100) : 100 });
                            }
                        });
                        const gainers = changes.filter(c => c.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 3);
                        const losers = changes.filter(c => c.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 3);

                        if (gainers.length) {
                            response += `Biggest gains:\n`;
                            gainers.forEach(g => { response += `  + ${g.name}: +${Math.round(g.delta).toLocaleString()} birds (+${g.pct}%)\n`; });
                        }
                        if (losers.length) {
                            response += `\nBiggest losses:\n`;
                            losers.forEach(l => { response += `  - ${l.name}: ${Math.round(l.delta).toLocaleString()} birds (${l.pct}%)\n`; });
                        }
                    } else { response = "One or both years not found."; }
                } else { response = 'Usage: "compare 2015 vs 2020"'; }
            } else if (text.includes("declining") || text.includes("at risk") || text.includes("concern")) {
                const declining: { name: string; drop: number; peak: number; current: number; peakYear: number }[] = [];
                const allNames = new Set<string>();
                data.forEach(yd => yd.colonies.forEach((_, n) => allNames.add(n)));

                allNames.forEach(name => {
                    const history = getColonyHistory(data, name, years).filter(h => h.birds > 0);
                    if (history.length < 3) return;
                    const peak = Math.max(...history.map(h => h.birds));
                    const peakYear = history.find(h => h.birds === peak)?.year ?? 0;
                    const recent = history.slice(-2);
                    const current = recent[recent.length - 1]?.birds ?? 0;
                    if (peak > 100 && current < peak * 0.5) {
                        declining.push({ name, drop: Math.round((1 - current / peak) * 100), peak: Math.round(peak), current: Math.round(current), peakYear });
                    }
                });

                declining.sort((a, b) => b.drop - a.drop);
                response = `[ COLONIES OF CONCERN ]\n\n${declining.length} colonies with >50% decline from peak:\n\n`;
                declining.slice(0, 10).forEach((c, i) => {
                    response += `${i + 1}. ${c.name}\n   Peak: ${c.peak.toLocaleString()} (${c.peakYear}) → Now: ${c.current.toLocaleString()} (-${c.drop}%)\n`;
                });
                if (declining.length > 10) response += `\n...and ${declining.length - 10} more`;
                if (declining.length === 0) response = "No colonies showing >50% decline from peak.";
            } else if (text.includes("recovery") || text.includes("success") || text.includes("growing")) {
                const growing: { name: string; growth: number; low: number; current: number; lowYear: number }[] = [];
                const allNames = new Set<string>();
                data.forEach(yd => yd.colonies.forEach((_, n) => allNames.add(n)));

                allNames.forEach(name => {
                    const history = getColonyHistory(data, name, years).filter(h => h.birds > 0);
                    if (history.length < 3) return;
                    const low = Math.min(...history.map(h => h.birds));
                    const lowYear = history.find(h => h.birds === low)?.year ?? 0;
                    const current = history[history.length - 1]?.birds ?? 0;
                    if (low > 0 && current > low * 2 && current > 100) {
                        growing.push({ name, growth: Math.round((current / low - 1) * 100), low: Math.round(low), current: Math.round(current), lowYear });
                    }
                });

                growing.sort((a, b) => b.growth - a.growth);
                response = `[ RECOVERY SUCCESS STORIES ]\n\n${growing.length} colonies with >100% growth from low:\n\n`;
                growing.slice(0, 10).forEach((c, i) => {
                    response += `${i + 1}. ${c.name}\n   Low: ${c.low.toLocaleString()} (${c.lowYear}) → Now: ${c.current.toLocaleString()} (+${c.growth}%)\n`;
                });
                if (growing.length === 0) response = "No major recovery stories found.";
            } else if (text.includes("top species") || text.includes("dominant") || text.includes("species breakdown")) {
                const speciesTotal = new Map<string, { total: number; colonies: Set<string>; yearCounts: number[] }>();
                years.forEach((yr, yi) => {
                    const yrData = data.get(yr);
                    if (!yrData) return;
                    yrData.rows.forEach(r => {
                        if (!speciesTotal.has(r.species)) speciesTotal.set(r.species, { total: 0, colonies: new Set(), yearCounts: new Array(years.length).fill(0) });
                        const s = speciesTotal.get(r.species)!;
                        s.total += r.birds; s.colonies.add(r.name); s.yearCounts[yi] += r.birds;
                    });
                });
                const sorted = Array.from(speciesTotal.entries()).sort((a, b) => b[1].total - a[1].total);
                const grandTotal = sorted.reduce((a, b) => a + b[1].total, 0);

                response = `[ SPECIES DOMINANCE ANALYSIS ]\n\n`;
                response += `${sorted.length} species across all years\n\n`;
                sorted.slice(0, 10).forEach(([sp, info], i) => {
                    const trend = computeTrend(info.yearCounts);
                    const pct = ((info.total / grandTotal) * 100).toFixed(1);
                    const trendIcon = trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→";
                    response += `${i + 1}. ${sp} — ${Math.round(info.total).toLocaleString()} total (${pct}%)\n`;
                    response += `   ${info.colonies.size} colonies | Trend: ${trendIcon} ${trend.pct}%\n`;
                });
            } else if (text.includes("health") || text.includes("report") || text.includes("overview") || text.includes("summary")) {
                const currentYr = data.get(selectedYear);
                const allBirds = Array.from(data.entries()).map(([yr, d]) => ({ yr, birds: d.totalBirds }));
                const overallTrend = computeTrend(allBirds.map(a => a.birds));
                const peak = allBirds.reduce((a, b) => a.birds > b.birds ? a : b);
                const low = allBirds.reduce((a, b) => a.birds < b.birds ? a : b);

                // Count declining vs growing colonies
                let decliningCount = 0, growingCount = 0, stableCount = 0;
                const allNames = new Set<string>();
                data.forEach(yd => yd.colonies.forEach((_, n) => allNames.add(n)));
                allNames.forEach(name => {
                    const hist = getColonyHistory(data, name, years).map(h => h.birds);
                    const t = computeTrend(hist);
                    if (t.direction === "up") growingCount++;
                    else if (t.direction === "down") decliningCount++;
                    else stableCount++;
                });

                response = `[ ECOSYSTEM HEALTH REPORT ]\n\n`;
                response += `Timeline: ${years[0]}–${years[years.length - 1]} (${years.length} years)\n`;
                response += `Current view: ${selectedYear}\n\n`;
                response += `Overall trend: ${overallTrend.direction === "up" ? "↑ Growing" : overallTrend.direction === "down" ? "↓ Declining" : "→ Stable"} (${overallTrend.pct}%)\n`;
                response += `Peak: ${Math.round(peak.birds).toLocaleString()} birds (${peak.yr})\n`;
                response += `Low: ${Math.round(low.birds).toLocaleString()} birds (${low.yr})\n\n`;
                response += `Colony health:\n`;
                response += `  Growing: ${growingCount} colonies\n`;
                response += `  Stable: ${stableCount} colonies\n`;
                response += `  Declining: ${decliningCount} colonies\n\n`;
                if (currentYr) {
                    response += `${selectedYear} snapshot:\n`;
                    response += `  ${Math.round(currentYr.totalBirds).toLocaleString()} birds | ${Math.round(currentYr.totalNests).toLocaleString()} nests | ${currentYr.colonies.size} active colonies`;
                }
            } else {
                response = "I can analyze:\n- \"analyze [year]\" — year breakdown\n- \"compare [year] vs [year]\" — side by side\n- \"declining\" — at-risk colonies\n- \"recovery\" — success stories\n- \"top species\" — dominance analysis\n- \"health report\" — ecosystem overview\n\nOr click a colony on the map for auto-analysis.";
            }

            setMessages(m => m.filter(msg => msg.role !== "thinking").concat({ id: Date.now().toString(), role: "bot", text: response }));
        }, 600);
    }, [data, selectedYear, years]);

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
        return () => { if (timer) clearInterval(timer); };
    }, [isPlaying, years]);

    const filteredColonies = useMemo(() => {
        const yr = data.get(selectedYear);
        return yr ? Array.from(yr.colonies.values()).filter(c => c.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.birds - a.birds) : [];
    }, [data, selectedYear, search]);

    const mapColonies = useMemo((): ColonyStats[] => {
        return filteredColonies.filter(c => c.lat && c.lng).map(c => ({
            colonyName: c.name, colonyId: "", latitude: c.lat, longitude: c.lng,
            totalBirds: Math.round(c.birds), totalNests: Math.round(c.nests),
            uniqueSpecies: c.species.size, observations: c.rows.length, geoRegion: c.region,
        }));
    }, [filteredColonies]);

    // Colony analysis data
    const colonyAnalysis = useMemo(() => {
        if (!activeColony || years.length === 0) return null;
        const history = getColonyHistory(data, activeColony.name, years);
        const birdTrend = computeTrend(history.map(h => h.birds));
        const nestTrend = computeTrend(history.map(h => h.nests));
        const anomalies = findAnomalies(history);
        const speciesTrends = getSpeciesTrends(data, activeColony.name, years);
        return { history, birdTrend, nestTrend, anomalies, speciesTrends };
    }, [activeColony, data, years]);

    // Historical trend line for modal
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
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 10px; }
                .text-glow { text-shadow: 0 0 20px rgba(59, 130, 246, 0.6); }
                @keyframes pulse-thinking { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                .thinking-pulse { animation: pulse-thinking 1.5s infinite; }
            `}</style>

            {header}

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-black/20">
                    <Loader2 className="animate-spin h-10 w-10 text-primary" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Loading Data</p>
                </div>
            ) : (
                <div className="flex-1 flex overflow-hidden relative">
                    {/* Left Panel: Rankings */}
                    <aside className="w-[220px] border-r border-white/5 bg-black/40 flex flex-col shrink-0 z-20">
                        <div className="px-3 py-2 border-b border-white/5 bg-primary/5 flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-primary">Colonies</span>
                            <span className="text-[9px] font-mono text-muted-foreground">{filteredColonies.length}</span>
                        </div>
                        <div className="px-2 py-1.5 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 opacity-30" />
                                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-6 h-6 bg-white/5 border-none rounded text-[10px]" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-0.5">
                            {filteredColonies.map((c, i) => {
                                const active = activeColony?.name === c.name;
                                const pct = (c.birds / (filteredColonies[0]?.birds || 1)) * 100;
                                // Quick trend indicator
                                const hist = getColonyHistory(data, c.name, years);
                                const trend = computeTrend(hist.map(h => h.birds));
                                return (
                                    <button key={c.name} onClick={() => setActiveColony(c)} className={`w-full text-left px-2 py-1.5 rounded transition-all ${active ? 'bg-primary text-white' : 'hover:bg-white/5'}`}>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[8px] font-mono shrink-0 w-4 ${active ? 'text-white/50' : 'text-white/20'}`}>{i + 1}</span>
                                            <span className="text-[10px] font-semibold truncate flex-1">{c.name}</span>
                                            <span className={`text-[9px] font-mono shrink-0 ${active ? 'text-white' : 'text-primary'}`}>{Math.round(c.birds).toLocaleString()}</span>
                                            {trend.direction === "up" && <ArrowUpRight className="h-2.5 w-2.5 text-emerald-400 shrink-0" />}
                                            {trend.direction === "down" && <ArrowDownRight className="h-2.5 w-2.5 text-red-400 shrink-0" />}
                                        </div>
                                        <div className={`mt-1 h-[1px] w-full rounded-full overflow-hidden ${active ? 'bg-white/20' : 'bg-white/5'}`}>
                                            <div className={`h-full ${active ? 'bg-white' : 'bg-primary/60'}`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Middle: Map + Analysis */}
                    <main className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col isolate">
                        {/* Leaflet Map — contained stacking context */}
                        <div className="h-[50vh] min-h-[250px] shrink-0 relative z-0">
                            <ColonyMap
                                colonies={mapColonies}
                                onColonyClick={(colony) => {
                                    const match = filteredColonies.find(c => c.name === colony.colonyName);
                                    if (match) setActiveColony(match);
                                }}
                                selectedColony={activeColony?.name}
                                className="h-full w-full"
                                interactive
                            />
                            {/* Year overlay */}
                            <div className="absolute top-3 right-3 z-[1000] bg-black/80 backdrop-blur-sm rounded-lg px-2.5 py-1 border border-white/10">
                                <span className="text-[10px] font-bold text-primary">{selectedYear}</span>
                                <span className="text-[9px] text-muted-foreground ml-1.5">{filteredColonies.length} colonies</span>
                            </div>
                        </div>

                        {/* Colony Analysis Panel */}
                        <div className="flex-1 p-3">
                            {activeColony && colonyAnalysis ? (
                                <div className="max-w-4xl mx-auto space-y-3 animate-in fade-in duration-300">
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <MapPin className="h-4 w-4 text-primary shrink-0" />
                                            <div className="min-w-0">
                                                <h1 className="text-lg font-bold uppercase truncate leading-tight">{activeColony.name}</h1>
                                                <p className="text-[9px] text-primary font-semibold uppercase tracking-wider">{activeColony.region}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <TrendBadge trend={colonyAnalysis.birdTrend} />
                                            <Button variant="outline" size="sm" className="h-7 rounded text-[10px] gap-1 border-white/10 px-2" onClick={() => { setTrendSpecies("TOTAL"); setTrendModalOpen(true); }}>
                                                <TrendingUp className="h-3 w-3 text-primary" /> Trend
                                            </Button>
                                            <Button variant="outline" size="sm" className="h-7 rounded text-[10px] gap-1 border-white/10 px-2">
                                                <Download className="h-3 w-3" /> Export
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Key metrics with sparklines */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="glass rounded-lg px-3 py-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[8px] font-bold uppercase text-white/40">Population</span>
                                                <TrendBadge trend={colonyAnalysis.birdTrend} />
                                            </div>
                                            <div className="flex items-end justify-between gap-2">
                                                <span className="text-xl font-bold leading-none">{Math.round(activeColony.birds).toLocaleString()}</span>
                                                <Sparkline data={colonyAnalysis.history.map(h => h.birds)} />
                                            </div>
                                        </div>
                                        <div className="glass rounded-lg px-3 py-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[8px] font-bold uppercase text-white/40">Nesting</span>
                                                <TrendBadge trend={colonyAnalysis.nestTrend} />
                                            </div>
                                            <div className="flex items-end justify-between gap-2">
                                                <span className="text-xl font-bold leading-none">{Math.round(activeColony.nests).toLocaleString()}</span>
                                                <Sparkline data={colonyAnalysis.history.map(h => h.nests)} />
                                            </div>
                                        </div>
                                        <div className="glass rounded-lg px-3 py-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[8px] font-bold uppercase text-white/40">Species</span>
                                                <span className="text-[9px] font-bold text-white/40">{activeColony.species.size} taxa</span>
                                            </div>
                                            <div className="flex items-end justify-between gap-2">
                                                <span className="text-xl font-bold leading-none">{activeColony.species.size}</span>
                                                <Sparkline data={colonyAnalysis.history.map(h => h.species)} color="#10b981" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Alerts */}
                                    {colonyAnalysis.anomalies.length > 0 && (
                                        <div className="glass rounded-lg px-3 py-2 border-amber-500/20 bg-amber-500/5">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <AlertTriangle className="h-3 w-3 text-amber-400" />
                                                <span className="text-[9px] font-bold uppercase text-amber-400 tracking-wider">Alerts</span>
                                            </div>
                                            <div className="space-y-0.5">
                                                {colonyAnalysis.anomalies.map((a, i) => (
                                                    <p key={i} className="text-[10px] text-amber-200/70">{a}</p>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Species breakdown with trends */}
                                    <div className="glass rounded-lg overflow-hidden">
                                        <div className="px-3 py-1.5 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Eye className="h-3 w-3 text-primary" />
                                                <span className="text-[9px] font-bold uppercase tracking-wider">Species Analysis</span>
                                            </div>
                                            <span className="text-[8px] text-muted-foreground">{selectedYear}</span>
                                        </div>
                                        <div className="divide-y divide-white/[0.03]">
                                            {colonyAnalysis.speciesTrends.slice(0, 8).map((sp) => (
                                                <div key={sp.species} className="px-3 py-1.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                                                    <span className="text-[10px] font-bold text-primary uppercase w-16 shrink-0">{sp.species}</span>
                                                    <Sparkline data={sp.sparkline} width={50} height={14} color={sp.trend.direction === "down" ? "#f87171" : sp.trend.direction === "up" ? "#34d399" : "#6b7280"} />
                                                    <span className="text-[10px] font-mono text-right flex-1">{Math.round(sp.lastVal).toLocaleString()}</span>
                                                    <TrendBadge trend={sp.trend} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-15 select-none">
                                    <Bird className="h-12 w-12 mb-2" />
                                    <p className="text-xs font-bold uppercase tracking-[0.3em]">Select a colony to analyze</p>
                                </div>
                            )}
                        </div>
                    </main>

                    {/* Right Panel: AI Chat */}
                    <aside className={`w-[280px] border-l border-white/10 bg-[#080808] flex flex-col shrink-0 transition-all duration-500 z-30 ${chatOpen ? 'mr-0' : '-mr-[280px]'}`}>
                        <div className="px-3 py-2 border-b border-white/10 bg-primary/5 flex items-center gap-2">
                            <div className="h-6 w-6 bg-primary rounded-md flex items-center justify-center">
                                <Bot className="h-3 w-3 text-white" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold uppercase tracking-wider leading-none">Data Analyst</h3>
                                <p className="text-[8px] font-bold text-emerald-400 mt-0.5 uppercase tracking-wider">Live</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-2 custom-scrollbar">
                            {messages.map(m => (
                                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {m.role === 'thinking' ? (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass text-primary thinking-pulse text-[10px]">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            <span>{m.text}</span>
                                        </div>
                                    ) : (
                                        <div className={`max-w-[95%] px-2.5 py-2 rounded-lg text-[10px] leading-relaxed whitespace-pre-line font-mono ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'glass border-white/10 rounded-tl-none text-muted-foreground'}`}>
                                            {m.text}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="px-2 py-1.5 border-t border-white/10 bg-black/40 flex gap-1">
                            <Input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && chatInput.trim() && handleCommand(chatInput)} placeholder="Analyze data..." className="h-7 rounded bg-transparent border-white/10 text-[10px] px-2.5" />
                            <Button size="sm" className="h-7 w-7 rounded shrink-0 bg-primary p-0" onClick={() => chatInput.trim() && handleCommand(chatInput)}>
                                <ArrowRight className="h-3 w-3 text-white" />
                            </Button>
                        </div>
                    </aside>
                </div>
            )}

            {/* --- Historical Trend Modal --- */}
            <Dialog open={trendModalOpen} onOpenChange={setTrendModalOpen}>
                <DialogContent className="max-w-3xl bg-[#0a0a0a] border-white/10 rounded-xl p-0 overflow-hidden [&>button]:hidden">
                    <div className="flex h-[400px]">
                        {/* Species selector */}
                        <div className="w-40 border-r border-white/5 bg-black/40 p-3 flex flex-col shrink-0">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Species</span>
                            <div className="space-y-0.5 overflow-y-auto custom-scrollbar flex-1">
                                <button onClick={() => setTrendSpecies("TOTAL")} className={`w-full text-left px-2.5 py-1.5 rounded text-[10px] font-bold transition-all ${trendSpecies === "TOTAL" ? "bg-primary text-white" : "hover:bg-white/5 text-white/50"}`}>
                                    All Species
                                </button>
                                {Array.from(activeColony?.species || []).map(s => (
                                    <button key={s} onClick={() => setTrendSpecies(s)} className={`w-full text-left px-2.5 py-1.5 rounded text-[10px] font-semibold transition-all ${trendSpecies === s ? "bg-primary/20 text-primary" : "text-white/40 hover:text-white/70 hover:bg-white/5"}`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Chart */}
                        <div className="flex-1 p-5 flex flex-col">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-lg font-bold uppercase">{activeColony?.name}</h3>
                                    <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                                        {trendSpecies === "TOTAL" ? "All Species" : trendSpecies}
                                    </p>
                                </div>
                                <button onClick={() => setTrendModalOpen(false)} className="h-7 w-7 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                                    <span className="text-sm">×</span>
                                </button>
                            </div>
                            <div className="flex-1 relative">
                                {historicalLine.length > 1 && (() => {
                                    const maxVal = Math.max(...historicalLine.map(x => x.val), 1);
                                    const W = 600;
                                    const H = 280;
                                    const pad = { top: 20, right: 20, bottom: 8, left: 20 };
                                    const cw = W - pad.left - pad.right;
                                    const ch = H - pad.top - pad.bottom;
                                    const pts = historicalLine.map((t, i) => ({
                                        x: pad.left + (i / (historicalLine.length - 1)) * cw,
                                        y: pad.top + ch - (t.val / maxVal) * ch,
                                        yr: t.yr, val: t.val,
                                    }));
                                    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
                                    const fillPath = `M ${pad.left},${pad.top + ch} L ${pts.map(p => `${p.x},${p.y}`).join(' L ')} L ${pad.left + cw},${pad.top + ch} Z`;
                                    return (
                                        <svg className="w-full h-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
                                            <defs>
                                                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
                                                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            {/* Grid lines */}
                                            {[0, 0.25, 0.5, 0.75, 1].map(f => {
                                                const y = pad.top + ch - f * ch;
                                                return <line key={f} x1={pad.left} y1={y} x2={pad.left + cw} y2={y} stroke="white" strokeOpacity="0.06" strokeWidth="1" />;
                                            })}
                                            <path d={fillPath} fill="url(#trendFill)" />
                                            <path d={linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            {pts.map((p, i) => (
                                                <g key={i}>
                                                    <circle cx={p.x} cy={p.y} r="3.5" fill="hsl(var(--primary))" fillOpacity="0.2" stroke="none" />
                                                    <circle cx={p.x} cy={p.y} r="2" fill="white" stroke="hsl(var(--primary))" strokeWidth="1.5" />
                                                    <title>{p.yr}: {Math.round(p.val).toLocaleString()} birds</title>
                                                </g>
                                            ))}
                                            {/* Y-axis labels */}
                                            {[0, 0.5, 1].map(f => {
                                                const y = pad.top + ch - f * ch;
                                                const v = Math.round(maxVal * f);
                                                return <text key={f} x={pad.left - 4} y={y + 3} textAnchor="end" fill="white" fillOpacity="0.25" fontSize="9" fontFamily="monospace">{v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}</text>;
                                            })}
                                        </svg>
                                    );
                                })()}
                            </div>
                            {/* Year axis labels */}
                            <div className="flex justify-between mt-2 text-[9px] font-mono text-white/30 border-t border-white/5 pt-2">
                                {historicalLine.filter((_, i) => i % Math.max(1, Math.floor(historicalLine.length / 6)) === 0 || i === historicalLine.length - 1).map(t => (
                                    <span key={t.yr}>{t.yr}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* --- Temporal Controller --- */}
            <footer className="h-12 border-t border-white/10 bg-black/60 backdrop-blur-xl px-4 flex items-center gap-3 shrink-0 z-[100]">
                <div className="flex items-center gap-2">
                    <Button onClick={() => { setIsPlaying(!isPlaying); if (!isPlaying) setActiveColony(null); }} size="sm" className={`h-8 w-8 rounded-lg p-0 ${isPlaying ? "bg-red-500" : "bg-primary"}`}>
                        {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current ml-0.5" />}
                    </Button>
                    <div>
                        <span className="text-[7px] font-bold uppercase text-primary/60 tracking-wider block leading-none">Timeline</span>
                        <span className="text-lg font-bold leading-none">{selectedYear}</span>
                    </div>
                </div>

                <div className="flex-1 flex items-end gap-[2px] h-8 bg-white/5 rounded-lg p-1.5 border border-white/5">
                    {years.map(y => {
                        const active = y === selectedYear;
                        const v = data.get(y)?.totalBirds || 0;
                        const max = Math.max(...Array.from(data.values()).map(d => d.totalBirds), 1);
                        return (
                            <button key={y} onClick={() => { setSelectedYear(y); setIsPlaying(false); }}
                                className={`flex-1 min-w-[4px] rounded-sm transition-all duration-300 ${active ? "bg-primary h-full" : "bg-white/10 hover:bg-white/20"}`}
                                style={active ? {} : { height: `${Math.max(15, (v / max) * 100)}%` }}
                                title={`${y}: ${Math.round(v).toLocaleString()} birds`}
                            />
                        );
                    })}
                </div>

                <Button size="sm" className={`h-8 w-8 rounded-lg p-0 ${chatOpen ? "bg-white/10" : "bg-primary"}`} onClick={() => setChatOpen(!chatOpen)}>
                    {chatOpen ? <Terminal className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
                </Button>
            </footer>
        </div>
    );
}
