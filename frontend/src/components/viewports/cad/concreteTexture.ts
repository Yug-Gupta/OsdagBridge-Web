import * as THREE from 'three';

let cachedConcreteTexture: THREE.CanvasTexture | null = null;

export function getConcreteTexture(): THREE.CanvasTexture {
  if (cachedConcreteTexture) return cachedConcreteTexture;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Base concrete grey
    ctx.fillStyle = '#b6b9bd';
    ctx.fillRect(0, 0, size, size);

    // Generate concrete speckles and texture
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;

    // Pseudo-random noise for subtle concrete aggregate variation
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 32;
      const fineNoise = (Math.random() - 0.5) * 16;
      const total = noise + fineNoise;

      data[i] = Math.min(255, Math.max(0, 182 + total));     // R
      data[i + 1] = Math.min(255, Math.max(0, 185 + total)); // G
      data[i + 2] = Math.min(255, Math.max(0, 189 + total)); // B
      data[i + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);

    // Add subtle fine aggregates
    ctx.fillStyle = 'rgba(70, 75, 80, 0.12)';
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 1.5 + 0.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add subtle light flecks
    ctx.fillStyle = 'rgba(235, 238, 242, 0.2)';
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 1.2 + 0.4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 16);
  texture.needsUpdate = true;

  cachedConcreteTexture = texture;
  return texture;
}
