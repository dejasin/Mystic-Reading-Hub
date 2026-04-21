import { motion } from 'framer-motion';
import { Sigil } from './Sigil';

export function SceneClose() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.04 }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginTop: '-4vh' }}
      >
        <Sigil size="32vmin" draw={false} />
      </motion.div>

      <motion.div
        className="font-display text-cream"
        style={{
          marginTop: '5vh',
          fontSize: 'clamp(36px, 9vmin, 84px)',
          letterSpacing: '0.18em',
          textShadow: '0 0 22px rgba(201,168,76,0.45)',
        }}
        initial={{ opacity: 0, y: 16, letterSpacing: '0.4em' }}
        animate={{ opacity: 1, y: 0, letterSpacing: '0.18em' }}
        transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        Begin.
      </motion.div>

      <motion.div
        className="font-serif text-gold italic"
        style={{
          marginTop: '4vh',
          fontSize: 'clamp(13px, 2.2vmin, 22px)',
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          opacity: 0.7,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ duration: 1, delay: 1.4 }}
      >
        The Oracle
      </motion.div>
    </motion.div>
  );
}
