'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { applyCensor, drawFaceOverlay } from '@/lib/censoring';
import type { TrackedFace, ProcessingConfig } from '@/types';

interface FaceCanvasProps {
  imageData: HTMLImageElement | null;
  faces: TrackedFace[];
  config: ProcessingConfig;
  onFaceToggle: (id: string) => void;
  onFacesUpdate: (faces: TrackedFace[]) => void;
  showOverlay: boolean;
}

export default function FaceCanvas({
  imageData,
  faces,
  config,
  onFaceToggle,
  onFacesUpdate,
  showOverlay,
}: FaceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [hoveredFace, setHoveredFace] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  const renderImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;
    const ctx = canvas.getContext('2d')!;

    canvas.width = imageData.naturalWidth;
    canvas.height = imageData.naturalHeight;
    ctx.drawImage(imageData, 0, 0);

    for (const face of faces) {
      if (face.censored) {
        applyCensor(ctx, face.box, config.censorMode, config.blurRadius, config.pixelSize);
      }
    }
  }, [imageData, faces, config]);

  const renderOverlay = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas || !imageData) return;
    const ctx = canvas.getContext('2d')!;

    canvas.width = imageData.naturalWidth;
    canvas.height = imageData.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showOverlay) return;

    for (const face of faces) {
      drawFaceOverlay(ctx, face.box, face.label ?? face.id, face.censored, hoveredFace === face.id);
    }
  }, [imageData, faces, hoveredFace, showOverlay]);

  useEffect(() => {
    renderImage();
  }, [renderImage]);

  useEffect(() => {
    renderOverlay();
  }, [renderOverlay]);

  // Compute display scale when container resizes
  useEffect(() => {
    if (!imageData || !canvasRef.current) return;
    const parent = canvasRef.current.parentElement;
    if (!parent) return;
    const obs = new ResizeObserver(() => {
      const s = Math.min(
        parent.clientWidth / imageData.naturalWidth,
        parent.clientHeight / imageData.naturalHeight,
        1
      );
      setScale(s);
    });
    obs.observe(parent);
    return () => obs.disconnect();
  }, [imageData]);

  const toImageCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = overlayRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = toImageCoords(e);
    for (const face of faces) {
      const { box } = face;
      if (x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height) {
        onFaceToggle(face.id);
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = toImageCoords(e);
    let found: string | null = null;
    for (const face of faces) {
      const { box } = face;
      if (x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height) {
        found = face.id;
        break;
      }
    }
    setHoveredFace(found);
  };

  if (!imageData) return null;

  return (
    <div className="relative" style={{ display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      />
      <canvas
        ref={overlayRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredFace(null)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          cursor: hoveredFace ? 'pointer' : 'default',
        }}
      />
    </div>
  );
}
