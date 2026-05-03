import { motion } from 'framer-motion';
import { Sigil } from './Sigil';

interface SceneHookProps {
  /** Bold typographic hook that names the value prop, in the style of Co-Star / Sanctuary previews. */
  headline: string;
  /** Sub-line shown below the headline. Kept short. */
  subline: string;
}

/**
 * Opening typographic hook scene shared by all three previews.
 *
 * Renders the "Oracle" wordmark and a bold headline/subline within
 * the first ~600ms so the App Store autoplay frame reads as a title card,
 * not a slow logo fade.
 */
export function SceneHook({ headline, subline }: SceneHookProps) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-[8vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(14px)', scale: 0.97 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="font-display"
        style={{
          position: 'absolute',
          top: '14vh',
          fontSize: 'clamp(11px, 1.6vmin, 16px)',
          letterSpacing: '0.55em',
          color: '#c9a84c',
          opacity: 0.85,
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 0.85, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
      >
        Oracle
      </motion.div>

      <motion.div
        style={{ marginTop: '-2vh' }}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 0.7, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <Sigil size="22vmin" draw={false} pulse />
      </motion.div>

      <motion.div
        className="font-serif text-cream"
        style={{
          marginTop: '4vh',
          fontSize: 'clamp(44px, 10vmin, 100px)',
          lineHeight: 1.05,
          letterSpacing: '0.005em',
          textAlign: 'center',
          fontWeight: 600,
          textShadow: '0 0 28px rgba(201,168,76,0.35)',
        }}
        initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.55, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        {headline}
      </motion.div>

      <motion.div
        className="absolute"
        style={{
          top: 'calc(50% + 18vh)',
          left: '50%',
          transform: 'translateX(-50%)',
          height: '1px',
          background:
            'linear-gradient(90deg, transparent 0%, #c9a84c 50%, transparent 100%)',
        }}
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: '52vw', opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      />

      <motion.div
        className="font-serif italic"
        style={{
          position: 'absolute',
          bottom: '18vh',
          color: '#e8cc7a',
          fontSize: 'clamp(18px, 3.2vmin, 32px)',
          letterSpacing: '0.04em',
          textAlign: 'center',
          maxWidth: '78vw',
        }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 0.92, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.55 }}
      >
        {subline}
      </motion.div>
    </motion.div>
  );
}
