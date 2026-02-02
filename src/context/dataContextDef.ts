import { createContext } from "react";
import {
  AvianRecord,
  YearlyStats,
  SpeciesStats,
  ColonyStats,
  MonthlyStats,
} from "@/lib/dataService";

export interface DataContextType {
  records: AvianRecord[];
  loading: boolean;
  error: string | null;
  selectedYear: number | null;
  setSelectedYear: (year: number | null) => void;
  yearlyStats: YearlyStats[];
  speciesStats: SpeciesStats[];
  colonyStats: ColonyStats[];
  monthlyStats: MonthlyStats[];
  geoRegionStats: { region: string; totalBirds: number; totalNests: number; colonies: number }[];
  availableYears: number[];
  uniqueSpecies: string[];
  uniqueColonies: string[];
  uniqueGeoRegions: string[];
  filteredRecords: AvianRecord[];
}

export const DataContext = createContext<DataContextType | undefined>(undefined);
