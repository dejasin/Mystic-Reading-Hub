import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Scene4Community() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const cards = [
    { x: '-30vw', y: '-15vh', rotate: -15, delay: 0 },
    { x: '30vw', y: '-20vh', rotate: 10, delay: 0.1 },
    { x: '-25vw', y: '25vh', rotate: -5, delay: 0.2 },
    { x: '25vw', y: '20vh', rotate: 15, delay: 0.3 },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      
      {cards.map((pos, idx) => (
        <motion.div
          key={idx}
          className="absolute w-[200px] h-[300px] bg-[#0b0b1e] border border-[#c9a84c]/20 rounded-2xl flex flex-col items-center justify-center p-4 opacity-40 mix-blend-screen"
          initial={{ opacity: 0, scale: 0.8, x: 0, y: 0, rotate: 0 }}
          animate={{ 
            opacity: step >= 1 ? 0.3 : 0, 
            scale: step >= 1 ? 1 : 0.8,
            x: step >= 1 ? pos.x : 0,
            y: step >= 1 ? pos.y : 0,
            rotate: step >= 1 ? pos.rotate : 0
          }}
          transition={{ duration: 2, delay: pos.delay, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-16 h-16 border border-[#c9a84c]/40 rounded-full mb-4" />
          <div className="w-3/4 h-[2px] bg-[#c9a84c]/20 mb-2" />
          <div className="w-1/2 h-[2px] bg-[#c9a84c]/20" />
        </motion.div>
      ))}

      <motion.div 
        className="flex flex-col items-center bg-[#04040f]/60 px-16 py-10 rounded-full backdrop-blur-sm border border-[#c9a84c]/10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: step >= 2 ? 1 : 0, scale: step >= 2 ? 1 : 0.9 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <h1 className="font-display text-5xl text-[#f0e6cc] tracking-wider mb-2 text-center">Thousands seek</h1>
        <h1 className="font-display text-6xl text-[#c9a84c] tracking-widest italic text-center">truth daily.</h1>
      </motion.div>
    </motion.div>
  );
}
