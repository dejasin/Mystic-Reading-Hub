import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Scene2Journal() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => setStep(2), 1200);
    const t3 = setTimeout(() => setStep(3), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const entries = [
    { date: "Oct 12", title: "The Turning Point", delay: 0 },
    { date: "Oct 11", title: "Embracing Shadows", delay: 0.1 },
    { date: "Oct 10", title: "A New Foundation", delay: 0.2 },
    { date: "Oct 09", title: "Whispers of Change", delay: 0.3 },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="w-[50vw] flex justify-center pl-24">
        <div className="relative w-[320px] h-[500px]">
          {entries.map((entry, idx) => (
            <motion.div
              key={idx}
              className="absolute w-full bg-[#0b0b1e] border border-[#c9a84c]/30 p-6 rounded-2xl shadow-xl flex flex-col gap-2"
              initial={{ y: 100, opacity: 0, rotateX: 20 }}
              animate={{ 
                y: step >= 1 ? idx * 80 : 100, 
                opacity: step >= 1 ? 1 - (idx * 0.2) : 0,
                rotateX: step >= 1 ? 0 : 20,
                scale: step >= 1 ? 1 - (idx * 0.05) : 1,
                zIndex: 10 - idx
              }}
              transition={{ duration: 0.8, delay: entry.delay, ease: "easeOut" }}
            >
              <div className="text-[#6b6b8a] font-display text-sm uppercase tracking-widest">{entry.date}</div>
              <div className="text-[#f0e6cc] font-display text-2xl">{entry.title}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="w-[50vw] pr-32 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: step >= 2 ? 1 : 0, x: step >= 2 ? 0 : -30 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-display text-6xl text-[#f0e6cc] tracking-wide mb-4">Every insight.</h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: step >= 3 ? 1 : 0, x: step >= 3 ? 0 : -30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="font-display text-5xl text-[#c9a84c] tracking-wide italic">Saved forever.</h1>
        </motion.div>
      </div>
    </motion.div>
  );
}
