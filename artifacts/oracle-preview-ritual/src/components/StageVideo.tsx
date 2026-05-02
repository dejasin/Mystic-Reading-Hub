import { useEffect, useState, type ReactNode } from 'react';

interface Props {
  width: number;
  height: number;
  children: ReactNode;
  /** When true (default), the stage is letterboxed and scaled-to-fit the viewport for in-browser preview. When false, the stage renders at exact pixel dimensions with no scaling — use this for screen-recording capture. */
  fit?: boolean;
}

/**
 * Generic fixed-pixel stage for App Store preview videos.
 *
 * Renders its children at exactly `width × height` pixels. The stage is the
 * "capture region" — recordings should grab exactly this rectangle.
 *
 * The dimensions emit on `data-capture-stage="${width}x${height}"` so external
 * recorders (and the bundled puppeteer script) can wait for the right canvas
 * before they start the screencast.
 */
export function StageVideo({ width, height, children, fit = true }: Props) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!fit) {
      setScale(1);
      return;
    }
    const compute = () => {
      const sx = window.innerWidth / width;
      const sy = window.innerHeight / height;
      setScale(Math.min(sx, sy));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [fit, width, height]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        data-capture-stage={`${width}x${height}`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: fit ? `scale(${scale})` : 'none',
          transformOrigin: 'center center',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
