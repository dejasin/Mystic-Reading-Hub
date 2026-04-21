import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Star {
  x: number;
  y: number;
  r: number;
  o: number;
  d: number;
  delay: number;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function StarField() {
  const stars = useMemo<Star[]>(() => {
    const rand = seededRandom(42);
    return Array.from({ length: 110 }).map(() => ({
      x: rand() * 100,
      y: rand() * 100,
      r: rand() * 1.4 + 0.3,
      o: rand() * 0.6 + 0.2,
      d: 2 + rand() * 4,
      delay: rand() * 3,
    }));
  }, []);

  const goldDust = useMemo<Star[]>(() => {
    const rand = seededRandom(7);
    return Array.from({ length: 24 }).map(() => ({
      x: rand() * 100,
      y: rand() * 100,
      r: rand() * 2.2 + 0.8,
      o: rand() * 0.35 + 0.15,
      d: 4 + rand() * 5,
      delay: rand() * 4,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, #14122a 0%, #0b0b1e 40%, #04040f 80%)',
        }}
      />

      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {stars.map((s, i) => (
          <motion.circle
            key={`s${i}`}
            cx={s.x}
            cy={s.y}
            r={s.r * 0.18}
            fill="#f0e6cc"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, s.o, s.o * 0.4, s.o] }}
            transition={{
              duration: s.d,
              delay: s.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
        {goldDust.map((s, i) => (
          <motion.circle
            key={`g${i}`}
            cx={s.x}
            cy={s.y}
            r={s.r * 0.18}
            fill="#c9a84c"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, s.o, 0],
              cx: [s.x, s.x + (i % 2 === 0 ? 1.5 : -1.5)],
            }}
            transition={{
              duration: s.d * 1.4,
              delay: s.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(4,4,15,0) 0%, rgba(4,4,15,0.6) 70%, rgba(4,4,15,0.95) 100%)',
        }}
      />
    </div>
  );
}
