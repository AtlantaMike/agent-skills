export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TrackedFace {
  id: string;
  box: BoundingBox;
  descriptor?: Float32Array;
  censored: boolean;
  confidence: number;
  lastSeen: number; // frame index
  label?: string;
}

export interface TrackedObject {
  id: string;
  box: BoundingBox;
  censored: boolean;
  lastSeen: number;
  label: string;
}

export type CensorMode = 'blur' | 'pixelate' | 'black';

export interface ProcessingConfig {
  censorMode: CensorMode;
  blurRadius: number;
  pixelSize: number;
  trackFaces: boolean;
  expandFactor: number; // padding around detected face
}

export interface MetadataConfig {
  stripAll: boolean;
  fakeGPS: boolean;
  fakeDevice: boolean;
  fakeTimestamp: boolean;
  customComment?: string;
}

export interface SocialUploadConfig {
  platform: 'twitter' | 'facebook' | 'instagram' | 'tiktok';
  caption?: string;
  tags?: string[];
}

export type ProcessingStatus = 'idle' | 'loading-models' | 'detecting' | 'processing' | 'complete' | 'error';

export interface VideoFrame {
  index: number;
  timestamp: number;
  faces: TrackedFace[];
}
