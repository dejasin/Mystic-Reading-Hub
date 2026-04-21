import { motion } from 'framer-motion';

const coverSrc = `${import.meta.env.BASE_URL}images/deep-dive-cover.png`;
const chapters = [
  'I.   The Compass',
  'II.  The Fork',
  'III. The Stone',
  'IV.  The Vow',
];

export function SceneDeepDive() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-[8vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96, filter: 'blur(10px)' }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="font-display text-gold"
        style={{
          fontSize: 'clamp(11px, 1.8vmin, 18px)',
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          opacity: 0.7,
          marginBottom: '2vh',
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 0.7, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        Deep Dive
      </motion.div>

      <motion.div
        className="relative"
        style={{
          width: '54vmin',
          height: '76vmin',
          maxHeight: '50vh',
          borderRadius: '6px',
          overflow: 'hidden',
          border: '1px solid rgba(201,168,76,0.55)',
          boxShadow: '0 0 36px rgba(201,168,76,0.2)',
        }}
        initial={{ opacity: 0, rotateY: -50, scale: 0.85, transformPerspective: 1400 }}
        animate={{ opacity: 1, rotateY: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <img
          src={coverSrc}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(4,4,15,0.2) 0%, rgba(4,4,15,0.3) 50%, rgba(4,4,15,0.85) 100%)',
          }}
        />
        <div
          className="absolute inset-0 flex flex-col items-center justify-end"
          style={{ padding: '6%' }}
        >
          <motion.div
            className="font-display text-cream"
            style={{
              fontSize: 'clamp(20px, 4.2vmin, 42px)',
              letterSpacing: '0.16em',
              textShadow: '0 0 18px rgba(201,168,76,0.45)',
              textAlign: 'center',
            }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.4 }}
          >
            CAREER
          </motion.div>
          <motion.div
            style={{
              width: '36%',
              height: '1px',
              background:
                'linear-gradient(90deg, transparent, #c9a84c, transparent)',
              margin: '4% 0',
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 1.8 }}
          />
        </div>
      </motion.div>

      <div
        className="font-serif text-gold-light italic"
        style={{
          marginTop: '4vh',
          fontSize: 'clamp(14px, 2.6vmin, 26px)',
          lineHeight: 1.7,
          textAlign: 'center',
          letterSpacing: '0.06em',
        }}
      >
        {chapters.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 0.85, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 2.4 + i * 0.25 }}
          >
            {c}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
