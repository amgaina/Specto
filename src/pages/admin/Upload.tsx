import { useState, useCallback } from "react";
import { usePipeline } from "@/context/PipelineContext";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Upload, Image, CheckCircle2, XCircle,
    Clock, Cloud, HardDrive, FolderOpen, Play, Bird, Home,
    Loader2,
} from "lucide-react";
import {
    processBatch, mockS3Scan, getMockCompletedJobs,
    type BatchJob,
} from "@/lib/batchProcessingService";

export default function AdminUpload({ embedded = false }: { embedded?: boolean }) {
    const { addBatchResults } = usePipeline();
    const [activeTab, setActiveTab] = useState("cloud");
    const [jobs, setJobs] = useState<BatchJob[]>(getMockCompletedJobs());
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    // S3 state
    const [s3Bucket, setS3Bucket] = useState("s3://twi-aviandata");
    const [s3Scanning, setS3Scanning] = useState(false);
    const [s3Result, setS3Result] = useState<{ folders: string[]; totalImages: number; totalSize: string } | null>(null);
    const [s3SelectedFolders, setS3SelectedFolders] = useState<Set<string>>(new Set());

    // Drive state
    const [driveConnected, setDriveConnected] = useState(false);
    const [driveScanning, setDriveScanning] = useState(false);

    const handleS3Connect = async () => {
        setS3Scanning(true);
        setS3Result(null);
        const result = await mockS3Scan(s3Bucket);
        setS3Result(result);
        setS3Scanning(false);
    };

    const handleS3Import = () => {
        const mockJob: BatchJob = {
            id: crypto.randomUUID(),
            source: "s3",
            sourceName: `${s3Bucket}/surveys/ (${s3SelectedFolders.size} folders)`,
            files: [],
            status: "processing",
            progress: 0,
            startedAt: new Date(),
            results: { totalImages: s3SelectedFolders.size * 450, processedImages: 0, totalBirds: 0, totalNests: 0, errors: 0 },
        };

        setJobs(prev => [mockJob, ...prev]);
        setActiveTab("queue");

        // Simulate processing
        let progress = 0;
        const timer = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(timer);
                setJobs(prev => prev.map(j =>
                    j.id === mockJob.id
                        ? {
                            ...j,
                            status: "completed" as const,
                            progress: 100,
                            completedAt: new Date(),
                            results: {
                                totalImages: s3SelectedFolders.size * 450,
                                processedImages: s3SelectedFolders.size * 450,
                                totalBirds: s3SelectedFolders.size * 2800,
                                totalNests: s3SelectedFolders.size * 1950,
                                errors: Math.floor(Math.random() * 3),
                            },
                        }
                        : j
                ));
            } else {
                setJobs(prev => prev.map(j =>
                    j.id === mockJob.id
                        ? { ...j, progress: Math.round(progress), results: { ...j.results, processedImages: Math.round((progress / 100) * j.results.totalImages) } }
                        : j
                ));
            }
        }, 600);
    };

    const handleDriveConnect = () => {
        setDriveScanning(true);
        setTimeout(() => {
            setDriveConnected(true);
            setDriveScanning(false);
        }, 2000);
    };

    // Batch upload handlers
    const handleFiles = useCallback((files: File[]) => {
        const imageFiles = files.filter(f => f.type.startsWith("image/"));
        setSelectedFiles(prev => [...prev, ...imageFiles]);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(Array.from(e.dataTransfer.files));
    }, [handleFiles]);

    const handleStartBatch = async () => {
        if (selectedFiles.length === 0) return;
        setActiveTab("queue");

        const completedJob = await processBatch(selectedFiles, (job) => {
            setJobs(prev => {
                const existing = prev.findIndex(j => j.id === job.id);
                if (existing >= 0) {
                    const updated = [...prev];
                    updated[existing] = { ...job };
                    return updated;
                }
                return [{ ...job }, ...prev];
            });
        });

        // Push completed batch results into the pipeline context
        if (completedJob && completedJob.files) {
            const batchEntries = completedJob.files
                .filter(f => f.status === "completed" && f.file)
                .map(f => ({
                    fileName: f.name,
                    imageUrl: URL.createObjectURL(f.file!),
                    imageFile: f.file!,
                    aiBirdCount: f.prediction?.birdCount,
                    aiNestCount: f.prediction?.nestCount,
                    aiVisualization: f.prediction?.visualization,
                    aiModelInfo: f.prediction?.modelInfo,
                }));
            if (batchEntries.length > 0) {
                addBatchResults(batchEntries);
            }
        }

        setSelectedFiles([]);
    };

    const totalStats = jobs.reduce(
        (acc, j) => ({
            images: acc.images + j.results.processedImages,
            birds: acc.birds + j.results.totalBirds,
            nests: acc.nests + j.results.totalNests,
        }),
        { images: 0, birds: 0, nests: 0 }
    );

    const content = (
        <div>
                {!embedded && (
                    <div className="mb-6">
                        <h1 className="text-xl font-bold mb-1">Data Ingestion</h1>
                        <p className="text-sm text-muted-foreground">
                            Upload aerial survey images for AI processing
                        </p>
                    </div>
                )}

                {/* Compact stats bar */}
                <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Image className="h-3 w-3" />{totalStats.images.toLocaleString()} images</span>
                    <span className="flex items-center gap-1"><Bird className="h-3 w-3" />{totalStats.birds.toLocaleString()} birds</span>
                    <span className="flex items-center gap-1"><Home className="h-3 w-3" />{totalStats.nests.toLocaleString()} nests</span>
                    {jobs.some(j => j.status === "processing") && (
                        <span className="flex items-center gap-1 text-primary"><Loader2 className="h-3 w-3 animate-spin" />Processing...</span>
                    )}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full max-w-sm grid-cols-3 mb-4 h-8">
                        <TabsTrigger value="cloud" className="gap-1.5 text-xs">
                            <Cloud className="h-3 w-3" />
                            Cloud
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="gap-1.5 text-xs">
                            <Upload className="h-3 w-3" />
                            Upload
                        </TabsTrigger>
                        <TabsTrigger value="queue" className="gap-1.5 text-xs">
                            <HardDrive className="h-3 w-3" />
                            Queue
                            {jobs.some(j => j.status === "processing") && (
                                <span className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Cloud Sources Tab */}
                    <TabsContent value="cloud" className="space-y-4 mt-0">
                        <div className="grid lg:grid-cols-2 gap-4">
                            {/* S3 */}
                            <div className="rounded-lg border border-border/50 p-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Cloud className="h-4 w-4 text-amber-500" />
                                    Amazon S3
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        value={s3Bucket}
                                        onChange={e => setS3Bucket(e.target.value)}
                                        placeholder="s3://bucket-name/prefix"
                                        className="flex-1 h-8 text-sm"
                                    />
                                    <Button size="sm" onClick={handleS3Connect} disabled={s3Scanning}>
                                        {s3Scanning ? <Loader2 className="h-3 w-3 animate-spin" /> : "Scan"}
                                    </Button>
                                </div>

                                {s3Scanning && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Scanning...
                                    </div>
                                )}

                                {s3Result && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-green-500">
                                            <CheckCircle2 className="h-3 w-3" />
                                            {s3Result.totalImages.toLocaleString()} images ({s3Result.totalSize})
                                        </div>

                                        <div className="space-y-0.5 max-h-[150px] overflow-y-auto">
                                            {s3Result.folders.map(folder => (
                                                <button
                                                    key={folder}
                                                    onClick={() => {
                                                        const next = new Set(s3SelectedFolders);
                                                        next.has(folder) ? next.delete(folder) : next.add(folder);
                                                        setS3SelectedFolders(next);
                                                    }}
                                                    className={`w-full flex items-center gap-2 p-1.5 rounded text-xs text-left transition-all ${s3SelectedFolders.has(folder)
                                                            ? "bg-primary/10 text-primary"
                                                            : "hover:bg-muted/50 text-muted-foreground"
                                                        }`}
                                                >
                                                    <FolderOpen className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">{folder}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {s3SelectedFolders.size > 0 && (
                                            <Button size="sm" onClick={handleS3Import} className="w-full gap-1.5 text-xs">
                                                <Play className="h-3 w-3" />
                                                Import {s3SelectedFolders.size} folders (~{s3SelectedFolders.size * 450} images)
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Google Drive */}
                            <div className="rounded-lg border border-border/50 p-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <HardDrive className="h-4 w-4 text-primary" />
                                    Google Drive
                                </div>
                                {!driveConnected ? (
                                    <Button size="sm" onClick={handleDriveConnect} disabled={driveScanning} className="w-full gap-1.5 text-xs" variant="outline">
                                        {driveScanning ? (
                                            <><Loader2 className="h-3 w-3 animate-spin" /> Connecting...</>
                                        ) : (
                                            <><Cloud className="h-3 w-3" /> Connect Google Drive</>
                                        )}
                                    </Button>
                                ) : (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs text-green-500 mb-2">
                                            <CheckCircle2 className="h-3 w-3" /> Connected
                                        </div>
                                        {["Field Reports 2024", "Aerial Surveys Q1", "Colony Monitoring"].map(folder => (
                                            <div key={folder} className="flex items-center gap-2 p-1.5 rounded text-xs hover:bg-muted/50 cursor-pointer">
                                                <FolderOpen className="h-3 w-3 text-muted-foreground" />
                                                <span>{folder}</span>
                                                <span className="ml-auto text-muted-foreground">~200</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Batch Upload Tab */}
                    <TabsContent value="upload" className="mt-0">
                        <div
                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                            onDrop={handleDrop}
                            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all ${isDragging
                                    ? "border-primary bg-primary/10"
                                    : "border-border/50 hover:border-border hover:bg-muted/20"
                                }`}
                        >
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={e => e.target.files && handleFiles(Array.from(e.target.files))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Upload className={`h-6 w-6 mx-auto mb-2 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                            <p className="text-sm font-medium">{isDragging ? "Drop files here" : "Drop aerial images or click to browse"}</p>
                            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, TIFF, WebP</p>
                        </div>

                        <div className="relative my-3">
                            <input
                                type="file"
                                /* @ts-expect-error webkitdirectory is valid but not in React types */
                                webkitdirectory=""
                                multiple
                                onChange={e => e.target.files && handleFiles(Array.from(e.target.files))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                                <FolderOpen className="h-3 w-3" />
                                Select Entire Folder
                            </Button>
                        </div>

                        {/* Selected files preview */}
                        {selectedFiles.length > 0 && (
                            <div className="space-y-3 pt-3 border-t border-border/50">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">
                                        {selectedFiles.length} images
                                        <span className="text-muted-foreground ml-1.5">
                                            ({(selectedFiles.reduce((s, f) => s + f.size, 0) / (1024 * 1024)).toFixed(1)} MB)
                                        </span>
                                    </span>
                                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSelectedFiles([])}>Clear</Button>
                                </div>

                                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5 max-h-[150px] overflow-y-auto">
                                    {selectedFiles.slice(0, 30).map((file, i) => (
                                        <div key={i} className="aspect-square rounded bg-muted/30 overflow-hidden">
                                            <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                    {selectedFiles.length > 30 && (
                                        <div className="aspect-square rounded bg-muted/50 flex items-center justify-center">
                                            <span className="text-xs text-muted-foreground">+{selectedFiles.length - 30}</span>
                                        </div>
                                    )}
                                </div>

                                <Button size="sm" onClick={handleStartBatch} className="w-full gap-1.5 text-xs">
                                    <Play className="h-3 w-3" />
                                    Process {selectedFiles.length} images with AI
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    {/* Processing Queue Tab */}
                    <TabsContent value="queue" className="space-y-2 mt-0">
                        {jobs.length === 0 ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                <HardDrive className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                No processing jobs yet
                            </div>
                        ) : (
                            jobs.map(job => (
                                <div key={job.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                                    <div className="shrink-0">
                                        {job.status === "completed" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                        {job.status === "processing" && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
                                        {job.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
                                        {job.status === "queued" && <Clock className="h-4 w-4 text-amber-500" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-sm font-medium truncate">{job.sourceName}</p>
                                        </div>
                                        {job.status === "processing" && (
                                            <Progress value={job.progress} className="h-1 mb-1" />
                                        )}
                                        <div className="flex gap-3 text-[10px] text-muted-foreground">
                                            <span>{job.results.processedImages}/{job.results.totalImages} img</span>
                                            <span>{job.results.totalBirds.toLocaleString()} birds</span>
                                            <span>{job.results.totalNests.toLocaleString()} nests</span>
                                            {job.results.errors > 0 && <span className="text-destructive">{job.results.errors} err</span>}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
        </div>
    );

    if (embedded) return content;

    return (
        <div className="min-h-screen bg-background">
            <AdminHeader />
            <main className="container mx-auto px-4 lg:px-8 pt-12 pb-12">
                {content}
            </main>
        </div>
    );
}
