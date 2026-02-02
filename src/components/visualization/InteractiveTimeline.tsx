import { useState, useEffect, useCallback, useMemo } from "react";
import { Play, Pause, SkipBack, SkipForward, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useData } from "@/hooks/useData";

interface InteractiveTimelineProps {
    onYearChange?: (year: number | null) => void;
    className?: string;
}

export function InteractiveTimeline({ onYearChange, className }: InteractiveTimelineProps) {
    const { availableYears, selectedYear, setSelectedYear } = useData();
    const [isPlaying, setIsPlaying] = useState(false);
    const [playSpeed, setPlaySpeed] = useState(1500); // ms per year

    const minYear = useMemo(() => Math.min(...availableYears), [availableYears]);
    const maxYear = useMemo(() => Math.max(...availableYears), [availableYears]);

    const currentYearIndex = useMemo(
        () => (selectedYear ? availableYears.indexOf(selectedYear) : -1),
        [availableYears, selectedYear]
    );

    const handleYearChange = useCallback(
        (year: number | null) => {
            setSelectedYear(year);
            onYearChange?.(year);
        },
        [setSelectedYear, onYearChange]
    );

    const goToNextYear = useCallback(() => {
        if (currentYearIndex < availableYears.length - 1) {
            handleYearChange(availableYears[currentYearIndex + 1]);
        } else {
            handleYearChange(availableYears[0]);
        }
    }, [availableYears, currentYearIndex, handleYearChange]);

    const goToPrevYear = useCallback(() => {
        if (currentYearIndex > 0) {
            handleYearChange(availableYears[currentYearIndex - 1]);
        } else {
            handleYearChange(availableYears[availableYears.length - 1]);
        }
    }, [availableYears, currentYearIndex, handleYearChange]);

    // Auto-play functionality
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            goToNextYear();
        }, playSpeed);

        return () => clearInterval(interval);
    }, [isPlaying, playSpeed, goToNextYear]);

    const progress = useMemo(() => {
        if (!selectedYear || availableYears.length < 2) return 0;
        return ((selectedYear - minYear) / (maxYear - minYear)) * 100;
    }, [selectedYear, minYear, maxYear, availableYears.length]);

    if (availableYears.length === 0) {
        return (
            <div className={cn("glass-card p-6", className)}>
                <p className="text-muted-foreground">Loading timeline data...</p>
            </div>
        );
    }

    return (
        <div className={cn("glass-card p-6", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                        <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-display font-semibold">Historical Timeline</h3>
                        <p className="text-sm text-muted-foreground">
                            {availableYears.length} years of survey data ({minYear} - {maxYear})
                        </p>
                    </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToPrevYear}
                        className="h-8 w-8"
                    >
                        <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="hero"
                        size="icon"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="h-9 w-9"
                    >
                        {isPlaying ? (
                            <Pause className="h-4 w-4" />
                        ) : (
                            <Play className="h-4 w-4 ml-0.5" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToNextYear}
                        className="h-8 w-8"
                    >
                        <SkipForward className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Current Year Display */}
            <div className="text-center mb-6">
                <div className="relative inline-block">
                    <span className="font-display text-6xl font-bold text-gradient-gold">
                        {selectedYear || "All"}
                    </span>
                    {isPlaying && (
                        <span className="absolute -right-3 -top-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                    )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                    {selectedYear ? `Viewing data for ${selectedYear}` : "Viewing all years"}
                </p>
            </div>

            {/* Progress Bar */}
            <div className="relative mb-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Interactive Slider */}
                <input
                    type="range"
                    min={minYear}
                    max={maxYear}
                    value={selectedYear || minYear}
                    onChange={(e) => {
                        const year = parseInt(e.target.value);
                        // Snap to nearest available year
                        const closest = availableYears.reduce((prev, curr) =>
                            Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
                        );
                        handleYearChange(closest);
                    }}
                    className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                />
            </div>

            {/* Year Markers */}
            <div className="flex justify-between text-xs text-muted-foreground mb-4">
                <span>{minYear}</span>
                <span>{Math.round((minYear + maxYear) / 2)}</span>
                <span>{maxYear}</span>
            </div>

            {/* Quick Year Selection */}
            <div className="flex flex-wrap gap-2 justify-center">
                <Button
                    variant={selectedYear === null ? "hero" : "outline"}
                    size="sm"
                    onClick={() => handleYearChange(null)}
                    className="text-xs"
                >
                    All Years
                </Button>
                {availableYears
                    .filter((_, i, arr) => i === 0 || i === arr.length - 1 || i % Math.ceil(arr.length / 5) === 0)
                    .map((year) => (
                        <Button
                            key={year}
                            variant={selectedYear === year ? "hero" : "outline"}
                            size="sm"
                            onClick={() => handleYearChange(year)}
                            className="text-xs"
                        >
                            {year}
                        </Button>
                    ))}
            </div>

            {/* Speed Control */}
            <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Playback Speed</span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPlaySpeed(Math.min(3000, playSpeed + 500))}
                            className="h-7 w-7 p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">
                            {playSpeed < 1000 ? "Fast" : playSpeed > 2000 ? "Slow" : "Normal"}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPlaySpeed(Math.max(500, playSpeed - 500))}
                            className="h-7 w-7 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
