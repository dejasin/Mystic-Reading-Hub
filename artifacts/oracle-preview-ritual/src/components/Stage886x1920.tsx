import { useEffect, useState, type ReactNode } from 'react';

const STAGE_W = 886;
const STAGE_H = 1920;

interface Props {
  children: ReactNode;
  /** When true (default), the stage is letterboxed and scaled-to-fit the viewport for in-browser preview. When false, the stage renders at exactly 886x1920 with no scaling — use this for screen-recording capture. */
  fit?: boolean;
}

export function Stage886x1920({ children, fit = true }: Props) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!fit) {
      setScale(1);
      return;
    }
    const compute = () => {
      const sx = window.innerWidth / STAGE_W;
      const sy = window.innerHeight / STAGE_H;
      setScale(Math.min(sx, sy));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [fit]);

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
        data-capture-stage="886x1920"
        style={{
          width: `${STAGE_W}px`,
          height: `${STAGE_H}px`,
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
