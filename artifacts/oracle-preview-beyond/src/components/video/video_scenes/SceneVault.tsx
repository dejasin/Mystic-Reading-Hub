import { motion } from 'framer-motion';

const cards = [
  { date: '21 Mar', title: 'The Watcher', tone: 'gold' },
  { date: '04 Apr', title: 'The Vow', tone: 'gold' },
  { date: '12 Apr', title: 'Crossroads', tone: 'gold' },
  { date: '23 Apr', title: 'The Stone', tone: 'gold' },
  { date: '02 May', title: 'The Visionary', tone: 'gold' },
  { date: '17 May', title: 'The Return', tone: 'gold' },
];

export function SceneVault() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-[6vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97, filter: 'blur(10px)' }}
      transition={{ duration: 0.8 }}
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
        The Vault
      </motion.div>

      <motion.div
        className="font-serif text-cream italic"
        style={{
          fontSize: 'clamp(14px, 2.6vmin, 26px)',
          opacity: 0.7,
          marginBottom: '4vh',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        — every reading kept —
      </motion.div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 'clamp(12px, 2.2vmin, 22px)',
          width: '78vw',
          maxWidth: '780px',
        }}
      >
        {cards.map((c, i) => (
          <motion.div
            key={i}
            style={{
              aspectRatio: '3 / 4',
              borderRadius: '6px',
              border: '1px solid rgba(201,168,76,0.4)',
              background:
                'linear-gradient(160deg, rgba(20,18,42,0.85) 0%, rgba(11,11,30,0.95) 100%)',
              padding: 'clamp(10px, 1.6vh, 18px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 0 14px rgba(201,168,76,0.08)',
              position: 'relative',
              overflow: 'hidden',
            }}
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.7,
              delay: 0.7 + i * 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <div
              className="font-display text-gold"
              style={{
                fontSize: 'clamp(8px, 1.3vmin, 13px)',
                letterSpacing: '0.3em',
                opacity: 0.7,
              }}
            >
              {c.date}
            </div>
            <div
              style={{
                width: '40%',
                height: '1px',
                background:
                  'linear-gradient(90deg, #c9a84c, transparent)',
                margin: 'clamp(4px, 0.8vh, 8px) 0',
              }}
            />
            <div
              className="font-serif text-cream italic"
              style={{
                fontSize: 'clamp(13px, 2.3vmin, 22px)',
                lineHeight: 1.2,
              }}
            >
              {c.title}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
