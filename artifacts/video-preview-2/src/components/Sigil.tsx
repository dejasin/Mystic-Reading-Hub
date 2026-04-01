import { motion } from 'framer-motion';

export default function Sigil({ className = "", size = 200 }: { className?: string, size?: number }) {
  return (
    <motion.div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(201,168,76,0.4)]">
        {/* Outer Ring */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="#c9a84c" strokeWidth="1" opacity="0.6" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="#c9a84c" strokeWidth="0.5" opacity="0.4" />
        
        {/* Star of David / Hexagram */}
        <polygon 
          points="50,10 85,70 15,70" 
          fill="none" 
          stroke="#c9a84c" 
          strokeWidth="1.5" 
        />
        <polygon 
          points="50,90 85,30 15,30" 
          fill="none" 
          stroke="#c9a84c" 
          strokeWidth="1.5" 
        />
        
        {/* Inner Ring */}
        <circle cx="50" cy="50" r="23" fill="none" stroke="#e8cc7a" strokeWidth="1" opacity="0.8" />
        
        {/* Center dot */}
        <circle cx="50" cy="50" r="2" fill="#e8cc7a" />
      </svg>
    </motion.div>
  );
}
