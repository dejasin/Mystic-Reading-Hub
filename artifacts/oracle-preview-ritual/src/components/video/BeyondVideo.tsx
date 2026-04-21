import { AnimatePresence, motion } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { StarField } from './video_scenes/StarField';
import { SceneChat } from './video_scenes/beyond/SceneChat';
import { SceneDeepDive } from './video_scenes/beyond/SceneDeepDive';
import { SceneSynastry } from './video_scenes/beyond/SceneSynastry';
import { SceneVault } from './video_scenes/beyond/SceneVault';
import { SceneCloseBeyond } from './video_scenes/beyond/SceneCloseBeyond';

const SCENE_DURATIONS = {
  chat: 5500,
  deepDive: 5000,
  synastry: 5500,
  vault: 5000,
  close: 4000,
};

export default function BeyondVideo() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <StarField />

      <motion.div
        className="absolute font-display"
        style={{
          top: '5vh',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 'clamp(9px, 1.4vmin, 14px)',
          letterSpacing: '0.55em',
          color: '#c9a84c',
          opacity: 0.55,
          textTransform: 'uppercase',
        }}
        animate={{
          opacity: currentScene === 4 ? 0 : 0.55,
          y: currentScene === 4 ? -10 : 0,
        }}
        transition={{ duration: 0.8 }}
      >
        The Oracle
      </motion.div>

      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: '110vmin',
          height: '110vmin',
          left: '50%',
          top: '50%',
          marginLeft: '-55vmin',
          marginTop: '-55vmin',
          background:
            'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 65%)',
        }}
        animate={{
          opacity: [0.7, 0.5, 0.9, 0.6, 1][currentScene] ?? 0.6,
        }}
        transition={{ duration: 1.4 }}
      />

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <SceneChat key="chat" />}
        {currentScene === 1 && <SceneDeepDive key="deepDive" />}
        {currentScene === 2 && <SceneSynastry key="synastry" />}
        {currentScene === 3 && <SceneVault key="vault" />}
        {currentScene === 4 && <SceneCloseBeyond key="close" />}
      </AnimatePresence>
    </div>
  );
}
