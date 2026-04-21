import { motion } from 'framer-motion';

interface Props {
  width?: string;
  delay?: number;
  duration?: number;
}

export function GoldDivider({ width = '60vw', delay = 0, duration = 0.9 }: Props) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width, height: 'clamp(8px, 1.4vmin, 14px)' }}
    >
      <motion.div
        className="absolute"
        style={{
          height: '1px',
          left: '50%',
          background:
            'linear-gradient(90deg, transparent 0%, #c9a84c 50%, transparent 100%)',
          transform: 'translateX(-50%)',
        }}
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: '100%', opacity: 0.85 }}
        exit={{ opacity: 0 }}
        transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className="absolute"
        style={{
          width: '5px',
          height: '5px',
          background: '#e8cc7a',
          borderRadius: '50%',
          boxShadow: '0 0 8px rgba(201,168,76,0.7)',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, delay: delay + duration * 0.6 }}
      />
    </div>
  );
}
