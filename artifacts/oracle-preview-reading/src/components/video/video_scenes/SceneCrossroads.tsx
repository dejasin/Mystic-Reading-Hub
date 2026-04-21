import { motion } from 'framer-motion';
import { GoldDivider } from './GoldDivider';

const lines = [
  'Two paths now wait at your feet:',
  'one of careful keeping,',
  'and one that asks you to set the cup down.',
];

export function SceneCrossroads() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center items-center px-[8vw]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="font-display text-gold"
        style={{
          fontSize: 'clamp(11px, 1.8vmin, 18px)',
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          opacity: 0.7,
          marginBottom: '2.5vh',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        II. The Crossroads
      </motion.div>

      <GoldDivider width="50vw" delay={0.2} />

      <div
        className="font-serif text-cream italic"
        style={{
          fontSize: 'clamp(22px, 5.2vmin, 52px)',
          lineHeight: 1.45,
          textAlign: 'center',
          marginTop: '4vh',
          maxWidth: '80vw',
        }}
      >
        {lines.map((line, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              duration: 0.9,
              delay: 1.0 + idx * 1.0,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ marginBottom: '0.4em' }}
          >
            {line}
          </motion.div>
        ))}
      </div>

      <motion.div
        className="absolute"
        style={{
          bottom: '12vh',
          width: '40vw',
        }}
      >
        <GoldDivider width="40vw" delay={4.2} duration={1.0} />
      </motion.div>
    </motion.div>
  );
}
