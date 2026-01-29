import { useState, useMemo } from "react";
import { Play, Pause, SkipBack, SkipForward, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimelineSliderProps {
  startYear?: number;
  endYear?: number;
  onYearChange?: (year: number) => void;
}

export function TimelineSlider({
  startYear = 1990,
  endYear = 2024,
  onYearChange,
}: TimelineSliderProps) {
  const [currentYear, setCurrentYear] = useState(endYear);
  const [isPlaying, setIsPlaying] = useState(false);

  const years = useMemo(() => {
    const arr = [];
    for (let y = startYear; y <= endYear; y++) {
      arr.push(y);
    }
    return arr;
  }, [startYear, endYear]);

  const handleYearChange = (year: number) => {
    setCurrentYear(year);
    onYearChange?.(year);
  };

  const progress = ((currentYear - startYear) / (endYear - startYear)) * 100;

  // Significant years with data points
  const significantYears = [1990, 2000, 2005, 2010, 2015, 2020, 2024];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Historical Timeline</h3>
            <p className="text-sm text-muted-foreground">
              Explore {endYear - startYear}+ years of survey data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleYearChange(Math.max(startYear, currentYear - 1))}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="hero"
            size="icon"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleYearChange(Math.min(endYear, currentYear + 1))}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Current Year Display */}
      <div className="text-center mb-4">
        <span className="font-display text-5xl font-bold text-gradient-gold">
          {currentYear}
        </span>
      </div>

      {/* Timeline Track */}
      <div className="relative">
        {/* Background Track */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          {/* Progress Fill */}
          <div
            className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Interactive Slider */}
        <input
          type="range"
          min={startYear}
          max={endYear}
          value={currentYear}
          onChange={(e) => handleYearChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
        />

        {/* Thumb Indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-primary rounded-full border-2 border-background shadow-lg shadow-primary/30 pointer-events-none transition-all duration-300"
          style={{ left: `${progress}%` }}
        />

        {/* Year Markers */}
        <div className="flex justify-between mt-4">
          {significantYears.map((year) => (
            <button
              key={year}
              onClick={() => handleYearChange(year)}
              className={cn(
                "relative text-xs font-medium transition-all",
                currentYear === year
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {year}
              {currentYear === year && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Data Summary for Selected Year */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border/50">
        <div className="text-center">
          <p className="text-2xl font-display font-bold">24</p>
          <p className="text-xs text-muted-foreground">Surveys Conducted</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-display font-bold">156</p>
          <p className="text-xs text-muted-foreground">Colonies Recorded</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-display font-bold">12.4k</p>
          <p className="text-xs text-muted-foreground">Images Captured</p>
        </div>
      </div>
    </div>
  );
}
