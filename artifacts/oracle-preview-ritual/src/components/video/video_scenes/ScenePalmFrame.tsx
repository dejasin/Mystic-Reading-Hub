import { motion } from 'framer-motion';

const palmSrc = `${import.meta.env.BASE_URL}images/palm.png`;

export function ScenePalmFrame() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 1.08 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="font-serif text-gold italic"
        style={{
          position: 'absolute',
          top: '12vh',
          fontSize: 'clamp(14px, 2.4vmin, 24px)',
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          opacity: 0.65,
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 0.65, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        — Open the palm —
      </motion.div>

      <motion.div
        className="relative"
        style={{ width: '60vmin', height: '90vmin' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.img
          src={palmSrc}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'contain', opacity: 0.85 }}
          initial={{ filter: 'blur(20px)' }}
          animate={{ filter: 'blur(0px)' }}
          transition={{ duration: 1.4, delay: 0.6 }}
        />

        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 150"
          preserveAspectRatio="xMidYMid meet"
        >
          {[
            { x: 8, y: 8, dx: 8, dy: 0 },
            { x: 8, y: 8, dx: 0, dy: 8 },
            { x: 92, y: 8, dx: -8, dy: 0 },
            { x: 92, y: 8, dx: 0, dy: 8 },
            { x: 8, y: 142, dx: 8, dy: 0 },
            { x: 8, y: 142, dx: 0, dy: -8 },
            { x: 92, y: 142, dx: -8, dy: 0 },
            { x: 92, y: 142, dx: 0, dy: -8 },
          ].map((c, i) => (
            <motion.line
              key={i}
              x1={c.x}
              y1={c.y}
              x2={c.x + c.dx}
              y2={c.y + c.dy}
              stroke="#c9a84c"
              strokeWidth="0.6"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 + i * 0.04 }}
            />
          ))}

          <motion.circle
            cx="50"
            cy="75"
            r="2"
            fill="#e8cc7a"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0.4, 1, 0.4], scale: 1 }}
            transition={{
              opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1.4 },
              scale: { duration: 0.4, delay: 1.4 },
            }}
          />
        </svg>
      </motion.div>

      <motion.div
        className="font-serif text-cream"
        style={{
          position: 'absolute',
          bottom: '10vh',
          fontSize: 'clamp(13px, 2.2vmin, 22px)',
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          opacity: 0.7,
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 0.7, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, delay: 1.6 }}
      >
        Hold steady
      </motion.div>
    </motion.div>
  );
}
