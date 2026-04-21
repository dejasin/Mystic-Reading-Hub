import { motion } from 'framer-motion';
import { GoldDivider } from './GoldDivider';
import { Sigil } from './Sigil';

export function SceneCounsel() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-[8vw]"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)' }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="font-display text-gold"
        style={{
          fontSize: 'clamp(11px, 1.8vmin, 18px)',
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          opacity: 0.7,
          marginBottom: '3vh',
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 0.7, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        The Counsel
      </motion.div>

      <GoldDivider width="44vw" delay={0.2} />

      <motion.div
        className="font-serif text-cream italic"
        style={{
          fontSize: 'clamp(22px, 5.4vmin, 56px)',
          lineHeight: 1.35,
          textAlign: 'center',
          marginTop: '5vh',
          maxWidth: '78vw',
        }}
        initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 1.0, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
      >
        Set the cup down,<br />and the road will rise.
      </motion.div>

      <motion.div
        style={{ marginTop: '6vh' }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.0, delay: 2.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <Sigil size="14vmin" draw={false} pulse />
      </motion.div>
    </motion.div>
  );
}
