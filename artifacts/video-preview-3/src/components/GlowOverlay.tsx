import { motion } from 'framer-motion';

export default function GlowOverlay({ currentScene }: { currentScene: number }) {
  const positions = [
    { x: '10vw', y: '20vh', scale: 1, opacity: 0.5 }, // 0: morning (left top)
    { x: '70vw', y: '60vh', scale: 1.5, opacity: 0.4 }, // 1: journal (right bottom)
    { x: '50vw', y: '10vh', scale: 2, opacity: 0.3 }, // 2: chat (center top)
    { x: '30vw', y: '80vh', scale: 1.2, opacity: 0.4 }, // 3: community (left bottom)
    { x: '50vw', y: '50vh', scale: 3, opacity: 0.6 }, // 4: begin (center massive)
  ];

  const pos = positions[currentScene] || positions[0];

  return (
    <motion.div
      className="absolute w-[40vw] h-[40vw] rounded-full mix-blend-screen pointer-events-none z-0"
      style={{
        background: 'radial-gradient(circle, rgba(201, 168, 76, 0.4) 0%, rgba(201, 168, 76, 0) 70%)',
        top: 0,
        left: 0,
        marginLeft: '-20vw',
        marginTop: '-20vw',
      }}
      animate={{
        x: pos.x,
        y: pos.y,
        scale: pos.scale,
        opacity: pos.opacity,
      }}
      transition={{
        duration: 3,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    />
  );
}
