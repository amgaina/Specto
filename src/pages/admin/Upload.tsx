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
    CheckCircle2,
    XCircle,
    Clock,
    Trash2,
} from "lucide-react";

interface UploadedFile {
    id: string;
    name: string;
    type: "image" | "csv" | "json" | "geojson";
    size: string;
    status: "processing" | "completed" | "error";
    uploadedAt: Date;
    preview?: string;
}

export default function AdminUpload() {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
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
            name: "nest_locations.geojson",
            type: "geojson",
            size: "1.1 MB",
            status: "completed",
            uploadedAt: new Date(Date.now() - 7200000),
        },
    ]);

    const handleFiles = useCallback((files: File[]) => {
        const formatSize = (bytes: number): string => {
            if (bytes < 1024) return bytes + " B";
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
            return (bytes / (1024 * 1024)).toFixed(1) + " MB";
        };

        const newFiles: UploadedFile[] = files.map((file) => {
            const ext = file.name.split(".").pop()?.toLowerCase();
            let type: UploadedFile["type"] = "csv";
            if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) type = "image";
            else if (ext === "json") type = "json";
            else if (ext === "geojson") type = "geojson";

            return {
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                type,
                size: formatSize(file.size),
                status: "processing" as const,
                uploadedAt: new Date(),
                preview: type === "image" ? URL.createObjectURL(file) : undefined,
            };
        });

        setUploadedFiles((prev) => [...newFiles, ...prev]);

        // Simulate processing
        newFiles.forEach((file) => {
            setTimeout(() => {
                setUploadedFiles((prev) =>
                    prev.map((f) => (f.id === file.id ? { ...f, status: "completed" as const } : f))
                );
            }, 2000 + Math.random() * 3000);
        });
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    }, [handleFiles]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const deleteFile = (id: string) => {
        setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
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

            <main className="container mx-auto px-4 lg:px-8 pt-24 pb-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Upload Data</h1>
                    <p className="text-muted-foreground">
                        Upload survey data files, colony records, and geographic information
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Upload Zone */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                Upload Files
                            </CardTitle>
                            <CardDescription>
                                Drag and drop files or click to browse. Supports CSV, JSON, GeoJSON formats.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${isDragging
                                        ? "border-primary bg-primary/10 scale-[1.02]"
                                        : "border-border/50 hover:border-border hover:bg-muted/30"
                                    }`}
                            >
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileInput}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept=".csv,.json,.geojson"
                                />

                                <div className="flex flex-col items-center gap-4">
                                    <div
                                        className={`p-4 rounded-full transition-all ${isDragging ? "bg-primary/20" : "bg-muted"
                                            }`}
                                    >
                                        <Upload
                                            className={`h-8 w-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`}
                                        />
                                    </div>
                                    <div>
                                        <p className="font-medium mb-1">
                                            {isDragging ? "Drop files here" : "Drag & drop files here"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">or click to browse</p>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2 text-xs">
                                        <Badge variant="outline">CSV</Badge>
                                        <Badge variant="outline">JSON</Badge>
                                        <Badge variant="outline">GeoJSON</Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-4 rounded-lg bg-muted/30">
                                <h4 className="font-medium mb-2">Supported Data Formats</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• <strong>CSV:</strong> Tabular survey data with headers</li>
                                    <li>• <strong>JSON:</strong> Structured colony and species data</li>
                                    <li>• <strong>GeoJSON:</strong> Geographic location data</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Uploads */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Upload History
                            </CardTitle>
                            <CardDescription>View and manage your uploaded files</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                {uploadedFiles.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>No files uploaded yet</p>
                                    </div>
                                ) : (
                                    uploadedFiles.map((file) => (
                                        <div
                                            key={file.id}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                                        >
                                            <div className="p-2 rounded-lg bg-background/50">{getFileIcon(file.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{file.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{file.size}</span>
                                                    <span>•</span>
                                                    <span>{file.uploadedAt.toLocaleTimeString()}</span>
                                                </div>
                                                {file.status === "processing" && (
                                                    <Progress value={65} className="h-1 mt-2" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(file.status)}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => deleteFile(file.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
