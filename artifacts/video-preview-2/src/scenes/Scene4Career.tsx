import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';

const READING = "The current celestial alignment emphasizes expansion in your professional sphere. A hidden opportunity lies within a recent challenge. Do not shy away from leading projects that feel slightly beyond your grasp; your capabilities are vast. Trust your innovative ideas this week.";

export default function Scene4Career() {
  const words = READING.split(' ');

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-start pt-16 px-6 z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="w-full bg-oracle-surface border border-oracle-gold/40 rounded-xl p-5 flex items-center gap-4 shadow-lg shadow-oracle-gold/10 z-20"
        initial={{ y: 150 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center bg-oracle-bg shadow-[0_0_10px_rgba(201,168,76,0.3)]"
        >
          <Briefcase size={20} color="#c9a84c" />
        </div>
        <span className="text-xl font-display text-oracle-gold tracking-wide">Career Forecast</span>
      </motion.div>

      <motion.div 
        className="w-full mt-8 flex flex-col gap-4"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <div className="space-y-2">
          <label className="text-sm text-oracle-muted tracking-widest uppercase ml-1">Current Focus</label>
          <div className="w-full bg-oracle-inputBg border border-oracle-gold/10 rounded-lg p-4 text-oracle-cream/80">
            Professional Growth
          </div>
        </div>
        
        <div className="space-y-2 mt-4">
          <label className="text-sm text-oracle-muted tracking-widest uppercase ml-1">The Oracle Speaks</label>
          <div className="w-full h-64 bg-oracle-bg border border-oracle-gold/20 rounded-lg p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-oracle-gold to-transparent opacity-30" />
            <p className="text-lg leading-relaxed italic text-oracle-cream/90">
              {words.map((word, i) => (
                <motion.span
                  key={i}
                  className="inline-block mr-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + i * 0.08, duration: 0.2 }}
                >
                  {word}
                </motion.span>
              ))}
            </p>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
