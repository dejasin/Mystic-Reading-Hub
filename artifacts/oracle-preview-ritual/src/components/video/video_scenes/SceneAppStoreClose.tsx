import { motion } from 'framer-motion';
import { Sigil } from './Sigil';

/**
 * Unified closing brand frame shared by all three App Store previews.
 *
 * Large "Mystic Oracle" wordmark, a category sub-line, and a non-interactive
 * "Available on the App Store" affordance — sharing the gold-on-night palette
 * already used throughout the artifact.
 */
export function SceneAppStoreClose() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.04 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginTop: '-6vh' }}
      >
        <Sigil size="34vmin" draw={false} pulse />
      </motion.div>

      <motion.div
        className="font-serif text-cream"
        style={{
          marginTop: '5vh',
          fontSize: 'clamp(48px, 11vmin, 112px)',
          lineHeight: 1,
          letterSpacing: '0.005em',
          textAlign: 'center',
          fontWeight: 600,
          textShadow: '0 0 30px rgba(201,168,76,0.45)',
        }}
        initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        Mystic Oracle
      </motion.div>

      <motion.div
        className="font-display"
        style={{
          marginTop: '2.2vh',
          fontSize: 'clamp(13px, 1.9vmin, 20px)',
          letterSpacing: '0.42em',
          color: '#c9a84c',
          opacity: 0.85,
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 0.85, y: 0 }}
        transition={{ duration: 0.7, delay: 0.7 }}
      >
        Palm Reading · Astrology · Daily Guidance
      </motion.div>

      <motion.div
        className="absolute"
        style={{
          bottom: '14vh',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.8vh',
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.1 }}
      >
        <div
          className="font-display"
          style={{
            fontSize: 'clamp(10px, 1.4vmin, 14px)',
            letterSpacing: '0.5em',
            color: '#e8cc7a',
            opacity: 0.7,
            textTransform: 'uppercase',
          }}
        >
          Available on
        </div>
        <div
          aria-hidden="true"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1vmin',
            padding: '1.6vmin 3.4vmin',
            border: '1px solid rgba(232,204,122,0.55)',
            borderRadius: '999px',
            background:
              'linear-gradient(160deg, rgba(20,18,42,0.7) 0%, rgba(11,11,30,0.9) 100%)',
            boxShadow: '0 0 24px rgba(201,168,76,0.18) inset',
          }}
        >
          <svg
            width="3.2vmin"
            height="3.2vmin"
            viewBox="0 0 24 24"
            fill="#e8cc7a"
            aria-hidden="true"
          >
            <path d="M17.5 12.5c0-2 1.6-3 1.7-3.1-.9-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7-.7 0-1.6-.7-2.7-.7-1.4 0-2.7.8-3.4 2.1-1.5 2.5-.4 6.3 1 8.4.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 1.9-1 2.6-2 .8-1.1 1.2-2.2 1.2-2.3-.1 0-2.3-.9-2.3-3.6zM15.6 5.7c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.6.6-1.1 1.6-1 2.6 1 .1 2-.5 2.6-1.2z" />
          </svg>
          <span
            className="font-display"
            style={{
              fontSize: 'clamp(15px, 2.4vmin, 26px)',
              letterSpacing: '0.08em',
              color: '#f0e6cc',
              fontWeight: 500,
            }}
          >
            App Store
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
