import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

function GoldSigil({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5"/>
      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1"/>
      <path d="M50 10 L50 90 M10 50 L90 50" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5"/>
      <circle cx="50" cy="50" r="10" fill="currentColor"/>
      <path d="M25 25 L75 75 M25 75 L75 25" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3"/>
    </svg>
  );
}

export default function Scene5Begin() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 500);
    const t2 = setTimeout(() => setStep(2), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)' }}
      transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0, rotate: -90 }}
        animate={{ scale: step >= 1 ? 1 : 0, opacity: step >= 1 ? 1 : 0, rotate: step >= 1 ? 0 : -90 }}
        transition={{ duration: 2, type: "spring", stiffness: 50, damping: 20 }}
        className="mb-12 relative text-[#c9a84c]"
      >
        <GoldSigil className="w-48 h-48 drop-shadow-[0_0_30px_rgba(201,168,76,0.6)]" />
      </motion.div>

      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: step >= 2 ? 1 : 0, y: step >= 2 ? 0 : 30 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <h1 className="font-display text-7xl text-[#f0e6cc] tracking-[0.2em] uppercase mb-4">
          The Oracle
        </h1>
        <h2 className="font-display text-4xl text-[#c9a84c] italic tracking-wide">
          Awaits.
        </h2>
      </motion.div>
      
      <motion.div
        className="absolute inset-0 pointer-events-none mix-blend-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: step >= 1 ? 0.3 : 0 }}
        transition={{ duration: 2 }}
        style={{
          background: 'radial-gradient(circle at center, rgba(201,168,76,0.4) 0%, transparent 60%)'
        }}
      />
    </motion.div>
  );
}
