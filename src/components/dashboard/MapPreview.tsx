import { useState, useEffect, useMemo } from "react";
import { MapPin, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColonyMap } from "@/components/map/ColonyMap";
import { parseCSV, getColonyStats } from "@/lib/dataService";
import type { ColonyStats } from "@/lib/dataService";
import { Link } from "react-router-dom";

export function MapPreview() {
    const [colonies, setColonies] = useState<ColonyStats[]>([]);
    const [selectedColony, setSelectedColony] = useState<ColonyStats | null>(null);

    // Load colony data independently (this component may not be in DataProvider)
    useEffect(() => {
        fetch("/data.csv")
            .then(res => res.text())
            .then(text => {
                const records = parseCSV(text);
                setColonies(getColonyStats(records));
            })
            .catch(() => {});
    }, []);

    const stats = useMemo(() => ({
        count: colonies.length,
        totalBirds: colonies.reduce((s, c) => s + c.totalBirds, 0),
    }), [colonies]);

    return (
        <div className="glass-card overflow-hidden">
            {/* Map Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div>
                    <h3 className="font-display font-semibold">Louisiana Coastal Colonies</h3>
                    <p className="text-sm text-muted-foreground">
                        {stats.count > 0
                            ? `${stats.count} colonies | ${stats.totalBirds.toLocaleString()} birds`
                            : "Loading colony data..."}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link to="/manager/map">
                        <Button variant="ghost" size="icon">
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Map Area */}
            <div className="relative h-[400px]">
                {colonies.length > 0 ? (
                    <ColonyMap
                        colonies={colonies}
                        onColonyClick={setSelectedColony}
                        selectedColony={selectedColony?.colonyName}
                        className="h-full w-full"
                        interactive={false}
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center bg-secondary/20">
                        <MapPin className="h-8 w-8 text-muted-foreground animate-pulse" />
                    </div>
                )}

                {/* Selected Colony Info Panel */}
                {selectedColony && (
                    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 glass-card p-4 z-[1000] animate-scale-in">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h4 className="font-display font-semibold">{selectedColony.colonyName}</h4>
                                <p className="text-sm text-muted-foreground">{selectedColony.geoRegion}</p>
                            </div>
                            <button
                                onClick={() => setSelectedColony(null)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                x
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <p className="text-xs text-muted-foreground">Birds</p>
                                <p className="font-display font-bold text-lg">{selectedColony.totalBirds.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Nests</p>
                                <p className="font-display font-bold text-lg">{selectedColony.totalNests.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Species</p>
                                <p className="font-display font-bold text-lg">{selectedColony.uniqueSpecies}</p>
                            </div>
                        </div>
                        <Link to="/manager/map">
                            <Button variant="hero" size="sm" className="w-full mt-4">
                                View Details
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
