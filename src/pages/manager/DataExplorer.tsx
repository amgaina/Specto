import { ManagerHeader } from "@/components/layout/ManagerHeader";
import { DataProvider } from "@/context/DataProvider";
import { DataExplorerContent } from "@/components/visualization/DataExplorerContent";

export default function ManagerDataExplorer() {
    return (
        <DataProvider>
            <div className="min-h-screen bg-background">
                <ManagerHeader />
                <DataExplorerContent />
            </div>
        </DataProvider>
    );
}
