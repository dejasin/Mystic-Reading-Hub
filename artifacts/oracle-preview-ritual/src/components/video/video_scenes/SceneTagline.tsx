import { motion } from 'framer-motion';

const lines = ['Your palm.', 'Read.'];

export function SceneTagline() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-[8vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(12px)', scale: 0.98 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="absolute"
        style={{
          top: '38vh',
          height: '1px',
          background:
            'linear-gradient(90deg, transparent 0%, #c9a84c 50%, transparent 100%)',
        }}
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: '70vw', opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      />

      {lines.map((line, lineIdx) => (
        <div
          key={lineIdx}
          className="font-serif text-cream"
          style={{
            fontSize: 'clamp(40px, 11vmin, 110px)',
            lineHeight: 1.05,
            letterSpacing: '0.01em',
            fontStyle: lineIdx === 1 ? 'italic' : 'normal',
            color: lineIdx === 1 ? '#e8cc7a' : '#f0e6cc',
            textAlign: 'center',
            marginTop: lineIdx === 0 ? '0' : '1vh',
          }}
        >
          {line.split('').map((char, i) => (
            <motion.span
              key={i}
              style={{ display: 'inline-block' }}
              initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10 }}
              transition={{
                duration: 0.7,
                delay: 0.6 + lineIdx * 0.7 + i * 0.04,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </div>
      ))}
    </motion.div>
  );
}
