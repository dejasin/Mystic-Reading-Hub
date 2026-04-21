import { motion } from 'framer-motion';

interface SigilProps {
  size?: number | string;
  draw?: boolean;
  pulse?: boolean;
  delay?: number;
}

export function Sigil({ size = '40vmin', draw = true, pulse = true, delay = 0 }: SigilProps) {
  const drawTransition = (d: number) => ({
    duration: 1.6,
    delay: delay + d,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  });

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      style={{ filter: 'drop-shadow(0 0 16px rgba(201,168,76,0.35))' }}
      animate={
        pulse
          ? { opacity: [0.85, 1, 0.85] }
          : undefined
      }
      transition={
        pulse
          ? { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: delay + 1.5 }
          : undefined
      }
    >
      <motion.circle
        cx="100"
        cy="100"
        r="80"
        stroke="#c9a84c"
        strokeWidth="0.6"
        initial={draw ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 0.9 }}
        transition={drawTransition(0)}
      />
      <motion.circle
        cx="100"
        cy="100"
        r="64"
        stroke="#c9a84c"
        strokeWidth="0.4"
        initial={draw ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 0.7 }}
        transition={drawTransition(0.2)}
      />
      <motion.circle
        cx="100"
        cy="100"
        r="32"
        stroke="#e8cc7a"
        strokeWidth="0.5"
        initial={draw ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 0.85 }}
        transition={drawTransition(0.5)}
      />
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <motion.line
          key={`spoke-${i}`}
          x1="100"
          y1="100"
          x2={100 + 80 * Math.cos((angle * Math.PI) / 180)}
          y2={100 + 80 * Math.sin((angle * Math.PI) / 180)}
          stroke="#c9a84c"
          strokeWidth="0.35"
          initial={draw ? { pathLength: 0, opacity: 0 } : false}
          animate={{ pathLength: 1, opacity: 0.55 }}
          transition={drawTransition(0.6 + i * 0.08)}
        />
      ))}
      <motion.path
        d="M100 35 L120 100 L100 165 L80 100 Z"
        stroke="#e8cc7a"
        strokeWidth="0.55"
        fill="none"
        initial={draw ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 0.85 }}
        transition={drawTransition(1.0)}
      />
      <motion.path
        d="M35 100 L100 80 L165 100 L100 120 Z"
        stroke="#c9a84c"
        strokeWidth="0.45"
        fill="none"
        initial={draw ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 0.75 }}
        transition={drawTransition(1.15)}
      />
      <motion.circle
        cx="100"
        cy="100"
        r="3"
        fill="#e8cc7a"
        initial={draw ? { opacity: 0, scale: 0 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: delay + 1.4 }}
      />
      {[0, 90, 180, 270].map((angle, i) => (
        <motion.circle
          key={`star-${i}`}
          cx={100 + 80 * Math.cos((angle * Math.PI) / 180)}
          cy={100 + 80 * Math.sin((angle * Math.PI) / 180)}
          r="1.4"
          fill="#e8cc7a"
          initial={draw ? { opacity: 0 } : false}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 2.2,
            delay: delay + 1.5 + i * 0.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.svg>
  );
}
