import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
    Bird, Play, Pause, TrendingUp, TrendingDown,
    Bot, Loader2,
    ArrowRight, MapPin, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus, Eye,
    Filter, X, ChevronDown
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
type ChatMsg = { id: string; role: "user" | "bot" | "thinking" | "step-done" | "step-active"; text: string };

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

    if (vals.length >= 2) {
        const last = vals[vals.length - 1].birds;
        const prev = vals[vals.length - 2].birds;
        if (prev > 0 && last < prev * 0.5) {
            alerts.push(`Sharp decline: ${Math.round((1 - last / prev) * 100)}% drop in ${vals[vals.length - 1].year}`);
        }
    }
    const allYears = history.map(h => h.year);
    const maxYear = Math.max(...allYears);
    const recentMissing = history.filter(h => h.year >= maxYear - 2 && h.birds === 0);
    if (recentMissing.length > 0 && vals.length > 0) {
        alerts.push(`Not surveyed in ${recentMissing.map(r => r.year).join(", ")}`);
    }
    if (lastNonZero && lastNonZero.birds < avg * 0.6) {
        alerts.push(`Current population ${Math.round((1 - lastNonZero.birds / avg) * 100)}% below historical average`);
    }
    if (vals.length >= 3) {
        const low = Math.min(...vals.map(v => v.birds));
        if (lastNonZero && lastNonZero.birds > low * 2 && low > 0) {
            const lowYear = vals.find(v => v.birds === low)?.year;
            alerts.push(`Recovered ${Math.round((lastNonZero.birds / low - 1) * 100)}% from ${lowYear} low`);
        }
    }
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

// --- Lightweight markdown renderer for chat ---
function MiniMarkdown({ text, className }: { text: string; className?: string }) {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    const renderInline = (s: string): React.ReactNode[] => {
        const parts: React.ReactNode[] = [];
        const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
        let lastIdx = 0;
        let match: RegExpExecArray | null;
        let key = 0;
        while ((match = re.exec(s)) !== null) {
            if (match.index > lastIdx) parts.push(s.slice(lastIdx, match.index));
            if (match[2]) parts.push(<strong key={key++} className="text-gray-900 font-semibold">{match[2]}</strong>);
            else if (match[3]) parts.push(<em key={key++} className="text-gray-500 italic">{match[3]}</em>);
            else if (match[4]) parts.push(<code key={key++} className="px-1 py-0.5 rounded bg-gray-100 text-blue-700 text-[0.85em]">{match[4]}</code>);
            lastIdx = match.index + match[0].length;
        }
        if (lastIdx < s.length) parts.push(s.slice(lastIdx));
        return parts;
    };

    while (i < lines.length) {
        const line = lines[i];

        if (line.match(/^-{3,}$/) || line.match(/^_{3,}$/)) {
            elements.push(<hr key={i} className="border-gray-200 my-2" />);
            i++; continue;
        }

        const hMatch = line.match(/^(#{1,4})\s+(.+)/);
        if (hMatch) {
            const level = hMatch[1].length;
            const cls = level === 1 ? "text-base font-bold text-gray-900 mt-1 mb-1.5"
                : level === 2 ? "text-sm font-bold text-blue-700 mt-2 mb-1"
                : level === 3 ? "text-xs font-semibold text-gray-700 mt-2 mb-0.5 uppercase tracking-wider"
                : "text-xs font-medium text-gray-500 mt-1.5 mb-0.5";
            elements.push(<div key={i} className={cls}>{renderInline(hMatch[2])}</div>);
            i++; continue;
        }

        if (i + 1 < lines.length && lines[i + 1]?.match(/^\|[-|: ]+\|$/)) {
            const headers = line.split('|').filter(c => c.trim()).map(c => c.trim());
            i += 2;
            const rows: string[][] = [];
            while (i < lines.length && lines[i].startsWith('|')) {
                rows.push(lines[i].split('|').filter(c => c.trim()).map(c => c.trim()));
                i++;
            }
            elements.push(
                <div key={`tbl-${i}`} className="my-1.5 overflow-x-auto rounded border border-gray-200">
                    <table className="w-full text-[0.85em]">
                        <thead><tr className="border-b border-gray-200 bg-gray-50">
                            {headers.map((h, hi) => <th key={hi} className="px-2 py-1 text-left font-semibold text-gray-600">{renderInline(h)}</th>)}
                        </tr></thead>
                        <tbody>
                            {rows.map((row, ri) => (
                                <tr key={ri} className="border-b border-gray-100 last:border-0">
                                    {row.map((cell, ci) => {
                                        const isNeg = cell.match(/-\d+%/);
                                        const isPos = cell.match(/\+\d+%/);
                                        return <td key={ci} className={`px-2 py-1 ${isNeg ? 'text-red-600' : isPos ? 'text-green-600' : 'text-gray-700'}`}>{renderInline(cell)}</td>;
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            continue;
        }

        if (line.startsWith('> ')) {
            elements.push(
                <div key={i} className="border-l-2 border-blue-300 pl-2.5 py-1 my-1 text-gray-500 italic">
                    {renderInline(line.slice(2))}
                </div>
            );
            i++; continue;
        }

        if (line.match(/^[-*]\s/)) {
            elements.push(
                <div key={i} className="flex gap-1.5 py-0.5">
                    <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                    <span className="text-gray-700">{renderInline(line.replace(/^[-*]\s/, ''))}</span>
                </div>
            );
            i++; continue;
        }

        const olMatch = line.match(/^(\d+)\.\s(.+)/);
        if (olMatch) {
            elements.push(
                <div key={i} className="flex gap-1.5 py-0.5">
                    <span className="text-gray-400 shrink-0 w-4 text-right font-mono">{olMatch[1]}.</span>
                    <span className="text-gray-700">{renderInline(olMatch[2])}</span>
                </div>
            );
            i++; continue;
        }

        if (line.match(/^\s{2,}/) && line.trim()) {
            elements.push(
                <div key={i} className="pl-6 text-gray-500 -mt-0.5">
                    {renderInline(line.trim())}
                </div>
            );
            i++; continue;
        }

        if (!line.trim()) {
            elements.push(<div key={i} className="h-1" />);
            i++; continue;
        }

        elements.push(<div key={i} className="text-gray-700 py-0.5">{renderInline(line)}</div>);
        i++;
    }

    return <div className={className}>{elements}</div>;
}

// Mini sparkline SVG with optional draw animation
function Sparkline({ data, color = "hsl(var(--primary))", width = 80, height = 28, animate = false }: { data: number[]; color?: string; width?: number; height?: number; animate?: boolean }) {
    const max = Math.max(...data, 1);
    const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * height}`).join(" ");
    const id = `spark-${Math.random().toString(36).slice(2, 8)}`;
    return (
        <svg width={width} height={height} className="inline-block">
            {animate && (
                <defs>
                    <clipPath id={id}>
                        <rect x="0" y="0" width="0" height={height}>
                            <animate attributeName="width" from="0" to={width} dur="0.8s" fill="freeze" />
                        </rect>
                    </clipPath>
                </defs>
            )}
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                clipPath={animate ? `url(#${id})` : undefined}
            />
        </svg>
    );
}

function TrendBadge({ trend, size = "sm" }: { trend: { direction: "up" | "down" | "stable"; pct: number }; size?: "sm" | "lg" }) {
    const cls = size === "lg" ? "text-sm font-bold" : "text-[10px] font-bold";
    if (trend.direction === "up") return <span className={`inline-flex items-center gap-0.5 ${cls} text-emerald-400`}><ArrowUpRight className={size === "lg" ? "h-4 w-4" : "h-3 w-3"} />+{trend.pct}%</span>;
    if (trend.direction === "down") return <span className={`inline-flex items-center gap-0.5 ${cls} text-red-400`}><ArrowDownRight className={size === "lg" ? "h-4 w-4" : "h-3 w-3"} />-{trend.pct}%</span>;
    return <span className={`inline-flex items-center gap-0.5 ${cls} text-white/40`}><Minus className={size === "lg" ? "h-4 w-4" : "h-3 w-3"} />Stable</span>;
}

// --- CountUp animation hook ---
function useCountUp(target: number, duration = 1500, enabled = true) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!enabled) { setValue(target); return; }
        let start = 0;
        const startTime = Date.now();
        const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [target, duration, enabled]);
    return value;
}

// --- Precomputed response generators (unchanged logic) ---
function computeDWHResponse(data: Map<number, YearData>, years: number[]): string {
    const preSpillYears = years.filter(y => y <= 2010);
    const postSpillYears = years.filter(y => y > 2010);

    let preAvgBirds = 0, preAvgNests = 0;
    preSpillYears.forEach(yr => {
        const d = data.get(yr);
        if (d) { preAvgBirds += d.totalBirds; preAvgNests += d.totalNests; }
    });
    if (preSpillYears.length > 0) { preAvgBirds /= preSpillYears.length; preAvgNests /= preSpillYears.length; }

    const immediateYears = years.filter(y => y >= 2011 && y <= 2014);
    let postAvgBirds = 0;
    immediateYears.forEach(yr => {
        const d = data.get(yr);
        if (d) { postAvgBirds += d.totalBirds; }
    });
    if (immediateYears.length > 0) { postAvgBirds /= immediateYears.length; }

    const latestYr = years[years.length - 1];
    const latestData = data.get(latestYr);

    const allNames = new Set<string>();
    data.forEach(yd => yd.colonies.forEach((_, n) => allNames.add(n)));

    const neverRecovered: { name: string; prePeak: number; current: number; dropPct: number }[] = [];
    const fullyRecovered: { name: string; preAvg: number; current: number; growthPct: number }[] = [];
    const newSinceSpill: string[] = [];

    allNames.forEach(name => {
        const preHist = preSpillYears.map(yr => data.get(yr)?.colonies.get(name)?.birds ?? 0).filter(b => b > 0);
        const currentBirds = latestData?.colonies.get(name)?.birds ?? 0;

        if (preHist.length === 0 && currentBirds > 50) { newSinceSpill.push(name); return; }
        if (preHist.length === 0) return;

        const prePeak = Math.max(...preHist);
        const preAvg = preHist.reduce((a, b) => a + b, 0) / preHist.length;

        if (prePeak > 100 && currentBirds < prePeak * 0.4) {
            neverRecovered.push({ name, prePeak: Math.round(prePeak), current: Math.round(currentBirds), dropPct: Math.round((1 - currentBirds / prePeak) * 100) });
        } else if (preAvg > 50 && currentBirds >= preAvg * 0.9) {
            fullyRecovered.push({ name, preAvg: Math.round(preAvg), current: Math.round(currentBirds), growthPct: Math.round((currentBirds / preAvg - 1) * 100) });
        }
    });

    neverRecovered.sort((a, b) => b.dropPct - a.dropPct);
    fullyRecovered.sort((a, b) => b.growthPct - a.growthPct);

    const speciesPre = new Map<string, number>();
    const speciesPost = new Map<string, number>();
    preSpillYears.forEach(yr => {
        data.get(yr)?.rows.forEach(r => { speciesPre.set(r.species, (speciesPre.get(r.species) || 0) + r.birds); });
    });
    if (latestData) {
        latestData.rows.forEach(r => { speciesPost.set(r.species, (speciesPost.get(r.species) || 0) + r.birds); });
    }

    const speciesImpact: { sp: string; pre: number; post: number; change: number }[] = [];
    new Set([...speciesPre.keys(), ...speciesPost.keys()]).forEach(sp => {
        const pre = (speciesPre.get(sp) || 0) / Math.max(preSpillYears.length, 1);
        const post = speciesPost.get(sp) || 0;
        if (pre > 50 || post > 50) {
            speciesImpact.push({ sp, pre: Math.round(pre), post: Math.round(post), change: pre > 0 ? Math.round((post / pre - 1) * 100) : 100 });
        }
    });
    speciesImpact.sort((a, b) => a.change - b.change);

    let postPct = '';
    if (preAvgBirds > 0) {
        const drop = Math.round((1 - postAvgBirds / preAvgBirds) * 100);
        postPct = ` **(${drop > 0 ? '-' : '+'}${Math.abs(drop)}%)**`;
    }
    let latestPct = '';
    if (preAvgBirds > 0 && latestData) {
        const pct = Math.round((latestData.totalBirds / preAvgBirds - 1) * 100);
        latestPct = ` **(${pct >= 0 ? '+' : ''}${pct}% vs pre-spill)**`;
    }

    let r = `## Deepwater Horizon Impact Assessment\n`;
    r += `*BP oil spill: April 20, 2010* · **$501M** NRDA bird settlement · Dataset: ${years[0]}–${latestYr} (${years.length} survey years)\n\n---\n\n`;
    r += `### Population Impact\n\n| Period | Birds/yr | Change |\n|---|---|---|\n`;
    r += `| Pre-spill (${preSpillYears[0] || "?"}–2010) | **${Math.round(preAvgBirds).toLocaleString()}** | *baseline* |\n`;
    r += `| Post-spill (2011–2014) | **${Math.round(postAvgBirds).toLocaleString()}** |${postPct} |\n`;
    r += `| Latest (${latestYr}) | **${latestData ? Math.round(latestData.totalBirds).toLocaleString() : "N/A"}** |${latestPct} |\n\n`;
    r += `### Colony Recovery Status\n\n- **${fullyRecovered.length}** fully recovered\n- **${neverRecovered.length}** still impacted\n- **${newSinceSpill.length}** new since spill\n\n`;

    if (neverRecovered.length > 0) {
        r += `### Most Impacted *(never recovered)*\n\n`;
        neverRecovered.slice(0, 5).forEach((c, i) => { r += `${i + 1}. **${c.name}** — ${c.prePeak.toLocaleString()} → ${c.current.toLocaleString()} (**-${c.dropPct}%**)\n`; });
        r += `\n`;
    }
    if (fullyRecovered.length > 0) {
        r += `### Top Recovery Stories\n\n`;
        fullyRecovered.slice(0, 5).forEach((c, i) => { r += `${i + 1}. **${c.name}** — ${c.preAvg.toLocaleString()} → ${c.current.toLocaleString()} (**+${c.growthPct}%**)\n`; });
        r += `\n`;
    }
    if (speciesImpact.length > 0) {
        const hardest = speciesImpact.filter(s => s.change < 0).slice(0, 3);
        const best = speciesImpact.filter(s => s.change > 0).sort((a, b) => b.change - a.change).slice(0, 3);
        if (hardest.length > 0 || best.length > 0) {
            r += `### Species Impact\n\n| Species | Pre-spill/yr | Latest | Change |\n|---|---|---|---|\n`;
            hardest.forEach(s => { r += `| ${s.sp} | ${s.pre.toLocaleString()} | ${s.post.toLocaleString()} | **${s.change}%** |\n`; });
            best.forEach(s => { r += `| ${s.sp} | ${s.pre.toLocaleString()} | ${s.post.toLocaleString()} | **+${s.change}%** |\n`; });
            r += `\n`;
        }
    }
    r += `---\n\n> This analysis powers the **$501M NRDA** restoration monitoring funded by the BP settlement.`;
    return r;
}

function computePriorityResponse(data: Map<number, YearData>, years: number[]): string {
    const latestYr = years[years.length - 1];
    const latestData = data.get(latestYr);
    if (!latestData) return "No data available for priority analysis.";

    const allNames = new Set<string>();
    data.forEach(yd => yd.colonies.forEach((_, n) => allNames.add(n)));

    const scored: {
        name: string; region: string; score: number; birds: number; trend: string; trendPct: number;
        speciesCount: number; reasons: string[];
    }[] = [];

    allNames.forEach(name => {
        const history = getColonyHistory(data, name, years).filter(h => h.birds > 0);
        if (history.length < 2) return;

        const current = history[history.length - 1];
        const peak = Math.max(...history.map(h => h.birds));
        const peakYear = history.find(h => h.birds === peak)?.year ?? 0;
        const trend = computeTrend(history.map(h => h.birds));
        const col = latestData.colonies.get(name);
        const region = col?.region || "Unknown";
        const speciesCount = col?.species.size ?? 0;

        let score = 0;
        const reasons: string[] = [];

        if (trend.direction === "down") { score += Math.min(30, trend.pct * 0.5); reasons.push(`Declining ${trend.pct}%`); }
        if (peak > 0 && current.birds < peak * 0.6) { const d = Math.round((1 - current.birds / peak) * 100); score += Math.min(25, d * 0.4); reasons.push(`${d}% below peak (${peakYear})`); }
        if (history.length >= 2) { const prev = history[history.length - 2].birds; if (prev > 0 && current.birds < prev * 0.6) { const d = Math.round((1 - current.birds / prev) * 100); score += Math.min(20, d * 0.5); reasons.push(`${d}% drop in latest survey`); } }

        const historicalSpecies = new Set<string>();
        years.forEach(yr => { data.get(yr)?.colonies.get(name)?.species.forEach(s => historicalSpecies.add(s)); });
        if (historicalSpecies.size > speciesCount && speciesCount > 0) { const lost = historicalSpecies.size - speciesCount; score += Math.min(15, lost * 5); reasons.push(`Lost ${lost} species (${historicalSpecies.size} → ${speciesCount})`); }
        if (peak > 1000) { score += 10; reasons.push(`Major colony (peak: ${Math.round(peak).toLocaleString()})`); } else if (peak > 500) { score += 5; }

        if (score > 5 && current.birds > 0) {
            scored.push({ name, region, score: Math.round(score), birds: Math.round(current.birds), trend: trend.direction, trendPct: trend.pct, speciesCount, reasons });
        }
    });

    scored.sort((a, b) => b.score - a.score);

    const totalAtRisk = scored.filter(s => s.score >= 20).length;
    const criticalCount = scored.filter(s => s.score >= 40).length;
    const totalBirdsAtRisk = scored.filter(s => s.score >= 20).reduce((sum, s) => sum + s.birds, 0);
    const highCount = scored.filter(s => s.score >= 20 && s.score < 40).length;
    const moderateCount = scored.filter(s => s.score >= 10 && s.score < 20).length;

    let r = `## Conservation Priority Assessment\n*Multi-factor risk scoring across ${allNames.size} colonies*\n\n---\n\n`;
    r += `### Risk Summary\n\n| Priority | Colonies |\n|---|---|\n| Critical | **${criticalCount}** |\n| High | **${highCount}** |\n| Moderate | **${moderateCount}** |\n| **Birds at risk** | **${totalBirdsAtRisk.toLocaleString()}** |\n\n`;
    r += `### Top 10 Priority Colonies\n*Scored by: decline trajectory + peak distance + recent drop + diversity loss*\n\n`;

    scored.slice(0, 10).forEach((c, i) => {
        const trendArrow = c.trend === "down" ? "↓" : c.trend === "up" ? "↑" : "→";
        const badge = c.score >= 40 ? "🔴" : c.score >= 20 ? "🟠" : "🟡";
        r += `${i + 1}. ${badge} **${c.name}** — Score: **${c.score}**\n   ${c.birds.toLocaleString()} birds · ${c.speciesCount} spp · ${trendArrow} ${c.trendPct}% · *${c.region}*\n   ${c.reasons.map(s => `\`${s}\``).join(' · ')}\n\n`;
    });

    r += `---\n\n### Funding Recommendation\n\n`;
    if (criticalCount > 0) {
        const topCritical = scored.slice(0, criticalCount).map(s => s.name);
        r += `- **Immediate action:** ${topCritical.slice(0, 3).map(n => `*${n}*`).join(", ")}${criticalCount > 3 ? ` +${criticalCount - 3} more` : ""}\n`;
    }
    r += `- **${totalAtRisk}** colonies qualify for NRDA restoration funding\n`;
    r += `- Monitoring coverage: **${Math.round(totalBirdsAtRisk / (latestData.totalBirds || 1) * 100)}%** of current population`;

    return r;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MapViewLayout({ header }: MapViewLayoutProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Map<number, YearData>>(new Map());
    const [years, setYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState<number>(2024);
    const [activeColony, setActiveColony] = useState<ColonyData | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState<string>("All");
    const [selectedSpecies, setSelectedSpecies] = useState<string>("All");

    // Chat state
    const [chatOpen, setChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [messages, setMessages] = useState<ChatMsg[]>([
        { id: "1", role: "bot", text: "### Specto Data Analyst\n\nI analyze your colony data in real-time. Try:\n\n- **Deepwater Horizon impact** — full spill assessment\n- **conservation priority** — funding recommendations\n- **analyze 2018** — year breakdown\n- **compare 2015 vs 2020** — side by side\n- **declining** — at-risk colonies\n- **top species** — dominance analysis\n- **health report** — ecosystem overview\n\n*Or click any colony on the map for auto-analysis.*" }
    ]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Trend modal
    const [trendModalOpen, setTrendModalOpen] = useState(false);
    const [trendSpecies, setTrendSpecies] = useState("TOTAL");

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
                        yrD.colonies.set(name, { name, region: row[idx.reg] || "Coast", lat: parseFloat(row[idx.lat]) || 0, lng: parseFloat(row[idx.lng]) || 0, birds: 0, nests: 0, species: new Set(), rows: [] });
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
        setDetailOpen(true);
        const history = getColonyHistory(data, activeColony.name, years);
        const birdTrend = computeTrend(history.map(h => h.birds));
        const anomalies = findAnomalies(history);
        const speciesTrends = getSpeciesTrends(data, activeColony.name, years);
        const topGrowing = speciesTrends.filter(s => s.trend.direction === "up").slice(0, 3);
        const topDeclining = speciesTrends.filter(s => s.trend.direction === "down").slice(0, 3);
        const trendIcon = birdTrend.direction === "up" ? "↑" : birdTrend.direction === "down" ? "↓" : "→";

        let analysis = `### ${activeColony.name}\n\n`;
        analysis += `- **Trend:** ${trendIcon} **${birdTrend.direction === "up" ? "+" : birdTrend.direction === "down" ? "-" : ""}${birdTrend.pct}%** (${birdTrend.direction})\n`;
        analysis += `- **Species:** ${activeColony.species.size} taxa\n`;
        analysis += `- **Population:** **${Math.round(activeColony.birds).toLocaleString()}** birds\n\n`;
        if (topGrowing.length > 0) { analysis += `**Growing species:**\n${topGrowing.map(s => `- ${s.species} **+${s.trend.pct}%**`).join('\n')}\n\n`; }
        if (topDeclining.length > 0) { analysis += `**Declining species:**\n${topDeclining.map(s => `- ${s.species} **-${s.trend.pct}%**`).join('\n')}\n\n`; }
        if (anomalies.length > 0) { analysis += `**Alerts:**\n${anomalies.map(a => `- ${a}`).join('\n')}`; }

        setMessages(m => [...m, { id: Date.now().toString(), role: "bot", text: analysis }]);
    }, [activeColony?.name]);

    // --- Streaming text reveal ---
    const streamText = useCallback((fullText: string, msgId: string) => {
        let charIdx = 0;
        const tick = () => {
            charIdx = Math.min(charIdx + 3, fullText.length);
            setMessages(m => m.map(msg => msg.id === msgId ? { ...msg, text: fullText.slice(0, charIdx) } : msg));
            if (charIdx < fullText.length) setTimeout(tick, 12);
        };
        tick();
    }, []);

    const runAgenticSteps = useCallback((steps: { label: string; durationMs: number }[], computeResult: () => string) => {
        let i = 0;
        const stepId = () => `step-${Date.now()}-${i}`;
        const runNext = () => {
            if (i >= steps.length) {
                const result = computeResult();
                const botId = `bot-${Date.now()}`;
                setMessages(m => {
                    const cleaned = m.filter(msg => msg.role !== "step-active" && msg.role !== "step-done");
                    return [...cleaned, { id: botId, role: "bot" as const, text: "" }];
                });
                setTimeout(() => streamText(result, botId), 100);
                return;
            }
            const step = steps[i];
            const currentId = stepId();
            setMessages(m => {
                const updated = m.map(msg => msg.role === "step-active" ? { ...msg, role: "step-done" as const } : msg);
                return [...updated, { id: currentId, role: "step-active" as const, text: step.label }];
            });
            i++;
            setTimeout(runNext, step.durationMs);
        };
        setTimeout(() => { setMessages(m => m.filter(msg => msg.role !== "thinking")); runNext(); }, 400);
    }, [streamText]);

    // --- AI Analysis Engine ---
    const handleCommand = useCallback((input: string) => {
        const text = input.toLowerCase();
        setMessages(m => [...m, { id: Date.now().toString(), role: "user", text: input }]);
        setChatInput("");

        const isDWH = text.includes("deepwater") || text.includes("spill") || text.includes("oil") || text.includes("bp") || text.includes("dwh") || text.includes("horizon");
        const isPriority = text.includes("priorit") || text.includes("funding") || text.includes("conservation") || text.includes("protect") || text.includes("invest") || text.includes("which colonies");
        setMessages(m => [...m, { id: (Date.now() + 1).toString(), role: "thinking", text: isDWH ? "Initializing impact assessment agent..." : isPriority ? "Initializing conservation priority agent..." : "Analyzing datasets..." }]);

        if (isDWH) {
            const totalRows = Array.from(data.values()).reduce((sum, yd) => sum + yd.rows.length, 0);
            runAgenticSteps([
                { label: `Scanning ${totalRows.toLocaleString()} records across ${years.length} survey years...`, durationMs: 800 },
                { label: `Establishing pre-spill baseline (${years.filter(y => y <= 2010).join(", ") || "N/A"})...`, durationMs: 700 },
                { label: "Comparing post-spill population trajectories (2011–2014)...", durationMs: 600 },
                { label: `Analyzing ${new Set(Array.from(data.values()).flatMap(yd => Array.from(yd.colonies.keys()))).size} colonies for recovery patterns...`, durationMs: 900 },
                { label: "Cross-referencing species-level impact data...", durationMs: 600 },
                { label: "Computing colony recovery classifications...", durationMs: 500 },
                { label: "Generating Deepwater Horizon impact assessment...", durationMs: 400 },
            ], () => computeDWHResponse(data, years));
            return;
        }

        if (isPriority) {
            const totalColonies = new Set(Array.from(data.values()).flatMap(yd => Array.from(yd.colonies.keys()))).size;
            runAgenticSteps([
                { label: `Loading population data for ${totalColonies} colonies...`, durationMs: 700 },
                { label: "Computing multi-year decline trajectories...", durationMs: 600 },
                { label: "Measuring distance from historical peak populations...", durationMs: 700 },
                { label: "Detecting recent sharp population drops...", durationMs: 500 },
                { label: "Analyzing species diversity loss per colony...", durationMs: 600 },
                { label: "Scoring colonies by composite risk factor...", durationMs: 500 },
                { label: "Ranking conservation priorities and funding eligibility...", durationMs: 400 },
                { label: "Generating priority assessment report...", durationMs: 300 },
            ], () => computePriorityResponse(data, years));
            return;
        }

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

                    response = `## Year Analysis: ${yr}\n\n- **Population:** **${Math.round(yrData.totalBirds).toLocaleString()}** birds`;
                    if (yoyChange) response += ` (${parseFloat(yoyChange) > 0 ? '+' : ''}${yoyChange}% YoY)`;
                    response += `\n- **Nesting:** **${Math.round(yrData.totalNests).toLocaleString()}** nests\n- **Active colonies:** ${yrData.colonies.size}\n- **Species observed:** ${Object.keys(speciesCounts).length}\n\n`;
                    response += `### Top 5 Colonies\n\n`;
                    colonies.slice(0, 5).forEach((c, i) => { response += `${i + 1}. **${c.name}** — ${Math.round(c.birds).toLocaleString()} birds (${c.species.size} spp)\n`; });
                    response += `\n### Dominant Species\n\n| Species | Count | Share |\n|---|---|---|\n`;
                    sortedSpecies.slice(0, 5).forEach(([sp, count]) => {
                        response += `| ${sp} | **${Math.round(count).toLocaleString()}** | ${((count / yrData.totalBirds) * 100).toFixed(1)}% |\n`;
                    });
                } else { response = `Year ${yr} not in dataset. Range: ${years[0]}-${years[years.length - 1]}`; }
            } else if (text.includes("compare")) {
                const yrs = text.match(/\b(20\d{2})\b/g);
                if (yrs && yrs.length >= 2) {
                    const y1 = parseInt(yrs[0]), y2 = parseInt(yrs[1]);
                    const d1 = data.get(y1), d2 = data.get(y2);
                    if (d1 && d2) {
                        const pct = ((d2.totalBirds - d1.totalBirds) / d1.totalBirds * 100).toFixed(1);
                        response = `## Comparison: ${y1} vs ${y2}\n\n| Metric | ${y1} | ${y2} | Change |\n|---|---|---|---|\n`;
                        response += `| Birds | ${Math.round(d1.totalBirds).toLocaleString()} | ${Math.round(d2.totalBirds).toLocaleString()} | **${parseFloat(pct) > 0 ? '+' : ''}${pct}%** |\n`;
                        response += `| Nests | ${Math.round(d1.totalNests).toLocaleString()} | ${Math.round(d2.totalNests).toLocaleString()} | |\n`;
                        response += `| Colonies | ${d1.colonies.size} | ${d2.colonies.size} | |\n\n`;
                        const allNames = new Set([...d1.colonies.keys(), ...d2.colonies.keys()]);
                        const changes: { name: string; delta: number; pct: number }[] = [];
                        allNames.forEach(name => { const b1 = d1.colonies.get(name)?.birds ?? 0; const b2 = d2.colonies.get(name)?.birds ?? 0; if (b1 > 50 || b2 > 50) changes.push({ name, delta: b2 - b1, pct: b1 > 0 ? Math.round((b2 / b1 - 1) * 100) : 100 }); });
                        const gainers = changes.filter(c => c.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 3);
                        const losers = changes.filter(c => c.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 3);
                        if (gainers.length) { response += `### Biggest Gains\n\n`; gainers.forEach(g => { response += `- **${g.name}** — +${Math.round(g.delta).toLocaleString()} birds (**+${g.pct}%**)\n`; }); response += `\n`; }
                        if (losers.length) { response += `### Biggest Losses\n\n`; losers.forEach(l => { response += `- **${l.name}** — ${Math.round(l.delta).toLocaleString()} birds (**${l.pct}%**)\n`; }); }
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
                    const current = history[history.length - 1]?.birds ?? 0;
                    if (peak > 100 && current < peak * 0.5) declining.push({ name, drop: Math.round((1 - current / peak) * 100), peak: Math.round(peak), current: Math.round(current), peakYear });
                });
                declining.sort((a, b) => b.drop - a.drop);
                if (declining.length === 0) { response = "No colonies showing >50% decline from peak."; }
                else {
                    response = `## Colonies of Concern\n\n**${declining.length}** colonies with >50% decline from peak:\n\n`;
                    declining.slice(0, 10).forEach((c, i) => { response += `${i + 1}. **${c.name}** — Peak: ${c.peak.toLocaleString()} (${c.peakYear}) → Now: ${c.current.toLocaleString()} (**-${c.drop}%**)\n`; });
                    if (declining.length > 10) response += `\n*...and ${declining.length - 10} more*`;
                }
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
                    if (low > 0 && current > low * 2 && current > 100) growing.push({ name, growth: Math.round((current / low - 1) * 100), low: Math.round(low), current: Math.round(current), lowYear });
                });
                growing.sort((a, b) => b.growth - a.growth);
                if (growing.length === 0) { response = "No major recovery stories found."; }
                else {
                    response = `## Recovery Success Stories\n\n**${growing.length}** colonies with >100% growth from low:\n\n`;
                    growing.slice(0, 10).forEach((c, i) => { response += `${i + 1}. **${c.name}** — Low: ${c.low.toLocaleString()} (${c.lowYear}) → Now: ${c.current.toLocaleString()} (**+${c.growth}%**)\n`; });
                }
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
                response = `## Species Dominance Analysis\n\n*${sorted.length} species across all years*\n\n| # | Species | Total | Share | Colonies | Trend |\n|---|---|---|---|---|---|\n`;
                sorted.slice(0, 10).forEach(([sp, info], i) => {
                    const trend = computeTrend(info.yearCounts);
                    response += `| ${i + 1} | **${sp}** | ${Math.round(info.total).toLocaleString()} | ${((info.total / grandTotal) * 100).toFixed(1)}% | ${info.colonies.size} | ${trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} ${trend.pct}% |\n`;
                });
            } else if (text.includes("health") || text.includes("report") || text.includes("overview") || text.includes("summary")) {
                const currentYr = data.get(selectedYear);
                const allBirds = Array.from(data.entries()).map(([yr, d]) => ({ yr, birds: d.totalBirds }));
                const overallTrend = computeTrend(allBirds.map(a => a.birds));
                const peak = allBirds.reduce((a, b) => a.birds > b.birds ? a : b);
                const low = allBirds.reduce((a, b) => a.birds < b.birds ? a : b);
                let decliningCount = 0, growingCount = 0, stableCount = 0;
                const allNames = new Set<string>();
                data.forEach(yd => yd.colonies.forEach((_, n) => allNames.add(n)));
                allNames.forEach(name => { const t = computeTrend(getColonyHistory(data, name, years).map(h => h.birds)); if (t.direction === "up") growingCount++; else if (t.direction === "down") decliningCount++; else stableCount++; });
                response = `## Ecosystem Health Report\n\n*${years[0]}–${years[years.length - 1]} (${years.length} years)*\n\n---\n\n`;
                response += `- **Overall trend:** ${overallTrend.direction === "up" ? "↑ Growing" : overallTrend.direction === "down" ? "↓ Declining" : "→ Stable"} (**${overallTrend.pct}%**)\n`;
                response += `- **Peak:** ${Math.round(peak.birds).toLocaleString()} birds (${peak.yr})\n- **Low:** ${Math.round(low.birds).toLocaleString()} birds (${low.yr})\n\n`;
                response += `### Colony Health\n\n| Status | Colonies |\n|---|---|\n| Growing | **${growingCount}** |\n| Stable | **${stableCount}** |\n| Declining | **${decliningCount}** |\n\n`;
                if (currentYr) { response += `### ${selectedYear} Snapshot\n\n**${Math.round(currentYr.totalBirds).toLocaleString()}** birds · **${Math.round(currentYr.totalNests).toLocaleString()}** nests · **${currentYr.colonies.size}** active colonies`; }
            } else {
                response = "### Available Commands\n\n- **Deepwater Horizon impact** — full BP spill assessment\n- **conservation priority** — funding recommendations\n- **analyze [year]** — year breakdown\n- **compare [year] vs [year]** — side by side\n- **declining** — at-risk colonies\n- **recovery** — success stories\n- **top species** — dominance analysis\n- **health report** — ecosystem overview\n\n*Or click a colony on the map for auto-analysis.*";
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

    // Compute available regions and species
    const allRegions = useMemo(() => {
        const regions = new Set<string>();
        data.forEach(yd => yd.colonies.forEach(c => { if (c.region) regions.add(c.region); }));
        return ["All", ...Array.from(regions).sort()];
    }, [data]);

    const allSpecies = useMemo(() => {
        const species = new Set<string>();
        data.forEach(yd => yd.rows.forEach(r => { if (r.species) species.add(r.species); }));
        return ["All", ...Array.from(species).sort()];
    }, [data]);

    const filteredColonies = useMemo(() => {
        const yr = data.get(selectedYear);
        if (!yr) return [];
        let colonies = Array.from(yr.colonies.values());
        if (selectedRegion !== "All") colonies = colonies.filter(c => c.region === selectedRegion);
        if (selectedSpecies !== "All") colonies = colonies.filter(c => c.species.has(selectedSpecies));
        return colonies.sort((a, b) => b.birds - a.birds);
    }, [data, selectedYear, selectedRegion, selectedSpecies]);

    const mapColonies = useMemo((): ColonyStats[] => {
        return filteredColonies.filter(c => c.lat && c.lng).map(c => ({
            colonyName: c.name, colonyId: "", latitude: c.lat, longitude: c.lng,
            totalBirds: Math.round(c.birds), totalNests: Math.round(c.nests),
            uniqueSpecies: c.species.size, observations: c.rows.length, geoRegion: c.region,
        }));
    }, [filteredColonies]);

    // Summary stats
    const totalColonies = useMemo(() => {
        const names = new Set<string>();
        data.forEach(yd => yd.colonies.forEach((_, n) => names.add(n)));
        return names.size;
    }, [data]);
    const totalSpecies = useMemo(() => {
        const sp = new Set<string>();
        data.forEach(yd => yd.rows.forEach(r => sp.add(r.species)));
        return sp.size;
    }, [data]);
    const totalBirds = useMemo(() => {
        const yr = data.get(selectedYear);
        return yr ? Math.round(yr.totalBirds) : 0;
    }, [data, selectedYear]);

    const animColonies = useCountUp(totalColonies, 1500, !loading);
    const animSpecies = useCountUp(totalSpecies, 1500, !loading);
    const animYears = useCountUp(years.length, 1200, !loading);
    const animBirds = useCountUp(totalBirds, 1500, !loading);

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

    // Compute colony trends for status coloring
    const colonyTrends = useMemo(() => {
        const trends = new Map<string, "growing" | "stable" | "declining" | "unknown">();
        const allNames = new Set<string>();
        data.forEach(yd => yd.colonies.forEach((_, n) => allNames.add(n)));
        allNames.forEach(name => {
            const hist = getColonyHistory(data, name, years).map(h => h.birds);
            const nonZero = hist.filter(v => v > 0);
            if (nonZero.length < 2) { trends.set(name, "unknown"); return; }
            const t = computeTrend(hist);
            trends.set(name, t.direction === "up" ? "growing" : t.direction === "down" ? "declining" : "stable");
        });
        return trends;
    }, [data, years]);

    // Count by status
    const statusCounts = useMemo(() => {
        let growing = 0, stable = 0, declining = 0;
        colonyTrends.forEach(t => { if (t === "growing") growing++; else if (t === "declining") declining++; else if (t === "stable") stable++; });
        return { growing, stable, declining };
    }, [colonyTrends]);

    // ========================================================================
    // RENDER — BRIGHT, READABLE, USER-FRIENDLY
    // ========================================================================
    return (
        <div className="h-screen w-full flex flex-col bg-[#f5f7fa] text-gray-900 overflow-hidden">
            <style>{`
                .map-card { background: white; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
                @keyframes fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slide-in-right { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                .animate-fade-up { animation: fade-up 0.5s ease-out both; }
                .animate-slide-right { animation: slide-in-right 0.35s ease-out both; }
                .detail-enter { animation: slide-in-right 0.3s ease-out both; }
                .colony-tooltip { background: white !important; color: #1f2937 !important; border: 1px solid #e5e7eb !important; border-radius: 10px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; }
            `}</style>

            {header}

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50">
                    <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
                    <p className="text-sm font-semibold text-gray-500">Loading colony data...</p>
                </div>
            ) : (
                <div className="flex-1 relative overflow-hidden">

                    {/* ====== FULL-BLEED MAP ====== */}
                    <div className="absolute inset-0 z-0">
                        <ColonyMap
                            colonies={mapColonies}
                            colonyTrends={colonyTrends}
                            colorMode="status"
                            onColonyClick={(colony) => {
                                const match = filteredColonies.find(c => c.name === colony.colonyName);
                                if (match) setActiveColony(match);
                            }}
                            selectedColony={activeColony?.name}
                            className="h-full w-full"
                            interactive
                        />
                    </div>

                    {/* ====== STAT CARDS (top center) — white, big numbers ====== */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] animate-fade-up">
                        <div className="flex items-center gap-3">
                            {[
                                { label: "Colonies", value: animColonies.toLocaleString(), icon: MapPin, color: "bg-blue-50 text-blue-600" },
                                { label: "Species", value: animSpecies.toLocaleString(), icon: Bird, color: "bg-green-50 text-green-600" },
                                { label: "Years of Data", value: animYears.toLocaleString(), icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
                                { label: "Birds Counted", value: animBirds.toLocaleString(), icon: Eye, color: "bg-amber-50 text-amber-600" },
                            ].map(({ label, value, icon: Icon, color }) => (
                                <div key={label} className="map-card rounded-xl px-5 py-3 flex items-center gap-3 min-w-[150px]">
                                    <div className={`h-10 w-10 rounded-lg ${color} flex items-center justify-center`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold leading-none text-gray-900">{value}</div>
                                        <div className="text-xs font-medium text-gray-500 mt-0.5">{label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ====== FILTER BAR (top left) — bright, readable ====== */}
                    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 animate-fade-up" style={{ animationDelay: "0.1s" }}>
                        <button
                            onClick={() => setFilterOpen(!filterOpen)}
                            className={`map-card rounded-xl px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors ${filterOpen ? 'ring-2 ring-blue-500' : ''}`}
                        >
                            <Filter className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-gray-700">Filters</span>
                            {(selectedRegion !== "All" || selectedSpecies !== "All") && (
                                <span className="h-5 w-5 rounded-full bg-blue-600 text-[10px] font-bold flex items-center justify-center text-white">
                                    {(selectedRegion !== "All" ? 1 : 0) + (selectedSpecies !== "All" ? 1 : 0)}
                                </span>
                            )}
                        </button>

                        {filterOpen && (
                            <div className="map-card rounded-xl p-4 flex flex-col gap-3 animate-slide-right min-w-[280px]">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 block mb-1.5">Region</label>
                                    <select
                                        value={selectedRegion}
                                        onChange={e => setSelectedRegion(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {allRegions.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 block mb-1.5">Species</label>
                                    <select
                                        value={selectedSpecies}
                                        onChange={e => setSelectedSpecies(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {allSpecies.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                {(selectedRegion !== "All" || selectedSpecies !== "All") && (
                                    <button
                                        onClick={() => { setSelectedRegion("All"); setSelectedSpecies("All"); }}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium self-start"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ====== MAP LEGEND (bottom left) — clear, meaningful ====== */}
                    <div className="absolute bottom-20 left-4 z-[1000] animate-fade-up" style={{ animationDelay: "0.2s" }}>
                        <div className="map-card rounded-xl p-4 min-w-[180px]">
                            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3">Colony Status</h4>
                            <div className="space-y-2.5">
                                {[
                                    { label: `Growing (${statusCounts.growing})`, color: "#16A34A" },
                                    { label: `Stable (${statusCounts.stable})`, color: "#2563EB" },
                                    { label: `Declining (${statusCounts.declining})`, color: "#DC2626" },
                                    { label: "No Data", color: "#9CA3AF" },
                                ].map(({ label, color }) => (
                                    <div key={label} className="flex items-center gap-2.5">
                                        <div className="h-4 w-4 rounded-full border-2 border-white" style={{ background: color, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                                        <span className="text-sm text-gray-700">{label}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-100 mt-3 pt-3">
                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">Population Size</h4>
                                <div className="flex items-end gap-3">
                                    {[
                                        { size: 7, label: "<100" },
                                        { size: 12, label: "500" },
                                        { size: 20, label: "2K" },
                                        { size: 28, label: "10K+" },
                                    ].map(({ size, label }) => (
                                        <div key={label} className="flex flex-col items-center gap-1">
                                            <div className="rounded-full bg-gray-400 border-2 border-white" style={{ width: size, height: size, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                                            <span className="text-[10px] text-gray-500">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ====== COLONY DETAIL PANEL (right slide-in) — white, readable ====== */}
                    {detailOpen && activeColony && colonyAnalysis && (
                        <div className="absolute top-0 right-0 bottom-16 w-[400px] z-[10000] detail-enter">
                            <div className="h-full bg-white border-l border-gray-200 shadow-xl flex flex-col overflow-hidden">
                                {/* Header */}
                                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-5 w-5 text-blue-600 shrink-0" />
                                                <h2 className="text-xl font-bold text-gray-900 truncate">{activeColony.name}</h2>
                                            </div>
                                            <span className="inline-block mt-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">{activeColony.region}</span>
                                        </div>
                                        <button
                                            onClick={() => { setDetailOpen(false); setActiveColony(null); }}
                                            className="h-8 w-8 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors shrink-0"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Key metrics */}
                                <div className="px-6 py-5 grid grid-cols-3 gap-4 border-b border-gray-100">
                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 mb-1">Birds</div>
                                        <div className="text-2xl font-bold text-gray-900 leading-none">{Math.round(activeColony.birds).toLocaleString()}</div>
                                        <div className="mt-1"><TrendBadge trend={colonyAnalysis.birdTrend} size="sm" /></div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 mb-1">Nests</div>
                                        <div className="text-2xl font-bold text-gray-900 leading-none">{Math.round(activeColony.nests).toLocaleString()}</div>
                                        <div className="mt-1"><TrendBadge trend={colonyAnalysis.nestTrend} size="sm" /></div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 mb-1">Species</div>
                                        <div className="text-2xl font-bold text-gray-900 leading-none">{activeColony.species.size}</div>
                                        <div className="text-xs text-gray-400 mt-1">taxa</div>
                                    </div>
                                </div>

                                {/* Population trend chart */}
                                <div className="px-6 py-4 border-b border-gray-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">Population Trend</span>
                                        <button
                                            onClick={() => { setTrendSpecies("TOTAL"); setTrendModalOpen(true); }}
                                            className="text-xs text-blue-600 hover:underline font-semibold"
                                        >
                                            Full chart
                                        </button>
                                    </div>
                                    <div className="h-16 bg-gray-50 rounded-lg p-2">
                                        <Sparkline
                                            data={colonyAnalysis.history.map(h => h.birds)}
                                            width={340}
                                            height={48}
                                            color={colonyAnalysis.birdTrend.direction === "down" ? "#DC2626" : colonyAnalysis.birdTrend.direction === "up" ? "#16A34A" : "#6b7280"}
                                            animate={true}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[11px] text-gray-400 mt-1 px-2">
                                        <span>{years[0]}</span>
                                        <span>{years[years.length - 1]}</span>
                                    </div>
                                </div>

                                {/* Alerts */}
                                {colonyAnalysis.anomalies.length > 0 && (
                                    <div className="px-6 py-3 border-b border-gray-100 bg-amber-50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                                            <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Alerts</span>
                                        </div>
                                        {colonyAnalysis.anomalies.slice(0, 3).map((a, i) => (
                                            <p key={i} className="text-sm text-amber-700 mb-0.5">{a}</p>
                                        ))}
                                    </div>
                                )}

                                {/* Species list */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <div className="px-6 py-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Eye className="h-4 w-4 text-gray-500" />
                                            <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">Species Breakdown</span>
                                        </div>
                                        <div className="space-y-1">
                                            {colonyAnalysis.speciesTrends.slice(0, 10).map((sp) => (
                                                <div key={sp.species} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <span className="text-sm font-bold text-blue-700 uppercase w-14 shrink-0">{sp.species}</span>
                                                    <Sparkline data={sp.sparkline} width={70} height={18} color={sp.trend.direction === "down" ? "#DC2626" : sp.trend.direction === "up" ? "#16A34A" : "#6b7280"} />
                                                    <span className="text-sm font-semibold text-gray-900 text-right flex-1">{Math.round(sp.lastVal).toLocaleString()}</span>
                                                    <TrendBadge trend={sp.trend} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ====== AI CHAT FAB + PANEL ====== */}
                    {!chatOpen && (
                        <button
                            onClick={() => setChatOpen(true)}
                            className="absolute bottom-20 right-4 z-[1000] h-14 px-5 rounded-full bg-blue-600 shadow-lg shadow-blue-600/30 flex items-center gap-2 hover:bg-blue-700 hover:scale-105 transition-all animate-fade-up"
                            style={{ animationDelay: "0.3s" }}
                        >
                            <Bot className="h-5 w-5 text-white" />
                            <span className="text-sm font-semibold text-white">Ask AI</span>
                        </button>
                    )}

                    {chatOpen && (
                        <div className="absolute bottom-20 right-4 z-[1000] w-[400px] h-[520px] map-card rounded-2xl flex flex-col overflow-hidden animate-slide-right">
                            <div className="px-4 py-3 border-b border-gray-100 bg-blue-50 flex items-center gap-3">
                                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Bot className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-gray-900 leading-none">Data Analyst</h3>
                                    <p className="text-xs font-medium text-green-600 mt-0.5">Online</p>
                                </div>
                                <button onClick={() => setChatOpen(false)} className="h-7 w-7 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 custom-scrollbar bg-gray-50">
                                {messages.map(m => (
                                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {m.role === 'thinking' ? (
                                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                                                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                                <span className="font-medium">{m.text}</span>
                                            </div>
                                        ) : m.role === 'step-active' ? (
                                            <div className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                                                <span>{m.text}</span>
                                            </div>
                                        ) : m.role === 'step-done' ? (
                                            <div className="flex items-center gap-2 px-3 py-0.5 text-sm text-green-600/70">
                                                <span className="shrink-0 text-green-500">✓</span>
                                                <span className="line-through">{m.text}</span>
                                            </div>
                                        ) : m.role === 'user' ? (
                                            <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm bg-blue-600 text-white font-medium">{m.text}</div>
                                        ) : (
                                            <div className="max-w-[98%] w-full">
                                                <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed bg-white border border-gray-200 shadow-sm">
                                                    <MiniMarkdown text={m.text} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            <div className="px-3 py-2.5 border-t border-gray-200 bg-white flex gap-2">
                                <Input
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && chatInput.trim() && handleCommand(chatInput)}
                                    placeholder="Ask about colony data..."
                                    className="h-10 text-sm rounded-xl bg-gray-50 border-gray-200 px-3 text-gray-900 placeholder:text-gray-400"
                                />
                                <Button size="sm" className="h-10 w-10 rounded-xl shrink-0 bg-blue-600 hover:bg-blue-700 p-0" onClick={() => chatInput.trim() && handleCommand(chatInput)}>
                                    <ArrowRight className="h-4 w-4 text-white" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ====== TIMELINE BAR (bottom) — white, clear ====== */}
                    <div className="absolute bottom-0 left-0 right-0 z-[999]">
                        <div className="bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] px-6 py-3 flex items-center gap-5">
                            <div className="flex items-center gap-3 shrink-0">
                                <Button
                                    onClick={() => { setIsPlaying(!isPlaying); if (!isPlaying) { setActiveColony(null); setDetailOpen(false); } }}
                                    size="sm"
                                    className={`h-11 w-11 rounded-xl p-0 ${isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"}`}
                                >
                                    {isPlaying ? <Pause className="h-5 w-5 fill-current text-white" /> : <Play className="h-5 w-5 fill-current ml-0.5 text-white" />}
                                </Button>
                                <div>
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block leading-none">Year</span>
                                    <span className="text-3xl font-bold text-gray-900 leading-none tracking-tight">{selectedYear}</span>
                                </div>
                            </div>

                            <div className="flex-1 flex items-end gap-1 h-12 bg-gray-50 rounded-xl p-2 border border-gray-200">
                                {years.map(y => {
                                    const active = y === selectedYear;
                                    const v = data.get(y)?.totalBirds || 0;
                                    const max = Math.max(...Array.from(data.values()).map(d => d.totalBirds), 1);
                                    return (
                                        <button
                                            key={y}
                                            onClick={() => { setSelectedYear(y); setIsPlaying(false); }}
                                            className={`flex-1 min-w-[8px] rounded transition-all duration-500 ${active ? "bg-blue-600" : "bg-gray-300 hover:bg-gray-400"}`}
                                            style={active ? { height: "100%" } : { height: `${Math.max(15, (v / max) * 100)}%` }}
                                            title={`${y}: ${Math.round(v).toLocaleString()} birds`}
                                        />
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                    <span className="text-lg font-bold text-gray-900">{filteredColonies.length}</span>
                                    <span className="text-sm text-gray-500 ml-1">colonies</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Historical Trend Modal --- */}
            <Dialog open={trendModalOpen} onOpenChange={setTrendModalOpen}>
                <DialogContent className="max-w-3xl bg-white border-gray-200 rounded-xl p-0 overflow-hidden [&>button]:hidden z-[99999]">
                    <div className="flex h-[400px]">
                        <div className="w-44 border-r border-gray-100 bg-gray-50 p-4 flex flex-col shrink-0">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Species</span>
                            <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1">
                                <button onClick={() => setTrendSpecies("TOTAL")} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${trendSpecies === "TOTAL" ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-600"}`}>
                                    All Species
                                </button>
                                {Array.from(activeColony?.species || []).map(s => (
                                    <button key={s} onClick={() => setTrendSpecies(s)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${trendSpecies === s ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 p-6 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{activeColony?.name}</h3>
                                    <p className="text-sm font-semibold text-blue-600 mt-0.5">
                                        {trendSpecies === "TOTAL" ? "All Species" : trendSpecies}
                                    </p>
                                </div>
                                <button onClick={() => setTrendModalOpen(false)} className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex-1 relative">
                                {historicalLine.length > 1 && (() => {
                                    const maxVal = Math.max(...historicalLine.map(x => x.val), 1);
                                    const W = 600, H = 280;
                                    const pad = { top: 20, right: 20, bottom: 8, left: 40 };
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
                                                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.1" />
                                                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            {[0, 0.25, 0.5, 0.75, 1].map(f => {
                                                const y = pad.top + ch - f * ch;
                                                return <line key={f} x1={pad.left} y1={y} x2={pad.left + cw} y2={y} stroke="#e5e7eb" strokeWidth="1" />;
                                            })}
                                            <path d={fillPath} fill="url(#trendFill)" />
                                            <path d={linePath} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                            {pts.map((p, i) => (
                                                <g key={i}>
                                                    <circle cx={p.x} cy={p.y} r="4" fill="#2563EB" fillOpacity="0.15" stroke="none" />
                                                    <circle cx={p.x} cy={p.y} r="2.5" fill="white" stroke="#2563EB" strokeWidth="2" />
                                                    <title>{p.yr}: {Math.round(p.val).toLocaleString()} birds</title>
                                                </g>
                                            ))}
                                            {[0, 0.5, 1].map(f => {
                                                const y = pad.top + ch - f * ch;
                                                const v = Math.round(maxVal * f);
                                                return <text key={f} x={pad.left - 6} y={y + 4} textAnchor="end" fill="#9ca3af" fontSize="11" fontFamily="Inter,system-ui,sans-serif">{v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}</text>;
                                            })}
                                        </svg>
                                    );
                                })()}
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-gray-400 border-t border-gray-100 pt-2">
                                {historicalLine.filter((_, i) => i % Math.max(1, Math.floor(historicalLine.length / 6)) === 0 || i === historicalLine.length - 1).map(t => (
                                    <span key={t.yr}>{t.yr}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
