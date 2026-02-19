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

// Mock S3 scan — matches REAL TWI bucket at s3://twi-aviandata/ (verified Feb 2026)
// Bucket is public (--no-sign-request)
// Real structure: /avian_monitoring/high_resolution_photos/{year}/{region}/{colony}/
// Real years: 2010, 2011, 2012, 2013, 2015, 2018, 2021, 2022, 2023 (no 2014, 2016-17, 2019-20)
// Real totals: 21,592 high-res images (187.0 GB) + 17,324 screenshots (5.6 GB) = 38,916 images (192.6 GB)
export function mockS3Scan(bucket: string): Promise<{ folders: string[]; totalImages: number; totalSize: string }> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                folders: [
                    `${bucket}/avian_monitoring/high_resolution_photos/2010/`,  // 3,115 images
                    `${bucket}/avian_monitoring/high_resolution_photos/2011/`,  // 2,228 images
                    `${bucket}/avian_monitoring/high_resolution_photos/2012/`,  // 1,630 images
                    `${bucket}/avian_monitoring/high_resolution_photos/2013/`,  // 2,056 images
                    `${bucket}/avian_monitoring/high_resolution_photos/2015/`,  // 3,427 images
                    `${bucket}/avian_monitoring/high_resolution_photos/2018/`,  // 1,796 images
                    `${bucket}/avian_monitoring/high_resolution_photos/2021/`,  // 3,958 images
                    `${bucket}/avian_monitoring/high_resolution_photos/2022/`,  // 1,679 images
                    `${bucket}/avian_monitoring/high_resolution_photos/2023/`,  // 1,703 images
                    `${bucket}/avian_monitoring/screenshots/2010/`,             // 2,995 images
                    `${bucket}/avian_monitoring/screenshots/2011/`,             // 1,820 images
                    `${bucket}/avian_monitoring/screenshots/2018/`,             // 1,772 images
                    `${bucket}/avian_monitoring/screenshots/2021/`,             // 3,754 images
                ],
                totalImages: 38_916,
                totalSize: "192.6 GB",
            });
        }, 1500);
    });
}

// Mock completed jobs — using real TWI bucket paths and colony names
export function getMockCompletedJobs(): BatchJob[] {
    return [
        {
            id: "mock-1",
            source: "s3",
            sourceName: "s3://twi-aviandata/avian_monitoring/high_resolution_photos/2018/Terrebonne Bay/",
            files: [],
            status: "completed",
            progress: 100,
            startedAt: new Date(Date.now() - 86400000),
            completedAt: new Date(Date.now() - 82800000),
            // 2018 Terrebonne Bay has 6 colonies: Raccoon Island, Felicity, Whiskey, East, Philo Brice, Houma Nav Canal
            results: { totalImages: 312, processedImages: 312, totalBirds: 4831, totalNests: 3576, errors: 0 },
        },
        {
            id: "mock-2",
            source: "s3",
            sourceName: "s3://twi-aviandata/avian_monitoring/high_resolution_photos/2018/Breton-Chandeleur Islands/",
            files: [],
            status: "completed",
            progress: 100,
            startedAt: new Date(Date.now() - 172800000),
            completedAt: new Date(Date.now() - 169200000),
            results: { totalImages: 287, processedImages: 284, totalBirds: 8940, totalNests: 6812, errors: 3 },
        },
        {
            id: "mock-3",
            source: "drive",
            sourceName: "Google Drive / Felicity Island Field Reports 2023",
            files: [],
            status: "completed",
            progress: 100,
            startedAt: new Date(Date.now() - 604800000),
            completedAt: new Date(Date.now() - 601200000),
            results: { totalImages: 456, processedImages: 456, totalBirds: 6234, totalNests: 4567, errors: 0 },
        },
    ];
}
