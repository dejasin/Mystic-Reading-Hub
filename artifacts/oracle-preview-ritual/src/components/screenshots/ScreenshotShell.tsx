import type { ReactNode } from 'react';
import { StarField } from '@/components/video/video_scenes/StarField';
import { IPhoneFrame } from './IPhoneFrame';

interface Props {
  index: number;
  eyebrow: string;
  headline: ReactNode;
  subhead: ReactNode;
  children: ReactNode;
  /** width of the iPhone frame in stage px (default 880) */
  frameWidth?: number;
  /** override headline font size (default 92) */
  headlineSize?: number;
}

export function ScreenshotShell({
  index,
  eyebrow,
  headline,
  subhead,
  children,
  frameWidth = 880,
  headlineSize = 92,
}: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#04040f',
        overflow: 'hidden',
      }}
    >
      <StarField />

      {/* Soft gold halo behind the device */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '62%',
          transform: 'translate(-50%, -50%)',
          width: '1100px',
          height: '1100px',
          background:
            'radial-gradient(circle, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0.06) 40%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top brand wordmark */}
      <div
        style={{
          position: 'absolute',
          top: '110px',
          left: 0,
          right: 0,
          textAlign: 'center',
          color: '#c9a84c',
          fontFamily:
            '"Cinzel Decorative", "CormorantGaramond", serif',
          fontSize: '26px',
          letterSpacing: '0.55em',
          opacity: 0.7,
        }}
      >
        ✦  THE  ORACLE  ✦
      </div>

      {/* Eyebrow + headline + subhead */}
      <div
        style={{
          position: 'absolute',
          top: '200px',
          left: '80px',
          right: '80px',
          textAlign: 'center',
          color: '#f0e6cc',
        }}
      >
        <div
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '24px',
            letterSpacing: '0.45em',
            color: '#c9a84c',
            opacity: 0.8,
            textTransform: 'uppercase',
            marginBottom: '36px',
          }}
        >
          {String(index).padStart(2, '0')} · {eyebrow}
        </div>
        <div
          style={{
            fontFamily:
              '"Cinzel Decorative", "Cormorant Garamond", serif',
            fontSize: `${headlineSize}px`,
            letterSpacing: '0.02em',
            lineHeight: 1.04,
            fontWeight: 500,
            color: '#f0e6cc',
            textShadow: '0 0 40px rgba(201,168,76,0.35)',
            margin: 0,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            marginTop: '34px',
            fontFamily: '"EB Garamond", "Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: '40px',
            lineHeight: 1.4,
            color: '#e8cc7a',
            opacity: 0.85,
          }}
        >
          {subhead}
        </div>
      </div>

      {/* Device frame */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '120px',
          transform: 'translateX(-50%)',
        }}
      >
        <IPhoneFrame width={frameWidth}>{children}</IPhoneFrame>
      </div>

      {/* Bottom vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(4,4,15,0) 40%, rgba(4,4,15,0.85) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
