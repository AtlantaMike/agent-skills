import * as faceapi from 'face-api.js';
import { matchFacesToTracked } from './faceDetection';
import { applyCensor } from './censoring';
import type { TrackedFace, ProcessingConfig } from '@/types';

export interface VideoProcessingOptions {
  config: ProcessingConfig;
  onProgress: (progress: number, currentFaces: TrackedFace[]) => void;
  onFrameProcessed?: (frameIndex: number, canvas: HTMLCanvasElement) => void;
  signal?: AbortSignal;
}

export async function processVideoFrames(
  videoElement: HTMLVideoElement,
  options: VideoProcessingOptions
): Promise<{ frames: ImageData[]; width: number; height: number; fps: number }> {
  const { config, onProgress, signal } = options;

  const width = videoElement.videoWidth;
  const height = videoElement.videoHeight;

  // Estimate FPS from video
  let fps = 30;
  try {
    // @ts-ignore
    const tracks = (videoElement.srcObject as MediaStream | null)?.getVideoTracks();
    if (tracks?.[0]) fps = tracks[0].getSettings().frameRate ?? 30;
  } catch {}

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  const duration = videoElement.duration;
  // Process at up to 30fps to keep it manageable; for long videos, we sample smarter
  const targetFps = Math.min(30, fps);
  const frameInterval = 1 / targetFps;
  const totalFrames = Math.ceil(duration * targetFps);
  const frames: ImageData[] = [];

  let trackedFaces: TrackedFace[] = [];
  let frameIndex = 0;

  const seekTo = (time: number): Promise<void> =>
    new Promise((resolve) => {
      videoElement.currentTime = time;
      videoElement.onseeked = () => resolve();
    });

  for (let t = 0; t < duration; t += frameInterval) {
    if (signal?.aborted) break;

    await seekTo(t);
    ctx.drawImage(videoElement, 0, 0, width, height);

    // Detect faces on this frame
    try {
      const detections = await faceapi
        .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.35 }))
        .withFaceLandmarks(true)
        .withFaceDescriptors();

      trackedFaces = matchFacesToTracked(detections, trackedFaces, frameIndex, config, width, height);
    } catch {
      // Keep previous tracking on detection failure
    }

    // Apply censoring to censored faces
    for (const face of trackedFaces) {
      if (face.censored) {
        applyCensor(ctx, face.box, config.censorMode, config.blurRadius, config.pixelSize);
      }
    }

    frames.push(ctx.getImageData(0, 0, width, height));
    onProgress(Math.round((frameIndex / totalFrames) * 100), trackedFaces);
    frameIndex++;
  }

  return { frames, width, height, fps: targetFps };
}

export function encodeFramesToWebM(
  frames: ImageData[],
  width: number,
  height: number,
  fps: number,
  onProgress?: (p: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Use MediaRecorder + Canvas to encode
    const stream = canvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
      videoBitsPerSecond: 4_000_000,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
    recorder.onerror = reject;
    recorder.start();

    let i = 0;
    const msPerFrame = 1000 / fps;

    function writeFrame() {
      if (i >= frames.length) {
        recorder.stop();
        return;
      }
      ctx.putImageData(frames[i], 0, 0);
      onProgress?.(Math.round((i / frames.length) * 100));
      i++;
      setTimeout(writeFrame, msPerFrame);
    }

    writeFrame();
  });
}
