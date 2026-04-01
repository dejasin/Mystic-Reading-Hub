import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Scene3Chat() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 500);
    const t2 = setTimeout(() => setStep(2), 1500);
    const t3 = setTimeout(() => setStep(3), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <div className="w-full max-w-[800px] flex flex-col gap-6">
        
        <motion.div
          className="self-end bg-[#2a2a3e] px-6 py-4 rounded-2xl rounded-tr-sm max-w-[70%]"
          initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
          animate={{ opacity: step >= 1 ? 1 : 0, y: step >= 1 ? 0 : 20, scale: step >= 1 ? 1 : 0.9 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <p className="font-body text-xl text-[#f0e6cc]">Why do I feel so restless lately?</p>
        </motion.div>

        <motion.div
          className="self-start bg-[#0b0b1e] border border-[#c9a84c]/40 px-6 py-5 rounded-2xl rounded-tl-sm max-w-[85%] shadow-[0_0_30px_rgba(201,168,76,0.05)]"
          initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'top left' }}
          animate={{ opacity: step >= 2 ? 1 : 0, y: step >= 2 ? 0 : 20, scale: step >= 2 ? 1 : 0.9 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 rounded-full bg-[#c9a84c]/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#c9a84c]" />
            </div>
            <span className="font-display text-[#c9a84c] uppercase tracking-widest text-sm">The Oracle</span>
          </div>
          <p className="font-body text-xl leading-relaxed text-[#f0e6cc]">
            The restless energy you feel is not anxiety, but anticipation. A major cycle is completing. You are shedding old skin, and the new one is not yet formed.
          </p>
        </motion.div>

      </div>

      <motion.div 
        className="absolute bottom-20 flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: step >= 3 ? 1 : 0, y: step >= 3 ? 0 : 20 }}
        transition={{ duration: 1 }}
      >
        <h1 className="font-display text-4xl text-[#f0e6cc] tracking-wide mb-2">Your personal mystic.</h1>
        <h1 className="font-display text-4xl text-[#c9a84c] tracking-wide italic">Always available.</h1>
      </motion.div>
    </motion.div>
  );
}
