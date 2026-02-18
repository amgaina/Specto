import { useState, useCallback } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Upload,
    Image,
    FileSpreadsheet,
    MapPin,
    Database,
    CheckCircle2,
    XCircle,
    Clock,
    Trash2,
    Bird,
    AlertCircle,
    TrendingUp,
    Users,
} from "lucide-react";

interface UploadedFile {
    id: string;
    name: string;
    type: "image" | "csv" | "json" | "geojson";
    size: string;
    status: "processing" | "completed" | "error";
    uploadedAt: Date;
}

export default function AdminDashboard() {
    const [recentUploads] = useState<UploadedFile[]>([
        {
            id: "1",
            name: "colony_survey_2024.csv",
            type: "csv",
            size: "2.4 MB",
            status: "completed",
            uploadedAt: new Date(Date.now() - 3600000),
        },
        {
            id: "2",
            name: "aerial_photo_batch_03.zip",
            type: "image",
            size: "156 MB",
            status: "processing",
            uploadedAt: new Date(Date.now() - 1800000),
        },
        {
            id: "3",
            name: "nest_locations.geojson",
            type: "geojson",
            size: "1.1 MB",
            status: "completed",
            uploadedAt: new Date(Date.now() - 7200000),
        },
    ]);

    const stats = {
        totalUploads: 1247,
        processedToday: 34,
        pendingReview: 12,
        totalRecords: 49206,
    };

    const getStatusIcon = (status: UploadedFile["status"]) => {
        switch (status) {
            case "completed":
                return <CheckCircle2 className="h-4 w-4 text-success" />;
            case "error":
                return <XCircle className="h-4 w-4 text-destructive" />;
            default:
                return <Clock className="h-4 w-4 text-warning animate-pulse" />;
        }
    };

    const getFileIcon = (type: UploadedFile["type"]) => {
        switch (type) {
            case "image":
                return <Image className="h-5 w-5" />;
            case "geojson":
                return <MapPin className="h-5 w-5" />;
            default:
                return <FileSpreadsheet className="h-5 w-5" />;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <AdminHeader />

            <main className="container mx-auto px-4 lg:px-8 pt-12 pb-12">
                {/* Welcome Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                            <Database className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold">Data Administration Dashboard</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Manage and upload wildlife monitoring data, images, and survey records.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="glass-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/20">
                                    <Upload className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.totalUploads.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">Total Uploads</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-success/20">
                                    <CheckCircle2 className="h-5 w-5 text-success" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.processedToday}</p>
                                    <p className="text-xs text-muted-foreground">Processed Today</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-warning/20">
                                    <AlertCircle className="h-5 w-5 text-warning" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.pendingReview}</p>
                                    <p className="text-xs text-muted-foreground">Pending Review</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/20">
                                    <Bird className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">Survey Records</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <Card className="glass-card lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Common data management tasks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <a
                                    href="/admin/pipeline"
                                    className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/30 hover:border-primary/30 transition-all group"
                                >
                                    <div className="p-3 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                                        <Upload className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Upload Data</h3>
                                        <p className="text-sm text-muted-foreground">CSV, JSON, GeoJSON files</p>
                                    </div>
                                </a>

                                <a
                                    href="/admin/pipeline"
                                    className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/30 hover:border-primary/30 transition-all group"
                                >
                                    <div className="p-3 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                                        <Image className="h-6 w-6 text-green-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Upload Images</h3>
                                        <p className="text-sm text-muted-foreground">Aerial survey photos</p>
                                    </div>
                                </a>

                                <a
                                    href="/admin/records"
                                    className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/30 hover:border-primary/30 transition-all group"
                                >
                                    <div className="p-3 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
                                        <FileSpreadsheet className="h-6 w-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Manage Records</h3>
                                        <p className="text-sm text-muted-foreground">View & edit survey data</p>
                                    </div>
                                </a>

                                <a
                                    href="/admin/map"
                                    className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/30 hover:border-primary/30 transition-all group"
                                >
                                    <div className="p-3 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                                        <MapPin className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Map View</h3>
                                        <p className="text-sm text-muted-foreground">Colony locations</p>
                                    </div>
                                </a>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Uploads */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Recent Uploads
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recentUploads.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                                    >
                                        <div className="p-2 rounded-lg bg-background/50">{getFileIcon(file.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">{file.size}</p>
                                            {file.status === "processing" && (
                                                <Progress value={65} className="h-1 mt-1" />
                                            )}
                                        </div>
                                        {getStatusIcon(file.status)}
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" className="w-full mt-4" asChild>
                                <a href="/admin/pipeline">View All</a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Activity Summary */}
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Data Ingestion Trends
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">Upload activity chart</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Data Sources
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {[
                                    { name: "Aerial Surveys", count: 847, color: "bg-primary" },
                                    { name: "Field Reports", count: 312, color: "bg-success" },
                                    { name: "Historical Records", count: 88, color: "bg-amber-500" },
                                ].map((source) => (
                                    <div key={source.name} className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${source.color}`} />
                                        <span className="flex-1">{source.name}</span>
                                        <Badge variant="secondary">{source.count}</Badge>
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
