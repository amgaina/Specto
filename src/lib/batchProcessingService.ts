import { predictImage, type PredictionResult } from "./gradioService";

export interface BatchJob {
    id: string;
    source: "local" | "s3" | "drive";
    sourceName: string;
    files: BatchFile[];
    status: "queued" | "processing" | "completed" | "error";
    progress: number; // 0-100
    startedAt?: Date;
    completedAt?: Date;
    results: BatchResult;
}

export interface BatchFile {
    name: string;
    size: number;
    file?: File; // only for local uploads
    status: "pending" | "processing" | "completed" | "error";
    prediction?: PredictionResult;
}

export interface BatchResult {
    totalImages: number;
    processedImages: number;
    totalBirds: number;
    totalNests: number;
    errors: number;
}

type ProgressCallback = (job: BatchJob) => void;

function emptyResult(): BatchResult {
    return { totalImages: 0, processedImages: 0, totalBirds: 0, totalNests: 0, errors: 0 };
}

function parseCount(str: string): number {
    const match = str.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, "")) : 0;
}

export async function processBatch(
    files: File[],
    onProgress: ProgressCallback
): Promise<BatchJob> {
    const job: BatchJob = {
        id: crypto.randomUUID(),
        source: "local",
        sourceName: `${files.length} files uploaded`,
        files: files.map(f => ({ name: f.name, size: f.size, file: f, status: "pending" as const })),
        status: "processing",
        progress: 0,
        startedAt: new Date(),
        results: { ...emptyResult(), totalImages: files.length },
    };

    onProgress(job);

    for (let i = 0; i < job.files.length; i++) {
        const batchFile = job.files[i];
        batchFile.status = "processing";
        job.progress = Math.round((i / job.files.length) * 100);
        onProgress({ ...job });

        try {
            const prediction = await predictImage(batchFile.file!);
            batchFile.prediction = prediction;
            batchFile.status = "completed";
            job.results.processedImages++;
            job.results.totalBirds += parseCount(prediction.birdCount);
            job.results.totalNests += parseCount(prediction.nestCount);
        } catch {
            batchFile.status = "error";
            job.results.errors++;
        }
    }

    job.status = job.results.errors === job.files.length ? "error" : "completed";
    job.progress = 100;
    job.completedAt = new Date();
    onProgress({ ...job });

    return job;
}

// Mock S3 scan for demo
export function mockS3Scan(bucket: string): Promise<{ folders: string[]; totalImages: number; totalSize: string }> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                folders: [
                    `${bucket}/surveys/2024-03-15/`,
                    `${bucket}/surveys/2024-06-22/`,
                    `${bucket}/surveys/2024-09-10/`,
                    `${bucket}/surveys/2023-04-01/`,
                    `${bucket}/surveys/2023-07-18/`,
                ],
                totalImages: 2847,
                totalSize: "12.4 GB",
            });
        }, 1500);
    });
}

// Mock batch for demo — simulates processing completed batches
export function getMockCompletedJobs(): BatchJob[] {
    return [
        {
            id: "mock-1",
            source: "s3",
            sourceName: "s3://twi-aviandata/surveys/2024-06-22/",
            files: [],
            status: "completed",
            progress: 100,
            startedAt: new Date(Date.now() - 86400000),
            completedAt: new Date(Date.now() - 82800000),
            results: { totalImages: 847, processedImages: 847, totalBirds: 12453, totalNests: 8901, errors: 0 },
        },
        {
            id: "mock-2",
            source: "s3",
            sourceName: "s3://twi-aviandata/surveys/2024-03-15/",
            files: [],
            status: "completed",
            progress: 100,
            startedAt: new Date(Date.now() - 172800000),
            completedAt: new Date(Date.now() - 169200000),
            results: { totalImages: 1234, processedImages: 1230, totalBirds: 18762, totalNests: 14205, errors: 4 },
        },
        {
            id: "mock-3",
            source: "drive",
            sourceName: "Google Drive / Field Reports 2023",
            files: [],
            status: "completed",
            progress: 100,
            startedAt: new Date(Date.now() - 604800000),
            completedAt: new Date(Date.now() - 601200000),
            results: { totalImages: 456, processedImages: 456, totalBirds: 6234, totalNests: 4567, errors: 0 },
        },
    ];
}
