import { ManagerHeader } from "@/components/layout/ManagerHeader";
import MapViewLayout from "@/components/map/MapViewLayout";

export default function ManagerMapView() {
    return <MapViewLayout header={<ManagerHeader />} />;
}
