'use client';

import { useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { matchFacesToTracked } from '@/lib/faceDetection';
import { applyCensor, drawFaceOverlay } from '@/lib/censoring';
import { processVideoFrames, encodeFramesToWebM } from '@/lib/videoProcessor';
import type { TrackedFace, ProcessingConfig } from '@/types';

interface VideoProcessorProps {
  videoFile: File;
  config: ProcessingConfig;
  onComplete: (blob: Blob) => void;
}

export default function VideoProcessor({ videoFile, config, onComplete }: VideoProcessorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'encoding' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [currentFaces, setCurrentFaces] = useState<TrackedFace[]>([]);
  const [faceStates, setFaceStates] = useState<Map<string, boolean>>(new Map()); // id -> censored
  const [previewFaces, setPreviewFaces] = useState<TrackedFace[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const videoUrl = URL.createObjectURL(videoFile);

  const toggleFace = useCallback((id: string) => {
    setFaceStates((prev) => {
      const next = new Map(prev);
      next.set(id, !(prev.get(id) ?? true));
      return next;
    });
  }, []);

  // Live preview detection on the video element while scrubbing
  const handleVideoPlay = useCallback(async () => {
    const video = videoRef.current;
    const canvas = previewCanvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;

    let rafId: number;
    let lastTracked: TrackedFace[] = [];

    const renderFrame = async () => {
      if (video.paused || video.ended) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const dets = await faceapi
          .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.35 }))
          .withFaceLandmarks(true)
          .withFaceDescriptors();

        lastTracked = matchFacesToTracked(dets, lastTracked, Date.now(), config, canvas.width, canvas.height);

        // Apply user's censor state overrides
        for (const face of lastTracked) {
          if (faceStates.has(face.id)) face.censored = faceStates.get(face.id)!;
          if (face.censored) applyCensor(ctx, face.box, config.censorMode, config.blurRadius, config.pixelSize);
        }

        for (const face of lastTracked) {
          drawFaceOverlay(ctx, face.box, face.label ?? face.id, face.censored, false);
        }

        setPreviewFaces([...lastTracked]);
      } catch {}

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    video.onpause = () => cancelAnimationFrame(rafId);
    video.onended = () => cancelAnimationFrame(rafId);
  }, [config, faceStates]);

  const startProcessing = async () => {
    const video = videoRef.current;
    if (!video) return;

    abortRef.current = new AbortController();
    setStatus('processing');
    setProgress(0);

    try {
      const { frames, width, height, fps } = await processVideoFrames(video, {
        config,
        signal: abortRef.current.signal,
        onProgress: (p, faces) => {
          setProgress(p);
          setCurrentFaces(faces);
        },
      });

      setStatus('encoding');
      const blob = await encodeFramesToWebM(frames, width, height, fps, (p) => setProgress(p));
      setStatus('done');
      onComplete(blob);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error(err);
        setStatus('error');
      }
    }
  };

  const cancelProcessing = () => {
    abortRef.current?.abort();
    setStatus('idle');
    setProgress(0);
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full"
          controls
          onPlay={handleVideoPlay}
          style={{ display: status === 'idle' ? 'block' : 'none' }}
        />
        <canvas
          ref={previewCanvasRef}
          className="w-full"
          style={{ display: status === 'idle' ? 'block' : 'none', marginTop: '-4px' }}
        />
        {status !== 'idle' && status !== 'done' && (
          <div className="flex items-center justify-center h-48 flex-col gap-3">
            <div className="text-white text-sm font-medium">
              {status === 'processing' ? `Detecting & censoring faces… ${progress}%` : `Encoding video… ${progress}%`}
            </div>
            <div className="w-64 bg-gray-700 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Face controls */}
      {previewFaces.length > 0 && status === 'idle' && (
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-2 font-medium">DETECTED FACES — click to toggle censoring</p>
          <div className="flex flex-wrap gap-2">
            {previewFaces.map((face) => (
              <button
                key={face.id}
                onClick={() => toggleFace(face.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  (faceStates.get(face.id) ?? face.censored)
                    ? 'bg-red-600 text-white'
                    : 'bg-green-700 text-white'
                }`}
              >
                {face.label ?? face.id} {(faceStates.get(face.id) ?? face.censored) ? '🔴' : '🟢'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {status === 'idle' && (
          <button
            onClick={startProcessing}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
          >
            Process & Censor Video
          </button>
        )}
        {(status === 'processing' || status === 'encoding') && (
          <button
            onClick={cancelProcessing}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
