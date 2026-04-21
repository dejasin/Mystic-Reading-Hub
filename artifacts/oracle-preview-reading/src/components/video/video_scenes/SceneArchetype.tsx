import { motion } from 'framer-motion';
import { Sigil } from './Sigil';

const frameSrc = `${import.meta.env.BASE_URL}images/archetype-frame.png`;
const archetype = 'The Reluctant Visionary';
const desc = 'sees the road before others, walks it slowly.';

export function SceneArchetype() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-[6vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
      transition={{ duration: 1.0 }}
    >
      <motion.div
        className="font-display text-gold"
        style={{
          position: 'absolute',
          top: '8vh',
          fontSize: 'clamp(11px, 1.8vmin, 18px)',
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          opacity: 0.7,
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 0.7, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        Your Archetype
      </motion.div>

      <motion.div
        className="relative"
        style={{
          width: '70vmin',
          height: '95vmin',
          maxHeight: '70vh',
        }}
        initial={{ opacity: 0, y: 60, rotateX: -25, transformPerspective: 1400 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        exit={{ opacity: 0, y: -20, scale: 1.1 }}
        transition={{
          duration: 1.6,
          delay: 0.6,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <img
          src={frameSrc}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 32px rgba(201,168,76,0.45))',
          }}
        />

        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-[8%]"
          style={{ paddingTop: '20%', paddingBottom: '20%' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.0, delay: 1.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginBottom: '4%' }}
          >
            <Sigil size="20vmin" draw={false} pulse />
          </motion.div>

          <motion.div
            className="font-display text-cream"
            style={{
              fontSize: 'clamp(20px, 4.6vmin, 46px)',
              letterSpacing: '0.08em',
              textAlign: 'center',
              lineHeight: 1.15,
              textShadow: '0 0 18px rgba(201,168,76,0.35)',
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 2.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {archetype.split(' ').map((w, i) => (
              <div key={i}>{w}</div>
            ))}
          </motion.div>

          <motion.div
            style={{
              width: '40%',
              height: '1px',
              background:
                'linear-gradient(90deg, transparent, #c9a84c, transparent)',
              margin: '5% 0',
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, delay: 3.2, ease: [0.16, 1, 0.3, 1] }}
          />

          <motion.div
            className="font-serif text-gold-light italic"
            style={{
              fontSize: 'clamp(13px, 2.6vmin, 26px)',
              textAlign: 'center',
              lineHeight: 1.4,
              opacity: 0.9,
              maxWidth: '90%',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 1, delay: 3.6 }}
          >
            {desc}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
