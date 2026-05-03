import { motion } from 'framer-motion';

type Sigil = 'eye' | 'ring' | 'cross' | 'stone' | 'star' | 'spiral';

const cards: { date: string; title: string; sigil: Sigil }[] = [
  { date: '21 Mar', title: 'The Watcher',   sigil: 'eye' },
  { date: '04 Apr', title: 'The Vow',       sigil: 'ring' },
  { date: '12 Apr', title: 'Crossroads',    sigil: 'cross' },
  { date: '23 Apr', title: 'The Stone',     sigil: 'stone' },
  { date: '02 May', title: 'The Visionary', sigil: 'star' },
  { date: '17 May', title: 'The Return',    sigil: 'spiral' },
];

function SigilGlyph({ kind }: { kind: Sigil }) {
  const stroke = '#c9a84c';
  const fill = 'none';
  const sw = 1.2;
  switch (kind) {
    case 'eye':
      return (
        <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden>
          <path d="M6 32 C 18 14, 46 14, 58 32 C 46 50, 18 50, 6 32 Z"
            stroke={stroke} strokeWidth={sw} fill={fill} opacity={0.9} />
          <circle cx="32" cy="32" r="7" stroke={stroke} strokeWidth={sw} fill={fill} />
          <circle cx="32" cy="32" r="2.2" fill={stroke} />
        </svg>
      );
    case 'ring':
      return (
        <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden>
          <circle cx="32" cy="34" r="14" stroke={stroke} strokeWidth={sw} fill={fill} />
          <circle cx="32" cy="34" r="20" stroke={stroke} strokeWidth={0.5} fill={fill} opacity={0.5} />
          <path d="M26 18 L32 8 L38 18 Z" stroke={stroke} strokeWidth={sw} fill={fill} />
        </svg>
      );
    case 'cross':
      return (
        <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden>
          <path d="M10 10 L54 54 M54 10 L10 54" stroke={stroke} strokeWidth={sw} opacity={0.9} />
          <circle cx="32" cy="32" r="6" stroke={stroke} strokeWidth={sw} fill={fill} />
        </svg>
      );
    case 'stone':
      return (
        <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden>
          <polygon points="32,8 54,24 46,52 18,52 10,24"
            stroke={stroke} strokeWidth={sw} fill={fill} opacity={0.95} />
          <polygon points="32,20 42,28 38,42 26,42 22,28"
            stroke={stroke} strokeWidth={0.7} fill={fill} opacity={0.55} />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden>
          <path d="M32 6 L36 26 L56 30 L36 34 L32 58 L28 34 L8 30 L28 26 Z"
            stroke={stroke} strokeWidth={sw} fill={fill} opacity={0.95} />
          <circle cx="32" cy="30" r="2" fill={stroke} />
        </svg>
      );
    case 'spiral':
      return (
        <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden>
          <path d="M32 32
                   m -2 0
                   a 2 2 0 1 0 4 0
                   a 4 4 0 1 0 -8 0
                   a 7 7 0 1 0 14 0
                   a 11 11 0 1 0 -22 0
                   a 16 16 0 1 0 32 0"
            stroke={stroke} strokeWidth={sw} fill={fill} opacity={0.95} />
        </svg>
      );
  }
}

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
          opacity: 0.85,
          marginBottom: '2.4vh',
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 0.85, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        The Vault
      </motion.div>

      <motion.div
        className="font-serif text-cream italic"
        style={{
          fontSize: 'clamp(14px, 2.6vmin, 26px)',
          opacity: 0.85,
          marginBottom: '3.6vh',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        — every session kept —
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
              border: '1px solid rgba(201,168,76,0.55)',
              background:
                'linear-gradient(160deg, rgba(28,22,52,0.92) 0%, rgba(11,11,30,0.96) 100%)',
              padding: 'clamp(10px, 1.6vh, 18px)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow:
                '0 0 18px rgba(201,168,76,0.18), inset 0 0 24px rgba(201,168,76,0.05)',
              position: 'relative',
              overflow: 'hidden',
            }}
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.7,
              delay: 0.6 + i * 0.11,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {/* corner ornaments */}
            {[
              { top: 4, left: 4, rot: 0 },
              { top: 4, right: 4, rot: 90 },
              { bottom: 4, right: 4, rot: 180 },
              { bottom: 4, left: 4, rot: 270 },
            ].map((p, k) => (
              <div
                key={k}
                style={{
                  position: 'absolute',
                  width: 10,
                  height: 10,
                  ...p,
                  transform: `rotate(${p.rot}deg)`,
                  borderTop: '1px solid rgba(201,168,76,0.7)',
                  borderLeft: '1px solid rgba(201,168,76,0.7)',
                }}
              />
            ))}

            <div
              className="font-display"
              style={{
                fontSize: 'clamp(9px, 1.45vmin, 14px)',
                letterSpacing: '0.32em',
                color: '#e8cc7a',
                opacity: 0.95,
                textTransform: 'uppercase',
              }}
            >
              {c.date}
            </div>

            <div
              style={{
                width: '60%',
                height: '1px',
                background:
                  'linear-gradient(90deg, rgba(232,204,122,0.95), rgba(201,168,76,0.0))',
                margin: 'clamp(5px, 0.9vh, 9px) 0',
              }}
            />

            <motion.div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                opacity: 0.9,
                filter: 'drop-shadow(0 0 6px rgba(201,168,76,0.35))',
              }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 0.9, scale: 1 }}
              transition={{ duration: 0.9, delay: 1.0 + i * 0.11 }}
            >
              <div style={{ width: '52%' }}>
                <SigilGlyph kind={c.sigil} />
              </div>
            </motion.div>

            <div
              className="font-serif text-cream italic"
              style={{
                fontSize: 'clamp(13px, 2.3vmin, 22px)',
                lineHeight: 1.2,
                textAlign: 'center',
                marginTop: 'clamp(4px, 0.6vh, 6px)',
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
