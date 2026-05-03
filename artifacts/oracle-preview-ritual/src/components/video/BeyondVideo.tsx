import { AnimatePresence, motion } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { StarField } from './video_scenes/StarField';
import { SceneHook } from './video_scenes/SceneHook';
import { SceneAppStoreClose } from './video_scenes/SceneAppStoreClose';
import { SceneChat } from './video_scenes/beyond/SceneChat';
import { SceneDeepDive } from './video_scenes/beyond/SceneDeepDive';
import { SceneSynastry } from './video_scenes/beyond/SceneSynastry';
import { SceneVault } from './video_scenes/beyond/SceneVault';

const SCENE_DURATIONS = {
  hook: 2800,
  chat: 5000,
  deepDive: 4500,
  synastry: 5000,
  vault: 4500,
  close: 4200,
};

export default function BeyondVideo() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });
  const isHook = currentScene === 0;
  const isClose = currentScene === 5;

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
          opacity: isHook || isClose ? 0 : 0.55,
          y: isHook || isClose ? -10 : 0,
        }}
        transition={{ duration: 0.6 }}
      >
        Oracle
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
          opacity: [0.7, 0.5, 0.9, 0.6, 0.8, 1][currentScene] ?? 0.6,
        }}
        transition={{ duration: 1.4 }}
      />

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && (
          <SceneHook
            key="hook"
            headline="Your daily AI life advisor."
            subline="Chat, deep dives, synastry, vault."
          />
        )}
        {currentScene === 1 && <SceneChat key="chat" />}
        {currentScene === 2 && <SceneDeepDive key="deepDive" />}
        {currentScene === 3 && <SceneSynastry key="synastry" />}
        {currentScene === 4 && <SceneVault key="vault" />}
        {currentScene === 5 && <SceneAppStoreClose key="close" />}
      </AnimatePresence>
    </div>
  );
}
