import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Scene1Morning() {
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 1 }}
    >
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
      
      <div className="relative w-[300px] h-[600px] border-[4px] border-[#c9a84c]/20 rounded-[40px] overflow-hidden flex flex-col items-center p-8 bg-[#0b0b1e]/80 backdrop-blur-md shadow-[0_0_50px_rgba(201,168,76,0.1)]">
        
        <motion.div
          className="absolute -top-32 -left-32 w-64 h-64 bg-[#e8cc7a] rounded-full blur-[80px]"
          animate={{ opacity: step >= 1 ? 0.4 : 0, scale: step >= 1 ? 1.5 : 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />

        <motion.h2 
          className="font-display text-[#c9a84c] text-2xl tracking-widest uppercase mt-12 z-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: step >= 1 ? 1 : 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Daily Oracle
        </motion.h2>

        <motion.div 
          className="mt-8 font-body text-xl text-center leading-relaxed text-[#f0e6cc] z-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: step >= 2 ? 1 : 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="italic">"The path reveals itself only when you are ready to walk it."</p>
        </motion.div>

        <motion.div
          className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent mt-8 z-10"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: step >= 2 ? 1 : 0, opacity: step >= 2 ? 0.5 : 0 }}
          transition={{ duration: 1 }}
        />
      </div>

      <motion.div 
        className="absolute bottom-24 flex flex-col items-center"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: step >= 3 ? 1 : 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <h1 className="font-display text-5xl text-[#f0e6cc] tracking-wide mb-2">Your day.</h1>
        <h1 className="font-display text-5xl text-[#c9a84c] tracking-wide italic">Decoded.</h1>
      </motion.div>
    </motion.div>
  );
}
