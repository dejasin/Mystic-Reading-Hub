import { motion } from 'framer-motion';
import { Sigil } from '../Sigil';

export function SceneSigil() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, filter: 'blur(20px)', scale: 1.05 }}
      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(14px)', scale: 0.97 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div style={{ marginTop: '-6vh' }}>
        <Sigil size="50vmin" />
      </div>

      <motion.div
        className="font-display text-cream"
        style={{
          marginTop: '6vh',
          fontSize: 'clamp(28px, 7vmin, 64px)',
          letterSpacing: '0.32em',
          textShadow: '0 0 24px rgba(201,168,76,0.3)',
        }}
        initial={{ opacity: 0, y: 30, letterSpacing: '0.55em' }}
        animate={{ opacity: 1, y: 0, letterSpacing: '0.32em' }}
        transition={{ duration: 1.4, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        THE&nbsp;ORACLE
      </motion.div>

      <motion.div
        className="font-serif text-gold-light italic"
        style={{
          marginTop: '2vh',
          fontSize: 'clamp(14px, 2.4vmin, 24px)',
          letterSpacing: '0.12em',
          opacity: 0.75,
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 0.75, y: 0 }}
        transition={{ duration: 1, delay: 2.0 }}
      >
        — read by candlelight —
      </motion.div>
    </motion.div>
  );
}
