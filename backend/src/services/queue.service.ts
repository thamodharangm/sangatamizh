import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Make Redis optional - if not available, queue operations will be no-ops
let connection: Redis | null = null;
let transcodeQueue: Queue | null = null;

if (process.env.REDIS_URL) {
  try {
    connection = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy: () => null, // Don't retry if connection fails
    });
    
    connection.on('error', (err) => {
      console.warn('Redis connection error (queue disabled):', err.message);
      connection = null;
      transcodeQueue = null;
    });

    transcodeQueue = new Queue('transcode', { connection });
    console.log('✓ Queue service initialized with Redis');
  } catch (error) {
    console.warn('Failed to initialize Redis queue:', error);
    connection = null;
    transcodeQueue = null;
  }
} else {
  console.warn('⚠ REDIS_URL not set - background job processing disabled');
}

interface TranscodeJobData {
  songId: string;
  uploadId: string;
  storageKey: string;
}

export async function enqueueTranscodeJob(data: TranscodeJobData) {
  if (!transcodeQueue) {
    console.warn('Queue not available - skipping transcode job for song', data.songId);
    return null;
  }

  try {
    const job = await transcodeQueue.add('transcode-song', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    console.log(`Enqueued transcode job ${job.id} for song ${data.songId}`);
    return job;
  } catch (error) {
    console.error('Failed to enqueue transcode job:', error);
    return null;
  }
}

export { transcodeQueue };
