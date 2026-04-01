import { motion } from 'framer-motion';

export default function Scene5Chat() {
  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-end pb-12 pt-24 px-6 z-10"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, filter: "blur(10px)", scale: 0.9 }}
      transition={{ duration: 0.8, type: "spring", stiffness: 200, damping: 25 }}
    >
      <div className="w-full flex-1 flex flex-col justify-end space-y-6">
        
        {/* Oracle Message */}
        <motion.div 
          className="flex items-start gap-3 w-5/6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="w-8 h-8 shrink-0 rounded-full border border-oracle-gold flex items-center justify-center bg-oracle-bg shadow-[0_0_8px_rgba(201,168,76,0.3)] mt-1">
            <span className="text-oracle-gold text-sm">✦</span>
          </div>
          <div className="bg-oracle-surface border border-oracle-gold/20 p-4 rounded-2xl rounded-tl-sm shadow-md">
            <p className="text-lg italic leading-relaxed text-oracle-cream/90">
              The energies align with your intent. Do you seek deeper clarity on the challenge you faced yesterday?
            </p>
          </div>
        </motion.div>

        {/* User Message */}
        <motion.div 
          className="flex justify-end w-full"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.2, duration: 0.5, type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="bg-oracle-inputBg border border-oracle-muted/30 p-4 rounded-2xl rounded-tr-sm shadow-md max-w-[80%]">
            <p className="text-base text-oracle-cream">
              Yes, please. How does it connect to my upcoming project?
            </p>
          </div>
        </motion.div>

      </div>

      {/* Input Field mockup */}
      <motion.div 
        className="w-full mt-8 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="w-full h-12 bg-oracle-surface border border-oracle-gold/20 rounded-full px-5 flex items-center text-oracle-muted">
          Ask the Oracle...
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-oracle-gold/20 flex items-center justify-center">
          <span className="text-oracle-gold text-lg">↑</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
