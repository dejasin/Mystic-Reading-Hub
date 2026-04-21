import { motion } from 'framer-motion';

const question = 'What weighs on you tonight?';

export function SceneIntake() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-[10vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.05 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
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
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 0.7, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        The Intake
      </motion.div>

      <div
        className="font-serif text-cream italic"
        style={{
          fontSize: 'clamp(28px, 7.6vmin, 76px)',
          lineHeight: 1.2,
          textAlign: 'center',
          letterSpacing: '0.005em',
        }}
      >
        {question.split(' ').map((word, wIdx) => (
          <motion.span
            key={wIdx}
            style={{ display: 'inline-block', marginRight: '0.25em' }}
            initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.9,
              delay: 0.6 + wIdx * 0.18,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        ))}
      </div>

      <motion.div
        className="absolute"
        style={{
          bottom: '22vh',
          width: '50vw',
          height: '1px',
          background:
            'linear-gradient(90deg, transparent, #c9a84c 50%, transparent)',
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.85 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.4, delay: 2.4, ease: [0.16, 1, 0.3, 1] }}
      />

      <motion.div
        className="font-serif text-gold-light italic"
        style={{
          position: 'absolute',
          bottom: '14vh',
          fontSize: 'clamp(13px, 2.2vmin, 22px)',
          letterSpacing: '0.18em',
          opacity: 0.65,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.65 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, delay: 2.8 }}
      >
        listening…
      </motion.div>
    </motion.div>
  );
}
