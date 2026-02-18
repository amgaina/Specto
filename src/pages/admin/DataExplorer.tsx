import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { DataProvider } from "@/context/DataProvider";
import { useData } from "@/hooks/useData";
import { InteractiveTimeline } from "@/components/visualization/InteractiveTimeline";
import { YearlyTrendChart } from "@/components/visualization/YearlyTrendChart";
import { SpeciesDistributionChart } from "@/components/visualization/SpeciesDistributionChart";
import { MonthlyActivityChart } from "@/components/visualization/MonthlyActivityChart";
import { ColonyStatsChart } from "@/components/visualization/ColonyStatsChart";
import { StatsOverview } from "@/components/visualization/StatsOverview";
import { DataTable } from "@/components/visualization/DataTable";
import { ConservationInsights } from "@/components/visualization/ConservationInsights";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bird, BarChart3, Table, Loader2, AlertTriangle } from "lucide-react";
import { AdminHeader } from "@/components/layout/AdminHeader";

function DataExplorerContent() {
    const { loading, error, selectedYear } = useData();
    const [activeTab, setActiveTab] = useState("overview");

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <AdminHeader />
                <div className="container mx-auto px-4 lg:px-8 pt-12 pb-12">
                    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-lg text-muted-foreground">Loading avian monitoring data...</p>
                        <p className="text-sm text-muted-foreground">This may take a moment for large datasets</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <AdminHeader />
                <div className="container mx-auto px-4 lg:px-8 pt-12 pb-12">
                    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                        <div className="text-6xl">⚠️</div>
                        <h2 className="text-xl font-semibold">Failed to Load Data</h2>
                        <p className="text-muted-foreground text-center max-w-md">
                            {error}. Please make sure the data.csv file is available in the public folder.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <AdminHeader />

            {/* Hero Section */}
            <section className="relative pt-12 pb-8 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-success/5 rounded-full blur-3xl" />
                </div>

                <div className="container mx-auto px-4 lg:px-8 relative">
                    <div className="max-w-4xl mx-auto text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
                            <Bird className="h-4 w-4" />
                            <span>Louisiana Avian Monitoring Data</span>
                        </div>

                        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                            Interactive Data
                            <span className="block text-gradient-gold">Explorer</span>
                        </h1>

                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Explore decades of bird colony survey data through interactive visualizations.
                            Use the timeline to travel through history and discover population trends.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="pb-12">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="grid lg:grid-cols-4 gap-6">
                        {/* Sidebar - Timeline */}
                        <div className="lg:col-span-1">
                            <div className="lg:sticky lg:top-24">
                                <InteractiveTimeline />
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Stats Overview */}
                            <StatsOverview />

                            {/* Tabs for Different Views */}
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-4 mb-6">
                                    <TabsTrigger value="overview" className="gap-2">
                                        <BarChart3 className="h-4 w-4" />
                                        <span className="hidden sm:inline">Overview</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="species" className="gap-2">
                                        <Bird className="h-4 w-4" />
                                        <span className="hidden sm:inline">Species</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="conservation" className="gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span className="hidden sm:inline">Conservation</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="data" className="gap-2">
                                        <Table className="h-4 w-4" />
                                        <span className="hidden sm:inline">Data</span>
                                    </TabsTrigger>
                                </TabsList>

                                {/* Overview Tab */}
                                <TabsContent value="overview" className="space-y-6 mt-0">
                                    <YearlyTrendChart />
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="min-w-0"><MonthlyActivityChart /></div>
                                        <div className="min-w-0"><ColonyStatsChart limit={10} /></div>
                                    </div>
                                </TabsContent>

                                {/* Species Tab */}
                                <TabsContent value="species" className="space-y-6 mt-0">
                                    <SpeciesDistributionChart limit={12} />
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="min-w-0"><ColonyStatsChart limit={10} /></div>
                                        <div className="min-w-0"><MonthlyActivityChart /></div>
                                    </div>
                                </TabsContent>

                                {/* Conservation Tab */}
                                <TabsContent value="conservation" className="space-y-6 mt-0">
                                    <ConservationInsights />
                                </TabsContent>

                                {/* Data Tab */}
                                <TabsContent value="data" className="mt-0">
                                    <DataTable />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Info */}
            <section className="py-8 border-t border-border/50">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Bird className="h-4 w-4" />
                            <span>Louisiana Coastal Wildlife Monitoring Program</span>
                        </div>
                        <div>
                            {selectedYear ? (
                                <span>Currently viewing: <strong className="text-foreground">{selectedYear}</strong></span>
                            ) : (
                                <span>Viewing: <strong className="text-foreground">All Years</strong></span>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default function DataExplorer() {
    return (
        <DataProvider>
            <DataExplorerContent />
        </DataProvider>
    );
}
