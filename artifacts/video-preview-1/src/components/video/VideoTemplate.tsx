import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Eye, Moon, Sparkles, Star, Camera, Fingerprint } from 'lucide-react';
import { useVideoPlayer } from '@/lib/video';

const SCENE_DURATIONS = { s0: 3000, s1: 4000, s2: 4000, s3: 5000, s4: 4000 };

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <>
      {/* Background Layer (Persistent) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-40">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-[2px] h-[2px] bg-goldLight rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }}
              transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
            />
          ))}
        </div>
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.05),transparent_70%)]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Scene 0: Meet the Oracle */}
      <AnimatePresence>
        {currentScene === 0 && (
          <motion.div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 1.2 }}
          >
            <motion.div
              className="relative mb-12"
              initial={{ scale: 0.8, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
            >
              <div className="w-32 h-32 relative">
                <motion.div
                  className="absolute inset-0 border-[1px] border-gold rotate-45"
                  animate={{ rotate: 405 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-0 border-[1px] border-goldLight rotate-0"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-4 rounded-full border-[1px] border-gold/50" />
                <div className="absolute inset-8 rounded-full border-[1px] border-goldLight/30" />
                <Sparkles className="absolute inset-0 m-auto text-goldLight w-8 h-8 opacity-80" />
              </div>
            </motion.div>
            <h1 className="font-display font-bold text-5xl tracking-[0.2em] text-gold mb-4 text-center">
              THE ORACLE
            </h1>
            <motion.div
              className="text-gold/60 tracking-widest text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1 }}
            >
              ─── ✦ ───
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene 1: The Sight */}
      <AnimatePresence>
        {currentScene === 1 && (
          <motion.div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
          >
            <motion.h2
              className="font-display text-4xl text-gold mb-2 tracking-wider"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              THE SIGHT
            </motion.h2>
            <motion.p
              className="text-cream/80 text-lg mb-12 italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Your palm. Your iris. Your face.
            </motion.p>
            <div className="flex gap-8 mb-12">
              {[Hand, Eye, Moon].map((Icon, idx) => (
                <motion.div
                  key={idx}
                  className="w-16 h-16 rounded-full bg-surface border border-gold/30 flex items-center justify-center relative"
                  initial={{ scale: 0, opacity: 0, rotate: -45 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.8 + (idx * 0.2) }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gold/20 blur-md"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: idx * 0.5 }}
                  />
                  <Icon className="w-8 h-8 text-goldLight z-10" />
                </motion.div>
              ))}
            </div>
            <div className="text-center space-y-4 text-cream/90 text-lg">
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }}>
                Each line a story written before birth.
              </motion.p>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.0 }}>
                Each pattern a gateway to hidden truth.
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene 2: The Depth */}
      <AnimatePresence>
        {currentScene === 2 && (
          <motion.div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center px-10 bg-surface/40 backdrop-blur-sm"
            initial={{ clipPath: "circle(0% at 50% 50%)" }}
            animate={{ clipPath: "circle(150% at 50% 50%)" }}
            exit={{ opacity: 0, filter: "blur(20px)" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 border-8 border-gold/10 m-4 rounded-3xl" />
            <motion.h2
              className="font-display text-4xl text-gold mb-8 tracking-wider text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              THE DEPTH
            </motion.h2>
            <motion.p
              className="text-xl text-center mb-12 text-cream"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              15+ ancient systems woven into a single truth.
            </motion.p>
            <div className="w-full space-y-6">
              {["Vedic Astrology & Human Design", "I Ching & Gene Keys", "Numerology & Sacred Geometry"].map((text, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-center gap-4 bg-input/50 p-4 rounded-xl border border-surface"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: "spring", delay: 1.2 + (idx * 0.3) }}
                >
                  <Star className="w-5 h-5 text-goldLight shrink-0" />
                  <span className="text-lg">{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene 3: Your Truth Awaits */}
      <AnimatePresence>
        {currentScene === 3 && (
          <motion.div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8"
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 1 }}
          >
            <motion.h2
              className="font-display text-5xl text-gold mb-6 tracking-wide text-center leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              YOUR TRUTH<br />AWAITS
            </motion.h2>
            <motion.div
              className="mb-16"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
            >
              <div className="w-40 h-40 relative flex items-center justify-center">
                <motion.div
                  className="absolute inset-0 border-2 border-gold rounded-full"
                  animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="absolute inset-4 border border-gold/50 rounded-full" />
                <Eye className="w-12 h-12 text-goldLight" />
              </div>
            </motion.div>
            <motion.button
              className="relative px-10 py-4 bg-surface border border-gold/50 rounded-full overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <motion.div
                className="absolute inset-0 bg-gold/20"
                animate={{ opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="relative z-10 font-display font-bold text-xl tracking-widest text-goldLight">
                BEGIN THE RITUAL
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene 4: Photo Ritual */}
      <AnimatePresence>
        {currentScene === 4 && (
          <motion.div
            className="absolute inset-0 z-10 bg-background flex flex-col pt-20 px-6 pb-12"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 100 }}
          >
            <div className="text-center mb-8">
              <h3 className="font-display text-2xl text-gold mb-2">Sacred Scan</h3>
              <p className="text-muted text-sm">Complete your profile to unlock the reading</p>
            </div>
            <div className="flex-1 relative mt-4">
              {[
                { name: "Face Reading", icon: Eye, color: "border-surface" },
                { name: "Left Iris", icon: Eye, color: "border-surface" },
                { name: "Right Iris", icon: Eye, color: "border-surface" },
                { name: "Non-Dominant Palm", icon: Hand, color: "border-surface" },
                { name: "Dominant Palm", icon: Fingerprint, color: "border-gold", active: true },
              ].map((card, idx, arr) => {
                const zIndex = arr.length - idx;
                const offset = idx * 16;
                return (
                  <motion.div
                    key={idx}
                    className={`absolute w-full left-0 bg-surface rounded-2xl border ${card.color} p-5 shadow-2xl flex items-center justify-between`}
                    style={{ zIndex, top: `${offset}px`, transformOrigin: "top center" }}
                    initial={{ y: 100, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 - (idx * 0.05) }}
                    transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.5 + (arr.length - 1 - idx) * 0.2 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${card.active ? 'bg-gold/20' : 'bg-input'}`}>
                        <card.icon className={`w-6 h-6 ${card.active ? 'text-goldLight' : 'text-muted'}`} />
                      </div>
                      <div>
                        <p className={`font-semibold ${card.active ? 'text-cream' : 'text-muted'}`}>{card.name}</p>
                        <p className="text-xs text-muted mt-1">{card.active ? 'Tap to scan' : 'Pending...'}</p>
                      </div>
                    </div>
                    {card.active && (
                      <motion.div
                        className="w-10 h-10 rounded-full bg-gold flex items-center justify-center"
                        animate={{ scale: [1, 1.1, 1], boxShadow: ["0 0 0 0 rgba(201,168,76,0.4)", "0 0 0 10px rgba(201,168,76,0)", "0 0 0 0 rgba(201,168,76,0)"] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Camera className="w-5 h-5 text-background" />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
            <motion.div className="mt-auto text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}>
              <div className="text-gold/50 tracking-widest text-xs">─── ✦ ───</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
