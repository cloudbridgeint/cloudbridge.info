/* ============================================================
   ADMIN IMAGE OPTIMISATION

   Images uploaded from the admin are stored base64 in D1 and served
   back untouched — nothing on the server resizes them. A 6MB phone
   photo would therefore be rejected outright (the 1.4MB cap), and even
   a 1MB one would be pushed to every visitor at full resolution.

   So the resizing happens here, in the browser, before the file is
   sent: cap the long edge, re-encode, and step the quality down until
   it fits comfortably under the limit. This is wired by wrapping fetch
   rather than editing each upload form, so the seven existing upload
   points — and any added later — are covered without being touched.
   ============================================================ */
(function () {
  'use strict';

  const MAX_EDGE = 1600;          // plenty for a full-width banner on a 2x screen
  const TARGET_BYTES = 900 * 1024; // comfortably under the 1.4MB server cap
  const MIN_QUALITY = 0.55;

  // Formats the canvas can safely re-encode. SVG is vector (rasterising it
  // would wreck it) and GIF may be animated, so both are passed through.
  const RESIZABLE = new Set(['image/jpeg', 'image/png', 'image/webp']);

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode failed')); };
      img.src = url;
    });
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise(resolve => canvas.toBlob(resolve, type, quality));
  }

  async function optimise(file) {
    if (!file || !RESIZABLE.has(file.type)) return file;

    let img;
    try {
      img = await loadImage(file);
    } catch {
      return file; // unreadable here — let the server decide
    }

    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    // Already small enough in both dimensions and bytes: leave it alone rather
    // than re-encoding and losing quality for nothing.
    if (scale === 1 && file.size <= TARGET_BYTES) return file;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';

    // PNGs with transparency must stay PNG or the background turns black.
    const hasAlpha = file.type === 'image/png' || file.type === 'image/webp';
    const outType = hasAlpha ? 'image/webp' : 'image/jpeg';
    if (!hasAlpha) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
    ctx.drawImage(img, 0, 0, w, h);

    let quality = 0.85;
    let blob = await canvasToBlob(canvas, outType, quality);
    while (blob && blob.size > TARGET_BYTES && quality > MIN_QUALITY) {
      quality -= 0.1;
      blob = await canvasToBlob(canvas, outType, quality);
    }

    // Deciding what to keep. When the image only needed compressing, the
    // re-encode is pointless unless it actually got smaller. When it was too
    // large in dimensions, the smaller canvas is worth keeping even if the
    // bytes happen to grow — a 2400px graphic still costs the visitor 2400px
    // of decoding — unless that would also push it over the target.
    if (!blob) return file;
    const downscaled = scale < 1;
    if (!downscaled && blob.size >= file.size) return file;
    if (downscaled && blob.size >= file.size && blob.size > TARGET_BYTES) return file;

    const ext = outType === 'image/webp' ? '.webp' : '.jpg';
    const base = (file.name || 'image').replace(/\.[^.]+$/, '');
    const out = new File([blob], base + ext, { type: outType });

    console.info(
      `[image] ${file.name}: ${img.naturalWidth}x${img.naturalHeight} ${(file.size / 1024).toFixed(0)}KB` +
      ` -> ${w}x${h} ${(out.size / 1024).toFixed(0)}KB`
    );
    return out;
  }

  // Expose for anything that wants to call it directly.
  window.cbOptimiseImage = optimise;

  // Wrap fetch so every existing and future admin upload is covered without
  // each form having to remember to opt in.
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    try {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const body = init && init.body;
      if (/\/api\/(media|upload)$/.test(url) && body instanceof FormData) {
        const file = body.get('file');
        if (file instanceof File && file.type.startsWith('image/')) {
          const better = await optimise(file);
          if (better !== file) body.set('file', better);
        }
      }
    } catch {
      // never let optimisation stop an upload from being attempted
    }
    return nativeFetch(input, init);
  };
})();
