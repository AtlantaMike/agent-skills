import type { BoundingBox, CensorMode } from '@/types';

export function applyCensor(
  ctx: CanvasRenderingContext2D,
  box: BoundingBox,
  mode: CensorMode,
  blurRadius: number,
  pixelSize: number
): void {
  const { x, y, width, height } = box;
  if (width <= 0 || height <= 0) return;

  const safeX = Math.max(0, Math.round(x));
  const safeY = Math.max(0, Math.round(y));
  const safeW = Math.min(ctx.canvas.width - safeX, Math.round(width));
  const safeH = Math.min(ctx.canvas.height - safeY, Math.round(height));
  if (safeW <= 0 || safeH <= 0) return;

  if (mode === 'black') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(safeX, safeY, safeW, safeH);
    return;
  }

  if (mode === 'blur') {
    ctx.save();
    ctx.filter = `blur(${blurRadius}px)`;
    ctx.drawImage(ctx.canvas, safeX, safeY, safeW, safeH, safeX, safeY, safeW, safeH);
    ctx.restore();
    // Second pass for stronger effect
    ctx.save();
    ctx.filter = `blur(${blurRadius}px)`;
    ctx.drawImage(ctx.canvas, safeX, safeY, safeW, safeH, safeX, safeY, safeW, safeH);
    ctx.restore();
    return;
  }

  if (mode === 'pixelate') {
    const imageData = ctx.getImageData(safeX, safeY, safeW, safeH);
    pixelateImageData(imageData, pixelSize);
    ctx.putImageData(imageData, safeX, safeY);
  }
}

function pixelateImageData(imageData: ImageData, blockSize: number): void {
  const { data, width, height } = imageData;
  const size = Math.max(1, Math.round(blockSize));

  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      const blockW = Math.min(size, width - x);
      const blockH = Math.min(size, height - y);
      let r = 0, g = 0, b = 0, a = 0, count = 0;

      for (let dy = 0; dy < blockH; dy++) {
        for (let dx = 0; dx < blockW; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          a += data[idx + 3];
          count++;
        }
      }

      const ar = Math.round(r / count);
      const ag = Math.round(g / count);
      const ab = Math.round(b / count);
      const aa = Math.round(a / count);

      for (let dy = 0; dy < blockH; dy++) {
        for (let dx = 0; dx < blockW; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          data[idx] = ar;
          data[idx + 1] = ag;
          data[idx + 2] = ab;
          data[idx + 3] = aa;
        }
      }
    }
  }
}

export function drawFaceOverlay(
  ctx: CanvasRenderingContext2D,
  box: BoundingBox,
  label: string,
  censored: boolean,
  isHovered: boolean
): void {
  const color = censored ? '#ef4444' : '#22c55e';
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash(censored ? [] : [6, 3]);
  ctx.strokeRect(box.x, box.y, box.width, box.height);

  // Label background
  const fontSize = Math.max(11, Math.min(14, box.width / 8));
  ctx.font = `bold ${fontSize}px sans-serif`;
  const textW = ctx.measureText(label).width + 8;
  const textH = fontSize + 6;

  ctx.fillStyle = color;
  ctx.fillRect(box.x, box.y - textH, textW, textH);
  ctx.fillStyle = '#fff';
  ctx.fillText(label, box.x + 4, box.y - 4);

  if (isHovered) {
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(box.x, box.y, box.width, box.height);
  }

  ctx.restore();
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality = 0.95): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      type,
      quality
    );
  });
}
