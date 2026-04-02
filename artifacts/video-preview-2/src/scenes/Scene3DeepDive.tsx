import { motion } from 'framer-motion';
import { Heart, Briefcase, Activity, Moon } from 'lucide-react';

const CARDS = [
  { id: 'love', title: 'Love & Relationships', icon: Heart, desc: 'Bonds, patterns & the love that shapes you', color: '#c9a84c' },
  { id: 'career', title: 'Career & Purpose', icon: Briefcase, desc: "Your path, vocation & destiny's calling", color: '#c9a84c' },
  { id: 'health', title: 'Health & Vitality', icon: Activity, desc: 'Body wisdom, energy & physical potential', color: '#c9a84c' },
  { id: 'shadow', title: 'Shadow & Growth', icon: Moon, desc: 'Hidden depths, wounds & transformation', color: '#c9a84c' },
];

export default function Scene3DeepDive() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-start pt-16 px-6 z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.h2
        className="text-2xl font-display mb-2 text-center text-oracle-gold tracking-widest"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        DEEP DIVE
      </motion.h2>
      <motion.p
        className="text-sm text-oracle-muted italic mb-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        Select a life area for a targeted reading
      </motion.p>

      <div className="w-full grid grid-cols-2 gap-3">
        {CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              className="bg-oracle-surface border border-oracle-gold/20 rounded-2xl p-5 flex flex-col items-center text-center gap-3 shadow-lg"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.12, type: "spring", stiffness: 300, damping: 20 }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}
              >
                <Icon size={20} color={card.color} />
              </div>
              <span className="text-sm font-display tracking-wide text-oracle-cream leading-tight">{card.title}</span>
              <span className="text-xs text-oracle-muted italic leading-snug">{card.desc}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
