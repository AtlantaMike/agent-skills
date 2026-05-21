import type { MetadataConfig } from '@/types';

// Fake camera models for spoofing
const FAKE_DEVICES = [
  { make: 'Samsung', model: 'Galaxy S22', software: 'Android 13' },
  { make: 'Apple', model: 'iPhone 11', software: 'iOS 15.7' },
  { make: 'Google', model: 'Pixel 6', software: 'Android 13' },
  { make: 'OnePlus', model: '10 Pro', software: 'Android 12' },
  { make: 'Xiaomi', model: 'Mi 12', software: 'MIUI 13' },
];

const FAKE_GPS_LOCATIONS = [
  { lat: 48.8566, lng: 2.3522 },   // Paris
  { lat: 35.6762, lng: 139.6503 }, // Tokyo
  { lat: 51.5074, lng: -0.1278 },  // London
  { lat: -33.8688, lng: 151.2093 },// Sydney
  { lat: 40.7128, lng: -74.006 },  // New York
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function gpsToExifRational(deg: number): number[][] {
  const d = Math.abs(deg);
  const degrees = Math.floor(d);
  const minutes = Math.floor((d - degrees) * 60);
  const seconds = Math.round(((d - degrees) * 60 - minutes) * 60 * 100);
  return [[degrees, 1], [minutes, 1], [seconds, 100]];
}

export async function stripImageMetadata(
  file: File,
  config: MetadataConfig
): Promise<Blob> {
  // Load piexifjs dynamically (it's a browser lib)
  const piexif = await import('piexifjs');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dataURL = e.target?.result as string;

        if (!dataURL.startsWith('data:image/jpeg') && !dataURL.startsWith('data:image/jpg')) {
          // For non-JPEG, just convert via canvas (strips all metadata)
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas toBlob failed'));
            }, 'image/png');
          };
          img.src = dataURL;
          return;
        }

        if (config.stripAll) {
          const stripped = piexif.remove(dataURL);
          const blob = dataURLToBlob(stripped);
          resolve(blob);
          return;
        }

        // Selective metadata modification
        const exifData = piexif.load(dataURL);

        // Remove GPS always (biggest privacy risk)
        delete exifData['GPS'];

        if (config.fakeDevice) {
          const device = randomItem(FAKE_DEVICES);
          exifData['0th'] = exifData['0th'] || {};
          exifData['0th'][piexif.ImageIFD.Make] = device.make;
          exifData['0th'][piexif.ImageIFD.Model] = device.model;
          exifData['0th'][piexif.ImageIFD.Software] = device.software;
          // Remove serial numbers and unique IDs (use numeric tag IDs to avoid type issues)
          delete (exifData['0th'] as Record<number, unknown>)[0xa430]; // CameraOwnerName
          if (exifData['Exif']) {
            delete (exifData['Exif'] as Record<number, unknown>)[0xa431]; // BodySerialNumber
            delete (exifData['Exif'] as Record<number, unknown>)[0xa435]; // LensSerialNumber
          }
        }

        if (config.fakeTimestamp) {
          const fakeDate = new Date(
            Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)
          );
          const dateStr = fakeDate.toISOString().replace('T', ' ').slice(0, 19).replace(/-/g, ':');
          exifData['0th'] = exifData['0th'] || {};
          exifData['0th'][piexif.ImageIFD.DateTime] = dateStr;
          exifData['Exif'] = exifData['Exif'] || {};
          exifData['Exif'][piexif.ExifIFD.DateTimeOriginal] = dateStr;
          exifData['Exif'][piexif.ExifIFD.DateTimeDigitized] = dateStr;
        }

        if (config.fakeGPS) {
          const loc = randomItem(FAKE_GPS_LOCATIONS);
          exifData['GPS'] = {
            [piexif.GPSIFD.GPSLatitudeRef]: loc.lat >= 0 ? 'N' : 'S',
            [piexif.GPSIFD.GPSLatitude]: gpsToExifRational(loc.lat),
            [piexif.GPSIFD.GPSLongitudeRef]: loc.lng >= 0 ? 'E' : 'W',
            [piexif.GPSIFD.GPSLongitude]: gpsToExifRational(loc.lng),
          };
        }

        if (config.customComment) {
          exifData['0th'] = exifData['0th'] || {};
          exifData['0th'][piexif.ImageIFD.ImageDescription] = config.customComment;
        }

        const exifStr = piexif.dump(exifData);
        const result = piexif.insert(exifStr, dataURL);
        resolve(dataURLToBlob(result));
      } catch (err) {
        // If EXIF manipulation fails, strip via canvas
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(err);
          }, 'image/jpeg', 0.95);
        };
        img.src = e.target?.result as string;
      }
    };
    reader.readAsDataURL(file);
  });
}

function dataURLToBlob(dataURL: string): Blob {
  const [header, data] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type: mime });
}

export function getMetadataReport(config: MetadataConfig): string[] {
  const actions: string[] = [];
  if (config.stripAll) {
    actions.push('All EXIF/metadata removed');
    return actions;
  }
  actions.push('GPS location removed');
  if (config.fakeDevice) actions.push('Device info spoofed (random device model)');
  if (config.fakeTimestamp) actions.push('Timestamps randomized');
  if (config.fakeGPS) actions.push('GPS replaced with random world city');
  if (config.customComment) actions.push(`Custom description set: "${config.customComment}"`);
  return actions;
}
