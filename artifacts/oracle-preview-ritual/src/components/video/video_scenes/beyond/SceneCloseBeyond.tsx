import { motion } from 'framer-motion';
import { Sigil } from '../Sigil';

export function SceneCloseBeyond() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.04 }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginTop: '-4vh' }}
      >
        <Sigil size="36vmin" draw={false} pulse />
      </motion.div>

      <motion.div
        className="font-display text-cream"
        style={{
          marginTop: '6vh',
          fontSize: 'clamp(28px, 7vmin, 64px)',
          letterSpacing: '0.32em',
          textShadow: '0 0 22px rgba(201,168,76,0.4)',
        }}
        initial={{ opacity: 0, y: 16, letterSpacing: '0.55em' }}
        animate={{ opacity: 1, y: 0, letterSpacing: '0.32em' }}
        transition={{ duration: 1.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        THE&nbsp;ORACLE
      </motion.div>

      <motion.div
        className="font-serif text-gold-light italic"
        style={{
          marginTop: '3vh',
          fontSize: 'clamp(13px, 2.2vmin, 22px)',
          letterSpacing: '0.18em',
          opacity: 0.75,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.75 }}
        transition={{ duration: 1, delay: 1.6 }}
      >
        — kept close, returned to —
      </motion.div>
    </motion.div>
  );
}
