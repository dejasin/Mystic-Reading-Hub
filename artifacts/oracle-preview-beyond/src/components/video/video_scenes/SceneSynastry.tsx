import { motion } from 'framer-motion';

export function SceneSynastry() {
  const threads = Array.from({ length: 7 }, (_, i) => i);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96, filter: 'blur(10px)' }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="font-display text-gold"
        style={{
          position: 'absolute',
          top: '14vh',
          fontSize: 'clamp(11px, 1.8vmin, 18px)',
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          opacity: 0.7,
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 0.7, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        Synastry
      </motion.div>

      <div
        className="relative"
        style={{
          width: '90vw',
          height: '60vh',
          maxWidth: '900px',
        }}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <radialGradient id="leftGlow">
              <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#c9a84c" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="rightGlow">
              <stop offset="0%" stopColor="#e8cc7a" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#e8cc7a" stopOpacity="0" />
            </radialGradient>
            <filter id="threadGlow">
              <feGaussianBlur stdDeviation="0.4" />
            </filter>
          </defs>

          <motion.circle
            cx="14"
            cy="50"
            r="14"
            fill="url(#leftGlow)"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.0, delay: 0.4 }}
          />
          <motion.circle
            cx="14"
            cy="50"
            r="6"
            fill="none"
            stroke="#c9a84c"
            strokeWidth="0.4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.0, delay: 0.6 }}
          />
          <motion.circle
            cx="14"
            cy="50"
            r="1.4"
            fill="#e8cc7a"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: 1.2 }}
          />

          <motion.circle
            cx="86"
            cy="50"
            r="14"
            fill="url(#rightGlow)"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.0, delay: 0.6 }}
          />
          <motion.circle
            cx="86"
            cy="50"
            r="6"
            fill="none"
            stroke="#e8cc7a"
            strokeWidth="0.4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.0, delay: 0.8 }}
          />
          <motion.circle
            cx="86"
            cy="50"
            r="1.4"
            fill="#c9a84c"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: 1.4 }}
          />

          {threads.map((i) => {
            const yOffset = (i - 3) * 6;
            const cy = 50 + yOffset;
            const cy2 = 50 - yOffset * 0.6;
            return (
              <motion.path
                key={i}
                d={`M 20 50 Q 50 ${cy}, 80 50 Q 50 ${cy2}, 20 50`}
                stroke={i % 2 === 0 ? '#c9a84c' : '#e8cc7a'}
                strokeWidth="0.25"
                fill="none"
                opacity="0.7"
                filter="url(#threadGlow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 1.6,
                  delay: 1.6 + i * 0.18,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            );
          })}

          <motion.circle
            cx="50"
            cy="50"
            r="3"
            fill="#e8cc7a"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 3.7, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.circle
            cx="50"
            cy="50"
            r="6"
            fill="none"
            stroke="#e8cc7a"
            strokeWidth="0.3"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.5, 2, 3] }}
            transition={{ duration: 1.2, delay: 3.7 }}
          />
        </svg>
      </div>

      <motion.div
        className="absolute font-serif text-gold-light italic"
        style={{
          bottom: '12vh',
          fontSize: 'clamp(15px, 2.8vmin, 28px)',
          letterSpacing: '0.12em',
          textAlign: 'center',
          opacity: 0,
        }}
        animate={{ opacity: 0.9, y: 0 }}
        initial={{ y: 8 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.9, delay: 4.4 }}
      >
        — two threads, one weave —
      </motion.div>
    </motion.div>
  );
}
