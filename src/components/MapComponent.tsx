import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

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

interface MapComponentProps {
    center: [number, number];
    zoom: number;
    tileUrl: string;
    colonies: ColonyData[];
    selectedColony: ColonyData | null;
    onColonySelect: (colony: ColonyData) => void;
    getMarkerRadius: (birds: number) => number;
    getColor: (colony: ColonyData) => string;
    speciesColors: Record<string, string>;
}

function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom, { animate: true });
    }, [center, zoom, map]);
    return null;
}

export default function MapComponent({
    center,
    zoom,
    tileUrl,
    colonies,
    selectedColony,
    onColonySelect,
    getMarkerRadius,
    getColor,
    speciesColors,
}: MapComponentProps) {
    return (
        <MapContainer
            center={center}
            zoom={zoom}
            className="h-full w-full"
            zoomControl={true}
            style={{ background: "#0f172a", height: "100%", width: "100%" }}
        >
            <MapViewController center={center} zoom={zoom} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url={tileUrl}
            />

            {colonies.map((colony) => (
                <CircleMarker
                    key={colony.colonyName}
                    center={[colony.latitude, colony.longitude]}
                    radius={getMarkerRadius(colony.birds)}
                    pathOptions={{
                        color: selectedColony?.colonyName === colony.colonyName ? "#fff" : getColor(colony),
                        weight: selectedColony?.colonyName === colony.colonyName ? 3 : 2,
                        fillColor: getColor(colony),
                        fillOpacity: 0.8,
                    }}
                    eventHandlers={{ click: () => onColonySelect(colony) }}
                >
                    <Popup>
                        <div className="p-1 min-w-40">
                            <h3 className="font-bold text-slate-900">{colony.colonyName}</h3>
                            <p className="text-xs text-slate-600">{colony.geoRegion}</p>
                            <div className="flex gap-4 mt-2 text-sm">
                                <div><span className="font-bold text-cyan-600">{Math.round(colony.birds).toLocaleString()}</span> birds</div>
                                <div><span className="font-bold text-emerald-600">{Math.round(colony.nests).toLocaleString()}</span> nests</div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {colony.species.slice(0, 5).map((s) => (
                                    <span key={s} className="text-[9px] px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: speciesColors[s] }}>
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </Popup>
                </CircleMarker>
            ))}
        </MapContainer>
    );
}
