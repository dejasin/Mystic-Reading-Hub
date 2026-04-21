import { AnimatePresence, motion } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { StarField } from './video_scenes/StarField';
import { SceneSigil } from './video_scenes/ritual/SceneSigil';
import { SceneTagline } from './video_scenes/ritual/SceneTagline';
import { ScenePalmFrame } from './video_scenes/ritual/ScenePalmFrame';
import { ScenePalmTrace } from './video_scenes/ritual/ScenePalmTrace';
import { SceneClose } from './video_scenes/ritual/SceneClose';

const SCENE_DURATIONS = {
  sigil: 3500,
  tagline: 2800,
  frame: 3500,
  trace: 7000,
  close: 3500,
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
          opacity: [0.6, 0.9, 0.7, 1, 0.65][currentScene] ?? 0.7,
          scale: [1, 1.05, 0.95, 1.1, 1][currentScene] ?? 1,
        }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      />

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <SceneSigil key="sigil" />}
        {currentScene === 1 && <SceneTagline key="tagline" />}
        {currentScene === 2 && <ScenePalmFrame key="frame" />}
        {currentScene === 3 && <ScenePalmTrace key="trace" />}
        {currentScene === 4 && <SceneClose key="close" />}
      </AnimatePresence>
    </div>
  );
}
