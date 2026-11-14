import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import Course from '../features/courses/courseModel.js';

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null
});

const videoWorker = new Worker('video-transcoding-pipeline', async (job) => {
  const { courseId, lessonId, inputPath } = job.data;
  
  const targetSegmentDir = path.join('uploads', 'processed', courseId, lessonId);
  fs.mkdirSync(targetSegmentDir, { recursive: true });

  const playlistFilename = 'playlist.m3u8';
  const finalPlaylistPath = path.join(targetSegmentDir, playlistFilename);

  await Course.updateOne(
    { _id: courseId, 'lessons._id': lessonId },
    { $set: { 'lessons.$.processingStatus': 'processing' } }
  );

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-codec:v libx264', // Guarantee global browser H.264 video compatibility
        '-codec:a aac',     // Guarantee global standard audio codec compatibility
        '-hls_time 6',      // Split video accurately into 6-second segments
        '-hls_list_size 0',
        '-f hls'
      ])
      .output(finalPlaylistPath)
      .on('end', async () => {
        const localStreamingUrl = `/uploads/processed/${courseId}/${lessonId}/${playlistFilename}`;

        await Course.updateOne(
          { _id: courseId, 'lessons._id': lessonId },
          {
            $set: {
              'lessons.$.videoUrl': localStreamingUrl,
              'lessons.$.processingStatus': 'completed'
            }
          }
        );

        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        resolve();
      })
      .on('error', async (err) => {
        console.error(`Transcoding failure for lesson ${lessonId}:`, err);
        // Instantly fallback state to failed to prevent UI locking loops
        await Course.updateOne(
          { _id: courseId, 'lessons._id': lessonId },
          { $set: { 'lessons.$.processingStatus': 'failed' } }
        );
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        reject(err);
      })
      .run();
  });
}, { connection });

export default videoWorker;
