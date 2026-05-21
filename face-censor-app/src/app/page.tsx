'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { loadModels, detectFacesInImage } from '@/lib/faceDetection';
import { applyCensor, canvasToBlob } from '@/lib/censoring';
import { stripImageMetadata, getMetadataReport } from '@/lib/metadata';
import DropZone from '@/components/DropZone';
import SettingsPanel from '@/components/SettingsPanel';
import SocialMediaUpload from '@/components/SocialMediaUpload';
import type { TrackedFace, ProcessingConfig, MetadataConfig, ProcessingStatus } from '@/types';

const FaceCanvas = dynamic(() => import('@/components/FaceCanvas'), { ssr: false });
const VideoProcessor = dynamic(() => import('@/components/VideoProcessor'), { ssr: false });

const DEFAULT_CONFIG: ProcessingConfig = {
  censorMode: 'blur',
  blurRadius: 30,
  pixelSize: 16,
  trackFaces: true,
  expandFactor: 0.2,
};

const DEFAULT_META: MetadataConfig = {
  stripAll: true,
  fakeGPS: false,
  fakeDevice: false,
  fakeTimestamp: false,
};

type AppMode = 'image' | 'video';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<AppMode>('image');
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [faces, setFaces] = useState<TrackedFace[]>([]);
  const [config, setConfig] = useState<ProcessingConfig>(DEFAULT_CONFIG);
  const [metaConfig, setMetaConfig] = useState<MetadataConfig>(DEFAULT_META);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [metaReport, setMetaReport] = useState<string[]>([]);

  // Load models once on mount
  useEffect(() => {
    setStatus('loading-models');
    loadModels()
      .then(() => setStatus('idle'))
      .catch((e) => {
        console.error('Model load error:', e);
        setErrorMsg('Failed to load face detection models. Please refresh.');
        setStatus('error');
      });
  }, []);

  const handleFileSelect = useCallback(
    async (selected: File) => {
      setFile(selected);
      setProcessedBlob(null);
      setFaces([]);
      setErrorMsg(null);

      const isVideo = selected.type.startsWith('video/');
      setMode(isVideo ? 'video' : 'image');

      if (!isVideo) {
        setStatus('detecting');
        const url = URL.createObjectURL(selected);
        const img = new Image();
        img.onload = async () => {
          try {
            const detected = await detectFacesInImage(img, config);
            setFaces(detected);
            setImageEl(img);
            setStatus('idle');
          } catch (e) {
            console.error(e);
            setImageEl(img);
            setStatus('idle');
          }
        };
        img.onerror = () => setStatus('idle');
        img.src = url;
      }
    },
    [config]
  );

  const toggleFace = useCallback((id: string) => {
    setFaces((prev) => prev.map((f) => (f.id === id ? { ...f, censored: !f.censored } : f)));
  }, []);

  const censorAll = () => setFaces((prev) => prev.map((f) => ({ ...f, censored: true })));
  const uncensorAll = () => setFaces((prev) => prev.map((f) => ({ ...f, censored: false })));

  const processImage = useCallback(async () => {
    if (!imageEl || !file) return;
    setStatus('processing');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = imageEl.naturalWidth;
      canvas.height = imageEl.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(imageEl, 0, 0);

      for (const face of faces) {
        if (face.censored) {
          applyCensor(ctx, face.box, config.censorMode, config.blurRadius, config.pixelSize);
        }
      }

      const rawBlob = await canvasToBlob(canvas, 'image/jpeg', 0.95);
      const rawFile = new File([rawBlob], file.name, { type: 'image/jpeg' });

      const cleanBlob = await stripImageMetadata(rawFile, metaConfig);
      const report = getMetadataReport(metaConfig);

      setProcessedBlob(cleanBlob);
      setMetaReport(report);
      setStatus('complete');
    } catch (e) {
      console.error(e);
      setErrorMsg('Processing failed. Please try again.');
      setStatus('error');
    }
  }, [imageEl, file, faces, config, metaConfig]);

  const reset = () => {
    setFile(null);
    setFaces([]);
    setProcessedBlob(null);
    setImageEl(null);
    setStatus('idle');
    setErrorMsg(null);
    setMetaReport([]);
  };

  const outputFileName = file
    ? `privacy-${file.name.replace(/\.[^.]+$/, '')}.${mode === 'video' ? 'webm' : 'jpg'}`
    : 'protected.jpg';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <h1 className="text-lg font-bold leading-tight">FaceShield</h1>
              <p className="text-xs text-gray-400">Privacy-first face censoring</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status === 'loading-models' && (
              <span className="text-xs text-yellow-400 animate-pulse">Loading AI models…</span>
            )}
            {file && (
              <button
                onClick={reset}
                className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
              >
                New File
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!file ? (
          /* Upload Screen */
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Protect Your Privacy</h2>
              <p className="text-gray-400">
                Automatically detect &amp; censor faces · Strip metadata · Upload anonymously
              </p>
            </div>
            <DropZone onFileSelect={handleFileSelect} />
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              {[
                { icon: '🎯', title: 'Auto Face Detection', desc: 'AI detects all faces instantly' },
                { icon: '🔒', title: 'Metadata Stripped', desc: 'GPS, device info, timestamps removed' },
                { icon: '📱', title: 'Social Ready', desc: 'Share directly to any platform' },
              ].map((f) => (
                <div key={f.title} className="bg-gray-900 rounded-xl p-4 space-y-1">
                  <div className="text-2xl">{f.icon}</div>
                  <div className="font-semibold text-white">{f.title}</div>
                  <div className="text-xs text-gray-400">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Processing Screen */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main canvas / video area */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gray-900 rounded-2xl overflow-hidden p-4">
                {mode === 'image' && (
                  <>
                    {status === 'detecting' && (
                      <div className="flex items-center justify-center h-64 text-gray-400">
                        <div className="text-center space-y-2">
                          <div className="text-3xl animate-spin">🔍</div>
                          <p>Detecting faces…</p>
                        </div>
                      </div>
                    )}

                    {imageEl && status !== 'detecting' && (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-medium text-gray-300">
                            {faces.length} face{faces.length !== 1 ? 's' : ''} detected
                          </div>
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showOverlay}
                              onChange={(e) => setShowOverlay(e.target.checked)}
                              className="accent-red-500"
                            />
                            Show labels
                          </label>
                        </div>

                        <div className="rounded-xl overflow-hidden bg-black flex justify-center">
                          <FaceCanvas
                            imageData={imageEl}
                            faces={faces}
                            config={config}
                            onFaceToggle={toggleFace}
                            onFacesUpdate={setFaces}
                            showOverlay={showOverlay}
                          />
                        </div>

                        {faces.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {faces.map((face) => (
                              <button
                                key={face.id}
                                onClick={() => toggleFace(face.id)}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                  face.censored
                                    ? 'bg-red-600/80 text-white border border-red-500'
                                    : 'bg-gray-700 text-gray-200 border border-gray-600'
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${face.censored ? 'bg-red-300' : 'bg-green-400'}`} />
                                {face.label ?? face.id}
                                <span className="ml-1 opacity-70">{face.censored ? 'censored' : 'visible'}</span>
                              </button>
                            ))}
                            <button onClick={censorAll} className="px-3 py-1 rounded-full text-xs bg-gray-800 text-gray-300 border border-gray-700 hover:border-red-600">
                              Censor All
                            </button>
                            <button onClick={uncensorAll} className="px-3 py-1 rounded-full text-xs bg-gray-800 text-gray-300 border border-gray-700 hover:border-green-600">
                              Show All
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {mode === 'video' && file && (
                  <VideoProcessor
                    videoFile={file}
                    config={config}
                    onComplete={(blob) => {
                      setProcessedBlob(blob);
                      setStatus('complete');
                    }}
                  />
                )}
              </div>

              {/* Action button for image */}
              {mode === 'image' && imageEl && status !== 'detecting' && !processedBlob && (
                <button
                  onClick={processImage}
                  disabled={status === 'processing'}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-colors text-lg"
                >
                  {status === 'processing' ? 'Processing…' : 'Apply Privacy Protection'}
                </button>
              )}

              {/* Result / share section */}
              {processedBlob && (
                <div className="bg-gray-900 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-xl">✓</span>
                    <h2 className="font-bold text-white">Privacy Protection Applied</h2>
                  </div>

                  {metaReport.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-3 space-y-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase">Metadata actions</p>
                      {metaReport.map((r) => (
                        <p key={r} className="text-xs text-green-400 flex items-center gap-1.5">
                          <span>✓</span> {r}
                        </p>
                      ))}
                    </div>
                  )}

                  <SocialMediaUpload
                    mediaBlob={processedBlob}
                    mediaType={mode}
                    fileName={outputFileName}
                  />
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Settings sidebar */}
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-2xl p-4">
                <h2 className="font-semibold text-white mb-4">Settings</h2>
                <SettingsPanel
                  config={config}
                  metaConfig={metaConfig}
                  onConfigChange={setConfig}
                  onMetaChange={setMetaConfig}
                />
              </div>

              <div className="bg-gray-900 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">File Info</h3>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>File</span>
                    <span className="text-white truncate max-w-32">{file?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type</span>
                    <span className="text-white capitalize">{mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size</span>
                    <span className="text-white">
                      {file ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : '-'}
                    </span>
                  </div>
                  {imageEl && (
                    <div className="flex justify-between">
                      <span>Resolution</span>
                      <span className="text-white">
                        {imageEl.naturalWidth} × {imageEl.naturalHeight}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
