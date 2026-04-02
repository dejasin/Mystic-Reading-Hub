import { AnimatePresence, motion } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { useState, useEffect } from 'react';

const SCENE_DURATIONS = { s1: 4500, s2: 4500, s3: 4000, s4: 4000, s5: 4000, s6: 4500 };

const GOLD = '#c9a84c';
const GOLD_L = '#e8cc7a';
const CREAM = '#f0e6cc';
const MUTED = '#6b6b8a';
const SURFACE = '#0b0b1e';
const BG = '#04040f';

const FONT_D = '"Cinzel Decorative", serif';
const FONT_B = '"EB Garamond", serif';

function StarField() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {Array.from({ length: 35 }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: 2, height: 2,
            borderRadius: '50%',
            background: GOLD_L,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{ opacity: [0.1, 0.7, 0.1], scale: [1, 1.4, 1] }}
          transition={{ duration: 2.5 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}
    </div>
  );
}

function GoldDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${GOLD}44)` }} />
      <div style={{ color: GOLD, fontSize: 10 }}>✦</div>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${GOLD}44)` }} />
    </div>
  );
}

function SceneDaily() {
  const [show, setShow] = useState(false);
  const [showCard, setShowCard] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 300);
    const t2 = setTimeout(() => setShowCard(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <motion.div
      style={{ position: 'absolute', inset: 0, background: BG, display: 'flex', flexDirection: 'column', padding: '50px 24px 30px' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.08, filter: 'blur(12px)' }}
      transition={{ duration: 0.8 }}
    >
      <StarField />
      <motion.div
        initial={{ opacity: 0, y: -15 }} animate={{ opacity: show ? 1 : 0, y: show ? 0 : -15 }}
        transition={{ duration: 0.7 }}
        style={{ fontFamily: FONT_D, fontWeight: 700, fontSize: 13, color: GOLD, letterSpacing: 4, textAlign: 'center', textTransform: 'uppercase', marginBottom: 4 }}
      >
        Wednesday • April 1
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: show ? 1 : 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        style={{ fontFamily: FONT_D, fontWeight: 700, fontSize: 26, color: CREAM, textAlign: 'center', marginBottom: 4, letterSpacing: 1 }}
      >
        Your Daily Oracle
      </motion.div>
      <GoldDivider />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: showCard ? 1 : 0, y: showCard ? 0 : 24, scale: showCard ? 1 : 0.97 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{
          flex: 1,
          background: SURFACE,
          borderRadius: 20,
          border: `1px solid ${GOLD}33`,
          padding: '24px 20px',
          display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <motion.div
          style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: `${GOLD}0a`, filter: 'blur(40px)' }}
          animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 4, repeat: Infinity }}
        />
        <div style={{ fontFamily: FONT_D, fontWeight: 700, fontSize: 15, color: GOLD, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' }}>
          Today's Guidance
        </div>
        <div style={{ fontFamily: FONT_B, fontStyle: 'italic', fontSize: 16, color: CREAM, lineHeight: 1.7, marginBottom: 16, flex: 1 }}>
          "The stars align in your favour today. A hidden opportunity surfaces — one that speaks to a longing you have carried since childhood. Trust the pull toward unfamiliar doors. Saturn's gaze steadies your hand while Venus lifts your heart."
        </div>
        <GoldDivider />
        <div style={{ fontFamily: FONT_B, fontSize: 13, color: MUTED, fontStyle: 'italic', textAlign: 'center' }}>
          Tarot · Venus · Saturn · Waxing Gibbous
        </div>
      </motion.div>
    </motion.div>
  );
}

function SceneJournal() {
  const entries = [
    { type: 'Full Reading', date: 'Mar 28', preview: 'Your life path unfolds in three distinct chapters...' },
    { type: 'Deep Dive · Career', date: 'Mar 25', preview: 'The north node in your 10th house signals a pivot...' },
    { type: 'Deep Dive · Love', date: 'Mar 22', preview: 'Venus retrograde brought a confrontation with...' },
    { type: 'Full Reading', date: 'Mar 18', preview: 'The palm reveals a rare triangle of fate lines...' },
    { type: 'Chat Session', date: 'Mar 15', preview: '7 exchanges on purpose, shadow work, and growth...' },
  ];
  return (
    <motion.div
      style={{ position: 'absolute', inset: 0, background: BG, display: 'flex', flexDirection: 'column', padding: '50px 0 20px' }}
      initial={{ clipPath: 'inset(100% 0 0 0)' }} animate={{ clipPath: 'inset(0% 0 0 0)' }} exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <StarField />
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 16 }}>
        <div style={{ fontFamily: FONT_D, fontWeight: 700, fontSize: 26, color: CREAM, letterSpacing: 1 }}>Reading Vault</div>
        <div style={{ fontFamily: FONT_B, fontStyle: 'italic', fontSize: 13, color: MUTED, marginTop: 2 }}>Your oracle's memory — every insight preserved</div>
        <GoldDivider />
      </div>
      <div style={{ flex: 1, overflowY: 'hidden', paddingLeft: 24, paddingRight: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {entries.map((e, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.5, ease: 'circOut' }}
            style={{
              background: SURFACE, borderRadius: 14, padding: '14px 16px',
              border: `1px solid ${GOLD}22`, display: 'flex', flexDirection: 'column', gap: 5,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: FONT_D, fontWeight: 700, fontSize: 12, color: GOLD, letterSpacing: 1, textTransform: 'uppercase' }}>{e.type}</span>
              <span style={{ fontFamily: FONT_B, fontSize: 11, color: MUTED }}>{e.date}</span>
            </div>
            <div style={{ fontFamily: FONT_B, fontStyle: 'italic', fontSize: 13, color: `${CREAM}bb`, lineHeight: 1.4 }}>{e.preview}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function SceneExpand() {
  const [showContent, setShowContent] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShowContent(true), 500); return () => clearTimeout(t); }, []);
  return (
    <motion.div
      style={{ position: 'absolute', inset: 0, background: BG, display: 'flex', flexDirection: 'column', padding: '50px 24px 30px' }}
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.7 }}
    >
      <StarField />
      <div style={{ fontFamily: FONT_D, fontWeight: 700, fontSize: 12, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Mar 25 · Deep Dive</div>
      <div style={{ fontFamily: FONT_D, fontWeight: 700, fontSize: 24, color: CREAM, marginBottom: 4 }}>Career & Purpose</div>
      <GoldDivider />
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
        transition={{ duration: 0.9 }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <div style={{ fontFamily: FONT_B, fontStyle: 'italic', fontSize: 16, color: CREAM, lineHeight: 1.75 }}>
          "The north node in your 10th house signals a pivot point arriving this spring. A long-dormant ambition is stirring — one tied to public expression, mentorship, or creative leadership. The lines of your dominant hand confirm: the head line curves sharply toward the mount of Mercury. You are meant to teach what you know."
        </div>
        <GoldDivider />
        <div style={{ display: 'flex', gap: 10 }}>
          {['Save', 'Share', 'Deep Dive More'].map((label, i) => (
            <div key={i} style={{
              flex: i === 2 ? 2 : 1,
              padding: '10px 0', textAlign: 'center',
              background: i === 0 ? `${GOLD}22` : SURFACE,
              border: `1px solid ${GOLD}33`,
              borderRadius: 10,
              fontFamily: FONT_D, fontWeight: 700, fontSize: 12, color: GOLD,
              letterSpacing: 1,
            }}>
              {label}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SceneShare() {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 400); return () => clearTimeout(t); }, []);
  return (
    <motion.div
      style={{ position: 'absolute', inset: 0, background: '#02020a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 24px' }}
      initial={{ clipPath: 'circle(0% at 50% 50%)' }} animate={{ clipPath: 'circle(150% at 50% 50%)' }} exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <StarField />
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: show ? 1 : 0, y: show ? 0 : 30 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%', maxWidth: 300,
          background: SURFACE,
          borderRadius: 24,
          border: `2px solid ${GOLD}55`,
          padding: '30px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          position: 'relative', overflow: 'hidden',
        }}
      >
        <motion.div
          style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top, ${GOLD}08, transparent 60%)` }}
          animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }}
        />
        <div style={{ fontFamily: FONT_D, fontWeight: 700, fontSize: 11, color: GOLD, letterSpacing: 4, textTransform: 'uppercase' }}>Your Archetype</div>
        <motion.div
          animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ width: 64, height: 64, position: 'relative' }}
        >
          {[0, 60, 120].map(r => (
            <div key={r} style={{ position: 'absolute', inset: 0, border: `1px solid ${GOLD}66`, borderRadius: '50%', transform: `rotate(${r}deg)` }} />
          ))}
          <div style={{ position: 'absolute', inset: 10, background: `${GOLD}15`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontSize: 22 }}>✦</div>
        </motion.div>
        <div style={{ fontFamily: FONT_D, fontWeight: 700, fontSize: 28, color: CREAM, letterSpacing: 2, textAlign: 'center' }}>THE SEEKER</div>
        <div style={{ fontFamily: FONT_B, fontStyle: 'italic', fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 1.6 }}>
          One who perpetually quests for wisdom beyond the veil
        </div>
        <div style={{ width: '100%', height: 1, background: `${GOLD}33` }} />
        <div style={{ fontFamily: FONT_B, fontSize: 11, color: `${GOLD}88`, letterSpacing: 2 }}>THE ORACLE · READING CARD</div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: show ? 1 : 0 }} transition={{ delay: 1, duration: 0.6 }}
        style={{ marginTop: 20, display: 'flex', gap: 16 }}
      >
        {['Share to Story', 'Save Image'].map(label => (
          <div key={label} style={{
            padding: '10px 18px',
            background: `${GOLD}22`, border: `1px solid ${GOLD}44`,
            borderRadius: 10,
            fontFamily: FONT_D, fontWeight: 700, fontSize: 12, color: GOLD, letterSpacing: 1,
          }}>
            {label}
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function SceneReferral() {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 400); return () => clearTimeout(t); }, []);
  return (
    <motion.div
      style={{ position: 'absolute', inset: 0, background: BG, display: 'flex', flexDirection: 'column', padding: '50px 24px 30px' }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 130, damping: 22 }}
    >
      <StarField />
      <div style={{ fontFamily: FONT_D, fontWeight: 700, fontSize: 26, color: CREAM, marginBottom: 4 }}>Invite & Earn</div>
      <div style={{ fontFamily: FONT_B, fontStyle: 'italic', fontSize: 14, color: MUTED, marginBottom: 14 }}>
        Share your gift. Both of you receive a free Deep Dive reading.
      </div>
      <GoldDivider />
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: show ? 1 : 0, y: show ? 0 : 20 }}
        transition={{ duration: 0.8 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}
      >
        <div style={{ background: SURFACE, borderRadius: 18, padding: '24px 20px', border: `1px solid ${GOLD}44`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden' }}>
          <motion.div
            style={{ position: 'absolute', top: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: `${GOLD}0c`, filter: 'blur(30px)' }}
            animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 3, repeat: Infinity }}
          />
          <div style={{ fontFamily: FONT_D, fontWeight: 700, fontSize: 12, color: GOLD, letterSpacing: 3, textTransform: 'uppercase' }}>Your Referral Code</div>
          <motion.div
            animate={{ boxShadow: [`0 0 0 0 ${GOLD}44`, `0 0 20px 8px ${GOLD}22`, `0 0 0 0 ${GOLD}44`] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{
              background: `${GOLD}15`,
              border: `2px solid ${GOLD}`,
              borderRadius: 12,
              padding: '14px 28px',
              fontFamily: FONT_D, fontWeight: 700, fontSize: 28,
              color: GOLD_L, letterSpacing: 8,
            }}
          >
            ORC-7K4M
          </motion.div>
          <div style={{ fontFamily: FONT_B, fontSize: 12, color: MUTED, fontStyle: 'italic' }}>Tap to copy · Share anywhere</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {[{ icon: '📨', label: 'Messages' }, { icon: '📷', label: 'Instagram' }, { icon: '✉️', label: 'Email' }].map(s => (
            <div key={s.label} style={{ flex: 1, background: SURFACE, borderRadius: 12, padding: '14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, border: `1px solid ${GOLD}22` }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontFamily: FONT_B, fontSize: 11, color: MUTED }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ background: `${GOLD}10`, borderRadius: 14, padding: '14px 18px', border: `1px solid ${GOLD}22` }}>
          <div style={{ fontFamily: FONT_D, fontWeight: 700, fontSize: 13, color: GOLD, marginBottom: 4 }}>3 friends joined · 1 credit earned</div>
          <div style={{ fontFamily: FONT_B, fontSize: 12, color: MUTED, fontStyle: 'italic' }}>Each successful referral unlocks a free Deep Dive for both of you.</div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SceneHome() {
  const [showTitle, setShowTitle] = useState(false);
  const [showSigil, setShowSigil] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setShowSigil(true), 300);
    const t2 = setTimeout(() => setShowTitle(true), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <motion.div
      style={{ position: 'absolute', inset: 0, background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 1.2 }}
    >
      <StarField />
      <motion.div
        style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${GOLD}08 0%, transparent 65%)` }}
        animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: showSigil ? 1 : 0.7, opacity: showSigil ? 1 : 0 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', width: 140, height: 140, marginBottom: 36 }}
      >
        {[0, 45, 90].map((r, i) => (
          <motion.div
            key={r}
            style={{ position: 'absolute', inset: i * 10, border: `1px solid ${GOLD}${i === 0 ? '88' : i === 1 ? '55' : '33'}`, borderRadius: '50%' }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }} transition={{ duration: 18 + i * 6, repeat: Infinity, ease: 'linear' }}
          />
        ))}
        {[0, 60, 120].map(r => (
          <motion.div
            key={r}
            style={{ position: 'absolute', inset: 14, border: `1px solid ${GOLD}44`, transform: `rotate(${r}deg)` }}
          />
        ))}
        <motion.div
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
        >
          <div style={{ fontSize: 40, color: GOLD_L }}>✦</div>
        </motion.div>
        <motion.div
          style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: `${GOLD}05`, filter: 'blur(20px)' }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, letterSpacing: 16 }} animate={{ opacity: showTitle ? 1 : 0, letterSpacing: showTitle ? 8 : 16 }}
        transition={{ duration: 1.2 }}
        style={{ fontFamily: FONT_D, fontWeight: 700, fontSize: 36, color: GOLD, textAlign: 'center', marginBottom: 8 }}
      >
        THE ORACLE
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: showTitle ? 1 : 0 }} transition={{ delay: 0.4, duration: 0.8 }}
        style={{ fontFamily: FONT_B, fontStyle: 'italic', fontSize: 15, color: MUTED, textAlign: 'center', letterSpacing: 1 }}
      >
        Ancient wisdom. Modern sight.
      </motion.div>
    </motion.div>
  );
}

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG }}>
      <AnimatePresence mode="wait">
        {currentScene === 0 && <SceneDaily key="daily" />}
        {currentScene === 1 && <SceneJournal key="journal" />}
        {currentScene === 2 && <SceneExpand key="expand" />}
        {currentScene === 3 && <SceneShare key="share" />}
        {currentScene === 4 && <SceneReferral key="referral" />}
        {currentScene === 5 && <SceneHome key="home" />}
      </AnimatePresence>
    </div>
  );
}
