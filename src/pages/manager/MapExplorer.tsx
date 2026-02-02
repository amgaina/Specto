import { ManagerHeader } from "@/components/layout/ManagerHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Map as MapIcon, Layers, Filter } from "lucide-react";

export default function ManagerMapExplorer() {
    return (
        <div className="min-h-screen bg-background">
            <ManagerHeader />

            <main className="container mx-auto px-4 lg:px-8 pt-24 pb-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Map Explorer</h1>
                    <p className="text-muted-foreground">
                        Visualize colony locations and wildlife distribution across Louisiana's coast
                    </p>
                </div>

                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Map Area */}
                    <div className="lg:col-span-3">
                        <Card className="glass-card h-[600px]">
                            <CardContent className="p-0 h-full">
                                <div className="w-full h-full bg-muted/30 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <MapIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">Interactive Map</h3>
                                        <p className="text-sm text-muted-foreground max-w-md">
                                            Map integration will display colony locations, migration patterns,
                                            and geographic distribution of wildlife species.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Controls */}
                    <div className="space-y-6">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Layers className="h-5 w-5" />
                                    Map Layers
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {["Colonies", "Habitats", "Migration Routes", "Protected Areas"].map((layer) => (
                                    <label key={layer} className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" className="rounded" defaultChecked />
                                        <span className="text-sm">{layer}</span>
                                    </label>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Filter className="h-5 w-5" />
                                    Filters
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Species</label>
                                    <select className="w-full p-2 rounded-lg bg-background border border-border">
                                        <option>All Species</option>
                                        <option>Brown Pelican</option>
                                        <option>Great Egret</option>
                                        <option>Roseate Spoonbill</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Year</label>
                                    <select className="w-full p-2 rounded-lg bg-background border border-border">
                                        <option>2024</option>
                                        <option>2023</option>
                                        <option>2022</option>
                                    </select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
