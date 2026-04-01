import { motion } from 'framer-motion';
import { Briefcase, Heart, Coins, Dumbbell, Users } from 'lucide-react';

const CARDS = [
  { id: 'career', title: 'Career', icon: Briefcase, color: '#4a90e2' },
  { id: 'relationship', title: 'Relationship', icon: Heart, color: '#e24a7c' },
  { id: 'finances', title: 'Finances', icon: Coins, color: '#e2b94a' },
  { id: 'fitness', title: 'Fitness', icon: Dumbbell, color: '#4ae29b' },
  { id: 'family', title: 'Family', icon: Users, color: '#b94ae2' },
];

export default function Scene3DeepDive() {
  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-start pt-24 px-6 z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.h2 
        className="text-3xl mb-12 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        Explore Further
      </motion.h2>

      <div className="w-full flex flex-col gap-4">
        {CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              className="w-full bg-oracle-surface border border-oracle-gold/20 rounded-xl p-5 flex items-center gap-4 shadow-lg shadow-oracle-gold/5"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                delay: 0.6 + i * 0.15, 
                type: "spring", 
                stiffness: 300, 
                damping: 20 
              }}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center bg-oracle-bg"
                style={{ boxShadow: `0 0 10px ${card.color}40` }}
              >
                <Icon size={20} color={card.color} />
              </div>
              <span className="text-xl font-display tracking-wide">{card.title}</span>
              <div className="ml-auto text-oracle-muted">→</div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  );
}
