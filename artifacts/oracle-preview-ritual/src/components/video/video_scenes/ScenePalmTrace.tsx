import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const palmSrc = `${import.meta.env.BASE_URL}images/palm.png`;

const lines = [
  {
    name: 'Heart',
    d: 'M 22 52 C 35 46, 55 44, 78 50',
    delay: 0.2,
  },
  {
    name: 'Head',
    d: 'M 24 64 C 38 62, 58 64, 80 68',
    delay: 1.4,
  },
  {
    name: 'Life',
    d: 'M 30 50 C 26 70, 32 96, 44 118',
    delay: 2.6,
  },
  {
    name: 'Fate',
    d: 'M 56 122 C 54 100, 52 80, 56 58',
    delay: 3.8,
  },
];

export function ScenePalmTrace() {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  useEffect(() => {
    const timers = lines.map((l, i) =>
      setTimeout(() => setActiveLabel(l.name), (l.delay + 0.4) * 1000),
    );
    const clear = setTimeout(() => setActiveLabel(null), 5800);
    return () => {
      timers.forEach((t) => clearTimeout(t));
      clearTimeout(clear);
    };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96, filter: 'blur(10px)' }}
      transition={{ duration: 0.8 }}
    >
      <div
        className="relative"
        style={{ width: '70vmin', height: '105vmin' }}
      >
        <img
          src={palmSrc}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'contain', opacity: 0.4 }}
        />

        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 150"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {lines.map((l, i) => (
            <g key={l.name}>
              <motion.path
                d={l.d}
                stroke="#c9a84c"
                strokeWidth="0.55"
                fill="none"
                strokeLinecap="round"
                filter="url(#goldGlow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.95 }}
                transition={{
                  pathLength: { duration: 1.0, delay: l.delay, ease: [0.22, 1, 0.36, 1] },
                  opacity: { duration: 0.4, delay: l.delay },
                }}
              />
              <motion.path
                d={l.d}
                stroke="#e8cc7a"
                strokeWidth="0.25"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  pathLength: { duration: 1.0, delay: l.delay, ease: [0.22, 1, 0.36, 1] },
                  opacity: { duration: 0.4, delay: l.delay + 0.2 },
                }}
              />
            </g>
          ))}
        </svg>

        <motion.div
          className="absolute font-serif text-gold-light italic"
          style={{
            top: '4vh',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 'clamp(18px, 3.6vmin, 36px)',
            letterSpacing: '0.18em',
          }}
          key={activeLabel ?? 'none'}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: activeLabel ? 1 : 0, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {activeLabel ? `The ${activeLabel} Line` : ''}
        </motion.div>
      </div>
    </motion.div>
  );
}
