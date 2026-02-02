import { useState, useEffect, ReactNode } from "react";
import {
    AvianRecord,
    parseCSV,
    getYearlyStats,
    getSpeciesStats,
    getColonyStats,
    getMonthlyStats,
    getGeoRegionStats,
    getAvailableYears,
    getUniqueSpecies,
    getUniqueColonies,
    getUniqueGeoRegions,
} from "@/lib/dataService";
import { DataContext } from "./dataContextDef";

export function DataProvider({ children }: { children: ReactNode }) {
    const [records, setRecords] = useState<AvianRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);

    // Load CSV data on mount
    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                // Try to load from public folder first
                const response = await fetch("/data.csv");
                if (!response.ok) {
                    throw new Error("Failed to load data.csv");
                }
                const csvText = await response.text();
                const parsed = parseCSV(csvText);
                setRecords(parsed);

                // Set initial year to the most recent year
                const years = getAvailableYears(parsed);
                if (years.length > 0) {
                    setSelectedYear(years[years.length - 1]);
                }
            } catch (err) {
                console.error("Error loading data:", err);
                setError(err instanceof Error ? err.message : "Failed to load data");
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    // Derived data
    const availableYears = getAvailableYears(records);
    const uniqueSpecies = getUniqueSpecies(records);
    const uniqueColonies = getUniqueColonies(records);
    const uniqueGeoRegions = getUniqueGeoRegions(records);

    const filteredRecords = selectedYear
        ? records.filter((r) => r.Year === selectedYear)
        : records;

    const yearlyStats = getYearlyStats(records);
    const speciesStats = getSpeciesStats(records, selectedYear || undefined);
    const colonyStats = getColonyStats(records, selectedYear || undefined);
    const monthlyStats = getMonthlyStats(records, selectedYear || undefined);
    const geoRegionStats = getGeoRegionStats(records, selectedYear || undefined);

    return (
        <DataContext.Provider
            value={{
                records,
                loading,
                error,
                selectedYear,
                setSelectedYear,
                yearlyStats,
                speciesStats,
                colonyStats,
                monthlyStats,
                geoRegionStats,
                availableYears,
                uniqueSpecies,
                uniqueColonies,
                uniqueGeoRegions,
                filteredRecords,
            }}
        >
            {children}
        </DataContext.Provider>
    );
}
