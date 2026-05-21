'use client';

import { useCallback, useState } from 'react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
}

export default function DropZone({ onFileSelect, accept = 'image/*,video/*', maxSizeMB = 500 }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        setError(`File too large (max ${maxSizeMB}MB)`);
        return;
      }
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) {
        setError('Please select an image or video file');
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect, maxSizeMB]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
        dragging
          ? 'border-red-500 bg-red-500/10'
          : 'border-gray-700 hover:border-gray-500 bg-gray-900/50'
      }`}
    >
      <input
        type="file"
        accept={accept}
        onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="pointer-events-none space-y-3">
        <div className="text-5xl">🛡️</div>
        <div>
          <p className="text-lg font-semibold text-white">Drop your photo or video here</p>
          <p className="text-sm text-gray-400 mt-1">or click to browse · Images &amp; Videos · Up to {maxSizeMB}MB</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {['JPG', 'PNG', 'WEBP', 'GIF', 'MP4', 'MOV', 'WEBM'].map((fmt) => (
            <span key={fmt} className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs">
              {fmt}
            </span>
          ))}
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
