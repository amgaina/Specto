import { ManagerHeader } from "@/components/layout/ManagerHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Wand2, CheckCircle2 } from "lucide-react";

export default function ManagerImageAnalysis() {
    return (
        <div className="min-h-screen bg-background">
            <ManagerHeader />

            <main className="container mx-auto px-4 lg:px-8 pt-24 pb-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Image Analysis</h1>
                    <p className="text-muted-foreground">
                        AI-powered analysis of aerial survey images for species identification
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Upload Section */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                Analyze New Image
                            </CardTitle>
                            <CardDescription>
                                Upload an aerial survey image for AI-powered species detection
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                                <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="font-medium mb-1">Drop image here or click to browse</p>
                                <p className="text-sm text-muted-foreground">Supports JPG, PNG, TIFF up to 50MB</p>
                            </div>
                            <Button className="w-full mt-4">
                                <Wand2 className="h-4 w-4 mr-2" />
                                Start Analysis
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Recent Analyses */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Recent Analyses</CardTitle>
                            <CardDescription>Previously analyzed survey images</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { name: "survey_2024_03_15.jpg", species: 12, confidence: 94 },
                                    { name: "colony_A_aerial.png", species: 8, confidence: 91 },
                                    { name: "marsh_survey_001.jpg", species: 15, confidence: 88 },
                                ].map((analysis, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                                            <Camera className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{analysis.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {analysis.species} species detected • {analysis.confidence}% confidence
                                            </p>
                                        </div>
                                        <CheckCircle2 className="h-5 w-5 text-success" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
