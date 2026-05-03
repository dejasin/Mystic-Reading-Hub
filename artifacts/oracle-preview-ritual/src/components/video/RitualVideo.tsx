import { AnimatePresence, motion } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { StarField } from './video_scenes/StarField';
import { SceneHook } from './video_scenes/SceneHook';
import { SceneAppStoreClose } from './video_scenes/SceneAppStoreClose';
import { ScenePalmFrame } from './video_scenes/ritual/ScenePalmFrame';
import { ScenePalmTrace } from './video_scenes/ritual/ScenePalmTrace';

const SCENE_DURATIONS = {
  hook: 2800,
  frame: 3500,
  trace: 7000,
  close: 4200,
};

export default function RitualVideo() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <StarField />

      <motion.div
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          width: '180vmin',
          height: '180vmin',
          marginLeft: '-90vmin',
          marginTop: '-90vmin',
          background:
            'radial-gradient(circle at center, rgba(201,168,76,0.10) 0%, rgba(201,168,76,0.04) 30%, rgba(4,4,15,0) 60%)',
        }}
        animate={{
          opacity: [0.7, 0.9, 1, 0.7][currentScene] ?? 0.7,
          scale: [1, 1.05, 1.1, 1][currentScene] ?? 1,
        }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      />

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && (
          <SceneHook
            key="hook"
            headline="Your session starts with your palm."
            subline="Powered by your palm. Guided by AI."
          />
        )}
        {currentScene === 1 && <ScenePalmFrame key="frame" />}
        {currentScene === 2 && <ScenePalmTrace key="trace" />}
        {currentScene === 3 && <SceneAppStoreClose key="close" />}
      </AnimatePresence>
    </div>
  );
}
