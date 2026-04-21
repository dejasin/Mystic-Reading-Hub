import { useEffect, useState, type ReactNode } from 'react';

const STAGE_W = 1242;
const STAGE_H = 2688;

interface Props {
  children: ReactNode;
  /** When true (default), the stage is letterboxed and scaled-to-fit the viewport for in-browser preview. When false, the stage renders at exactly 1242x2688 with no scaling — use this for screenshot capture. */
  fit?: boolean;
}

export function Stage1242x2688({ children, fit = true }: Props) {
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
        data-capture-stage="1242x2688"
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
