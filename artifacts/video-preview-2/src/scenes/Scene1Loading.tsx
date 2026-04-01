import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sigil from '../components/Sigil';

const MESSAGES = [
  "Mapping your palm lines...",
  "Reading the iris zones...",
  "Synthesizing ancient patterns..."
];

export default function Scene1Loading() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % MESSAGES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        <Sigil size={180} />
      </motion.div>
      
      <div className="h-12 mt-12 relative flex items-center justify-center w-full">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-oracle-goldLight italic text-lg tracking-wide absolute text-center"
          >
            {MESSAGES[msgIdx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
