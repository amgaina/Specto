import { useMemo, useState } from "react";
import { Search, X, Download, Eye, MapPin } from "lucide-react";
import { useData } from "@/hooks/useData";
import { getSpeciesName, getSpeciesColor } from "@/lib/dataService";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface DataTableProps {
    className?: string;
}

export function DataTable({ className }: DataTableProps) {
    const { filteredRecords, uniqueSpecies, uniqueColonies, uniqueGeoRegions, selectedYear } = useData();
    const [search, setSearch] = useState("");
    const [speciesFilter, setSpeciesFilter] = useState<string>("all");
    const [colonyFilter, setColonyFilter] = useState<string>("all");
    const [regionFilter, setRegionFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const filteredData = useMemo(() => {
        let data = [...filteredRecords];

        // Apply search
        if (search) {
            const searchLower = search.toLowerCase();
            data = data.filter(
                (record) =>
                    record.ColonyName.toLowerCase().includes(searchLower) ||
                    record.SpeciesCode.toLowerCase().includes(searchLower) ||
                    getSpeciesName(record.SpeciesCode).toLowerCase().includes(searchLower) ||
                    record.GeoRegion.toLowerCase().includes(searchLower)
            );
        }

        // Apply filters
        if (speciesFilter !== "all") {
            data = data.filter((record) => record.SpeciesCode === speciesFilter);
        }
        if (colonyFilter !== "all") {
            data = data.filter((record) => record.ColonyName === colonyFilter);
        }
        if (regionFilter !== "all") {
            data = data.filter((record) => record.GeoRegion === regionFilter);
        }

        return data;
    }, [filteredRecords, search, speciesFilter, colonyFilter, regionFilter]);

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, page]);

    const totalPages = Math.ceil(filteredData.length / pageSize);

    const clearFilters = () => {
        setSearch("");
        setSpeciesFilter("all");
        setColonyFilter("all");
        setRegionFilter("all");
        setPage(1);
    };

    const hasActiveFilters = search || speciesFilter !== "all" || colonyFilter !== "all" || regionFilter !== "all";

    const exportToCSV = () => {
        const headers = ["Date", "Colony", "Species", "Total Birds", "Total Nests", "Region", "Latitude", "Longitude"];
        const rows = filteredData.map((record) => [
            record.date2,
            record.ColonyName,
            `${record.SpeciesCode} - ${getSpeciesName(record.SpeciesCode)}`,
            record.total_birds,
            record.total_nests,
            record.GeoRegion,
            record.Latitude_y || record.Latitude_x || "",
            record.Longitude_y || record.Longitude_x || "",
        ]);

        const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `avian-data-${selectedYear || "all-years"}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className={cn("glass-card p-6", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                        <Eye className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-display font-semibold">Data Explorer</h3>
                        <p className="text-sm text-muted-foreground">
                            {filteredData.length.toLocaleString()} records
                            {hasActiveFilters && " (filtered)"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            <X className="h-4 w-4 mr-1" />
                            Clear Filters
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={exportToCSV}>
                        <Download className="h-4 w-4 mr-1" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {/* Search */}
                <div className="relative lg:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search colonies, species, regions..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="pl-9"
                    />
                </div>

                {/* Species Filter */}
                <Select
                    value={speciesFilter}
                    onValueChange={(value) => {
                        setSpeciesFilter(value);
                        setPage(1);
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All Species" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Species</SelectItem>
                        {uniqueSpecies.map((species) => (
                            <SelectItem key={species} value={species}>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: getSpeciesColor(species) }}
                                    />
                                    {species} - {getSpeciesName(species)}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Colony Filter */}
                <Select
                    value={colonyFilter}
                    onValueChange={(value) => {
                        setColonyFilter(value);
                        setPage(1);
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All Colonies" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Colonies</SelectItem>
                        {uniqueColonies.slice(0, 50).map((colony) => (
                            <SelectItem key={colony} value={colony}>
                                {colony}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Region Filter */}
                <Select
                    value={regionFilter}
                    onValueChange={(value) => {
                        setRegionFilter(value);
                        setPage(1);
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All Regions" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Regions</SelectItem>
                        {uniqueGeoRegions.map((region) => (
                            <SelectItem key={region} value={region}>
                                {region}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="border border-border/50 rounded-lg overflow-hidden">
                <ScrollArea className="h-[400px]">
                    <table className="w-full">
                        <thead className="bg-muted/50 sticky top-0 z-10">
                            <tr>
                                <th className="text-left p-3 font-medium text-sm">Date</th>
                                <th className="text-left p-3 font-medium text-sm">Colony</th>
                                <th className="text-left p-3 font-medium text-sm">Species</th>
                                <th className="text-right p-3 font-medium text-sm">Birds</th>
                                <th className="text-right p-3 font-medium text-sm">Nests</th>
                                <th className="text-left p-3 font-medium text-sm">Region</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        No records found matching your filters
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((record, index) => (
                                    <tr key={`${record.uid}-${index}`} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3 text-sm">{record.date2 || "-"}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                {(record.Latitude_y || record.Latitude_x) && (
                                                    <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                )}
                                                <span className="text-sm truncate max-w-[200px]">{record.ColonyName}</span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                                style={{
                                                    backgroundColor: `${getSpeciesColor(record.SpeciesCode)}20`,
                                                    borderColor: getSpeciesColor(record.SpeciesCode),
                                                }}
                                            >
                                                <div
                                                    className="w-2 h-2 rounded-full mr-1.5"
                                                    style={{ backgroundColor: getSpeciesColor(record.SpeciesCode) }}
                                                />
                                                {record.SpeciesCode}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-right text-sm font-medium">{record.total_birds.toLocaleString()}</td>
                                        <td className="p-3 text-right text-sm">{record.total_nests.toLocaleString()}</td>
                                        <td className="p-3 text-sm text-muted-foreground truncate max-w-[150px]">
                                            {record.GeoRegion || "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </ScrollArea>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">
                        Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, filteredData.length)} of {filteredData.length.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground px-2">
                            {page} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
