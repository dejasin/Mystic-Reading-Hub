import type { CSSProperties, ReactNode } from 'react';

interface Props {
  width: number;
  children: ReactNode;
  style?: CSSProperties;
}

export function IPhoneFrame({ width, children, style }: Props) {
  const aspect = 19.5 / 9;
  const height = Math.round(width * aspect);
  const radius = Math.round(width * 0.115);
  const bezel = Math.round(width * 0.018);
  const innerRadius = radius - bezel;
  const notchW = Math.round(width * 0.32);
  const notchH = Math.round(width * 0.058);

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: `${radius}px`,
        background:
          'linear-gradient(160deg, #2a2845 0%, #14122a 45%, #0b0b1e 100%)',
        padding: `${bezel}px`,
        boxShadow:
          '0 60px 120px -40px rgba(0,0,0,0.85), 0 0 0 1.5px rgba(201,168,76,0.45), 0 0 60px -10px rgba(201,168,76,0.25)',
        position: 'relative',
        ...style,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: `${innerRadius}px`,
          overflow: 'hidden',
          position: 'relative',
          background: '#04040f',
        }}
      >
        {children}
        <div
          style={{
            position: 'absolute',
            top: `${Math.round(width * 0.022)}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${notchW}px`,
            height: `${notchH}px`,
            background: '#000',
            borderRadius: `${notchH / 2}px`,
            zIndex: 10,
          }}
        />
      </div>
    </div>
  );
}
