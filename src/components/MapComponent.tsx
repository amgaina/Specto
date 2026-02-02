
interface ColonyData {
    colonyName: string;
    latitude: number;
    longitude: number;
    geoRegion: string;
    birds: number;
    nests: number;
    species: string[];
    speciesCounts: Record<string, { birds: number; nests: number }>;
}

type MapComponentProps = object;

// Placeholder component since Leaflet is removed.
// Implement a non-Leaflet map or custom SVG-based map if needed.

export default function MapComponent(_: MapComponentProps) {
    return (
        <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
            Map component disabled: Leaflet removed.
        </div>
    );
}
