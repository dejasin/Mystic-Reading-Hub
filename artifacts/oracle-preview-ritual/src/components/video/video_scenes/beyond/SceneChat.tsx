import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const userMsg = 'Will the work I am doing be remembered?';
const oracleReply = 'Not by the names you fear, but by the hands you taught.';

export function SceneChat() {
  const [showUser, setShowUser] = useState(false);
  const [oracleChars, setOracleChars] = useState(0);

  useEffect(() => {
    const userT = setTimeout(() => setShowUser(true), 400);

    const startReply = 1700;
    const charDelay = 50;
    const charTimers: number[] = [];
    for (let i = 1; i <= oracleReply.length; i++) {
      charTimers.push(
        window.setTimeout(() => setOracleChars(i), startReply + i * charDelay),
      );
    }
    return () => {
      clearTimeout(userT);
      charTimers.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center px-[7vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="font-display text-gold"
        style={{
          alignSelf: 'center',
          fontSize: 'clamp(11px, 1.8vmin, 18px)',
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          opacity: 0.7,
          marginBottom: '5vh',
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 0.7, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        Oracle Chat
      </motion.div>

      <motion.div
        className="self-end"
        style={{
          maxWidth: '78%',
          padding: 'clamp(14px, 2.4vh, 28px) clamp(18px, 3vw, 30px)',
          borderRadius: '24px 24px 6px 24px',
          background: 'rgba(20,18,42,0.85)',
          border: '1px solid rgba(201,168,76,0.25)',
          marginBottom: '4vh',
        }}
        initial={{ opacity: 0, x: 30, scale: 0.95 }}
        animate={
          showUser
            ? { opacity: 1, x: 0, scale: 1 }
            : { opacity: 0, x: 30, scale: 0.95 }
        }
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="font-serif text-cream italic"
          style={{
            fontSize: 'clamp(16px, 3.4vmin, 32px)',
            lineHeight: 1.4,
          }}
        >
          {userMsg}
        </div>
      </motion.div>

      <motion.div
        className="self-start relative"
        style={{
          maxWidth: '82%',
          padding: 'clamp(14px, 2.4vh, 28px) clamp(18px, 3vw, 30px)',
          borderRadius: '24px 24px 24px 6px',
          background:
            'linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0.06) 100%)',
          border: '1px solid rgba(201,168,76,0.5)',
          boxShadow: '0 0 32px rgba(201,168,76,0.15)',
          minHeight: 'clamp(60px, 10vh, 110px)',
        }}
        initial={{ opacity: 0, x: -30, scale: 0.95 }}
        animate={
          showUser
            ? { opacity: 1, x: 0, scale: 1 }
            : { opacity: 0, x: -30, scale: 0.95 }
        }
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="font-serif text-gold-light italic"
          style={{
            fontSize: 'clamp(16px, 3.4vmin, 32px)',
            lineHeight: 1.4,
            minHeight: '1em',
          }}
        >
          {oracleReply.slice(0, oracleChars)}
          <motion.span
            style={{
              display: 'inline-block',
              width: '0.55ch',
              height: '1em',
              background: '#e8cc7a',
              marginLeft: '2px',
              verticalAlign: 'text-bottom',
            }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.7, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
