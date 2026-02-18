import { ColonyMap } from "@/components/map/ColonyMap";
import type { ColonyStats } from "@/lib/dataService";

interface MapComponentProps {
    colonies?: ColonyStats[];
    onColonyClick?: (colony: ColonyStats) => void;
    selectedColony?: string | null;
    className?: string;
}

export default function MapComponent({
    colonies = [],
    onColonyClick,
    selectedColony,
    className = "h-full w-full",
}: MapComponentProps) {
    return (
        <ColonyMap
            colonies={colonies}
            onColonyClick={onColonyClick}
            selectedColony={selectedColony}
            className={className}
            interactive
        />
    );
}
