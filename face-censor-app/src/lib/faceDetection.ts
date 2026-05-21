import * as faceapi from 'face-api.js';
import type { TrackedFace, BoundingBox, ProcessingConfig } from '@/types';

let modelsLoaded = false;

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  const MODEL_URL = '/models';
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

export async function detectFacesInImage(
  input: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
  config: ProcessingConfig
): Promise<TrackedFace[]> {
  const detections = await faceapi
    .detectAllFaces(input, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
    .withFaceLandmarks(true)
    .withFaceDescriptors();

  return detections.map((d, i) => {
    const box = expandBox(
      {
        x: d.detection.box.x,
        y: d.detection.box.y,
        width: d.detection.box.width,
        height: d.detection.box.height,
      },
      config.expandFactor,
      input instanceof HTMLImageElement ? input.naturalWidth : input.width,
      input instanceof HTMLImageElement ? input.naturalHeight : input.height
    );

    return {
      id: `face-${i}`,
      box,
      descriptor: d.descriptor,
      censored: true,
      confidence: d.detection.score,
      lastSeen: 0,
      label: `Face ${i + 1}`,
    };
  });
}

export function matchFacesToTracked(
  detections: faceapi.WithFaceDescriptor<
    faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>
  >[],
  tracked: TrackedFace[],
  frameIndex: number,
  config: ProcessingConfig,
  canvasWidth: number,
  canvasHeight: number,
  maxDescriptorDistance = 0.55
): TrackedFace[] {
  const updated: TrackedFace[] = [];
  const usedTrackedIds = new Set<string>();

  for (const det of detections) {
    const box = expandBox(
      {
        x: det.detection.box.x,
        y: det.detection.box.y,
        width: det.detection.box.width,
        height: det.detection.box.height,
      },
      config.expandFactor,
      canvasWidth,
      canvasHeight
    );

    // Try to match by face descriptor first (identity-based tracking)
    let bestMatch: TrackedFace | null = null;
    let bestDistance = maxDescriptorDistance;

    for (const t of tracked) {
      if (usedTrackedIds.has(t.id)) continue;
      if (!t.descriptor || !det.descriptor) continue;
      const dist = faceapi.euclideanDistance(
        Array.from(t.descriptor as Float32Array),
        Array.from(det.descriptor as Float32Array)
      );
      if (dist < bestDistance) {
        bestDistance = dist;
        bestMatch = t;
      }
    }

    // Fallback: IoU-based spatial matching
    if (!bestMatch) {
      let bestIoU = 0.2;
      for (const t of tracked) {
        if (usedTrackedIds.has(t.id)) continue;
        const iou = computeIoU(box, t.box);
        if (iou > bestIoU) {
          bestIoU = iou;
          bestMatch = t;
        }
      }
    }

    if (bestMatch) {
      usedTrackedIds.add(bestMatch.id);
      updated.push({
        ...bestMatch,
        box,
        descriptor: det.descriptor ?? bestMatch.descriptor,
        confidence: det.detection.score,
        lastSeen: frameIndex,
      });
    } else {
      // New face detected
      updated.push({
        id: `face-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        box,
        descriptor: det.descriptor,
        censored: true,
        confidence: det.detection.score,
        lastSeen: frameIndex,
        label: `Face ${tracked.length + updated.length + 1}`,
      });
    }
  }

  // Keep recently-seen faces that weren't re-detected (occlusion tolerance)
  for (const t of tracked) {
    if (!usedTrackedIds.has(t.id) && frameIndex - t.lastSeen < 8) {
      updated.push({ ...t, lastSeen: t.lastSeen });
    }
  }

  return updated;
}

function expandBox(box: BoundingBox, factor: number, imgW: number, imgH: number): BoundingBox {
  const padX = box.width * factor;
  const padY = box.height * factor;
  return {
    x: Math.max(0, box.x - padX),
    y: Math.max(0, box.y - padY),
    width: Math.min(imgW - box.x + padX, box.width + padX * 2),
    height: Math.min(imgH - box.y + padY, box.height + padY * 2),
  };
}

function computeIoU(a: BoundingBox, b: BoundingBox): number {
  const interX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const interY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  const inter = interX * interY;
  const union = a.width * a.height + b.width * b.height - inter;
  return union === 0 ? 0 : inter / union;
}
