import { AdminHeader } from "@/components/layout/AdminHeader";
import MapViewLayout from "@/components/map/MapViewLayout";

export default function AdminMapView() {
    return <MapViewLayout header={<AdminHeader />} />;
}
