import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

export default function StarField() {
  const stars = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    }));
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden mix-blend-screen">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-oracle-goldLight"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.1, 0.8, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut"
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-oracle-bg/50 to-oracle-bg pointer-events-none" />
    </div>
  );
}
