import { motion } from 'framer-motion';

const TEXT = "The paths you walk have converged. Your past labor has laid a foundation, yet a new current tugs at your periphery. It is time to release the rigid structures you've outgrown. Embrace the fluidity of the coming weeks, for the stars indicate a profound alignment in your creative endeavors. Trust the whispers of your intuition; they are the echoes of your highest self.";

export default function Scene2Reading() {
  const words = TEXT.split(' ');

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-start pt-32 px-8 z-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, filter: "blur(5px)" }}
      transition={{ duration: 0.8 }}
    >
      <motion.h2 
        className="text-3xl tracking-widest text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        ✦ THE LIFE PATH
      </motion.h2>
      
      <motion.div 
        className="text-oracle-gold text-sm tracking-[0.3em] my-6 opacity-60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.6 }}
      >
        ─── ✦ ───
      </motion.div>

      <div className="mt-8">
        <p className="text-xl leading-relaxed italic opacity-90 text-center">
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-1.5"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ delay: 1.0 + i * 0.05, duration: 0.3 }}
            >
              {word}
            </motion.span>
          ))}
        </p>
      </div>
    </motion.div>
  );
}
