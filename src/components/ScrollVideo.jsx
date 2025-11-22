import React, { useEffect, useMemo, useRef, useState } from "react";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function useDevicePixelRatio() {
  const [dpr, setDpr] = useState(Math.min(window.devicePixelRatio || 1, 2));
  useEffect(() => {
    const onChange = () => setDpr(Math.min(window.devicePixelRatio || 1, 2));
    window.addEventListener("resize", onChange);
    return () => window.removeEventListener("resize", onChange);
  }, []);
  return dpr;
}

// Preload image URLs into HTMLImageElements
function usePreloadedImages(urls = []) {
  const [images, setImages] = useState([]);
  useEffect(() => {
    if (!urls || urls.length === 0) return;
    let isMounted = true;
    const loaders = urls.map(
      (src) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        })
    );
    Promise.all(loaders)
      .then((imgs) => {
        if (isMounted) setImages(imgs);
      })
      .catch(() => {
        if (isMounted) setImages([]);
      });
    return () => {
      isMounted = false;
    };
  }, [urls]);
  return images;
}

// Default procedural frame renderer if no frames provided
function defaultRenderFrame(ctx, frameIndex, totalFrames, w, h) {
  const t = frameIndex / Math.max(1, totalFrames - 1);

  // Background gradient
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, `hsl(${200 + 60 * t}, 70%, 8%)`);
  g.addColorStop(1, `hsl(${260 + 60 * t}, 90%, 12%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Moving glow circle
  const cx = w * (0.2 + 0.6 * t);
  const cy = h * (0.5 + 0.2 * Math.sin(t * Math.PI * 2));
  const radius = Math.min(w, h) * (0.12 + 0.08 * Math.cos(t * Math.PI * 2));

  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2.2);
  glow.addColorStop(0, "rgba(59,130,246,0.7)");
  glow.addColorStop(1, "rgba(59,130,246,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Rotating card
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate((t * Math.PI * 2) / 6);
  const cardW = Math.min(w, h) * 0.45;
  const cardH = cardW * 0.6;
  ctx.fillStyle = "rgba(15,23,42,0.6)";
  ctx.strokeStyle = "rgba(59,130,246,0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Text
  ctx.fillStyle = "rgba(203,213,225,0.9)";
  ctx.font = `${Math.floor(h * 0.035)}px Inter, ui-sans-serif, system-ui`;
  ctx.textAlign = "center";
  ctx.fillText("Scroll to scrub the animation", w / 2, h * 0.12);
  ctx.font = `${Math.floor(h * 0.028)}px Inter, ui-sans-serif, system-ui`;
  ctx.fillStyle = "rgba(148,163,184,0.9)";
  ctx.fillText(`Frame ${frameIndex + 1} / ${totalFrames}`, w / 2, h * 0.18);
}

export default function ScrollVideo({
  heightVh = 300, // scroll range height
  totalFrames = 180,
  imageUrls = null, // optional array of frame URLs
  renderFrame = null, // optional custom canvas renderer
  className = "",
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const dpr = useDevicePixelRatio();
  const images = usePreloadedImages(imageUrls || []);

  const effectiveTotal = imageUrls ? images.length || totalFrames : totalFrames;

  // Set canvas size to viewport
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  // Draw a specific frame index
  const drawFrame = (index) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    if (images && images.length > 0) {
      const safeIndex = clamp(index, 0, images.length - 1);
      const img = images[safeIndex];
      // cover fit
      const imgRatio = img.width / img.height;
      const canvasRatio = w / h;
      let dw, dh, dx, dy;
      if (imgRatio > canvasRatio) {
        dh = h;
        dw = dh * imgRatio;
        dx = (w - dw) / 2;
        dy = 0;
      } else {
        dw = w;
        dh = dw / imgRatio;
        dx = 0;
        dy = (h - dh) / 2;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      const safeIndex = clamp(index, 0, effectiveTotal - 1);
      const renderer = renderFrame || ((c, i, tot, ww, hh) => defaultRenderFrame(c, i, tot, ww, hh));
      renderer(ctx, safeIndex, effectiveTotal, w, h);
    }
  };

  useEffect(() => {
    resizeCanvas();
    drawFrame(0);
    let raf = 0;

    const getSectionTop = () => {
      const el = containerRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      return rect.top + window.scrollY;
    };

    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const sectionTop = getSectionTop();
      const sectionHeight = el.offsetHeight - window.innerHeight;
      const raw = (window.scrollY - sectionTop) / Math.max(1, sectionHeight);
      const progress = clamp(raw, 0, 1);
      const targetFrame = Math.round(progress * (effectiveTotal - 1));

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => drawFrame(targetFrame));
    };

    const onResize = () => {
      resizeCanvas();
      onScroll();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dpr, images, effectiveTotal]);

  // Draw first frame when images change
  useEffect(() => {
    drawFrame(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  return (
    <section
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ height: `${heightVh}vh` }}
    >
      <div className="sticky top-0 h-screen w-full">
        <canvas ref={canvasRef} className="block w-full h-full" />
      </div>
    </section>
  );
}
