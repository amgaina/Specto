import { useState } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image, CheckSquare, ArrowRight } from "lucide-react";
import AdminUpload from "./Upload";
import AdminImages from "./Images";
import AdminReview from "./Review";

export default function AdminPipeline() {
    const [activeTab, setActiveTab] = useState("ingest");

    return (
        <div className="min-h-screen bg-background">
            <AdminHeader />
            <div className="pt-12">
                <div className="container mx-auto px-4 lg:px-8 py-4">
                    {/* Pipeline flow indicator */}
                    <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                        <button onClick={() => setActiveTab("ingest")} className={`flex items-center gap-1 px-2 py-1 rounded ${activeTab === "ingest" ? "bg-primary/10 text-primary font-medium" : "hover:text-foreground"}`}>
                            <Upload className="h-3 w-3" /> Ingest
                        </button>
                        <ArrowRight className="h-3 w-3" />
                        <button onClick={() => setActiveTab("gallery")} className={`flex items-center gap-1 px-2 py-1 rounded ${activeTab === "gallery" ? "bg-primary/10 text-primary font-medium" : "hover:text-foreground"}`}>
                            <Image className="h-3 w-3" /> Label
                        </button>
                        <ArrowRight className="h-3 w-3" />
                        <button onClick={() => setActiveTab("review")} className={`flex items-center gap-1 px-2 py-1 rounded ${activeTab === "review" ? "bg-primary/10 text-primary font-medium" : "hover:text-foreground"}`}>
                            <CheckSquare className="h-3 w-3" /> Review
                        </button>
                        <ArrowRight className="h-3 w-3" />
                        <span className="text-muted-foreground/50">Dataset</span>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full max-w-sm grid-cols-3 mb-4 h-9">
                            <TabsTrigger value="ingest" className="gap-1.5 text-xs">
                                <Upload className="h-3 w-3" />
                                Ingest
                            </TabsTrigger>
                            <TabsTrigger value="gallery" className="gap-1.5 text-xs">
                                <Image className="h-3 w-3" />
                                Gallery
                            </TabsTrigger>
                            <TabsTrigger value="review" className="gap-1.5 text-xs">
                                <CheckSquare className="h-3 w-3" />
                                Review
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="ingest" className="mt-0">
                            <AdminUpload embedded />
                        </TabsContent>

                        <TabsContent value="gallery" className="mt-0">
                            <AdminImages embedded />
                        </TabsContent>

                        <TabsContent value="review" className="mt-0">
                            <AdminReview embedded />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
