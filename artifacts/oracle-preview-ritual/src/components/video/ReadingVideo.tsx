import { AnimatePresence, motion } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { StarField } from './video_scenes/StarField';
import { SceneHook } from './video_scenes/SceneHook';
import { SceneAppStoreClose } from './video_scenes/SceneAppStoreClose';
import { SceneCurrents } from './video_scenes/reading/SceneCurrents';
import { SceneCrossroads } from './video_scenes/reading/SceneCrossroads';
import { SceneArchetype } from './video_scenes/reading/SceneArchetype';

const SCENE_DURATIONS = {
  hook: 2800,
  currents: 4800,
  crossroads: 4800,
  archetype: 6500,
  close: 4200,
};

export default function ReadingVideo() {
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
          top: '50%',
          left: '50%',
          width: '160vmin',
          height: '160vmin',
          marginLeft: '-80vmin',
          marginTop: '-80vmin',
          background:
            'radial-gradient(circle, rgba(201,168,76,0.10) 0%, rgba(201,168,76,0.03) 35%, transparent 70%)',
        }}
        animate={{
          opacity: currentScene === 3 ? 1 : 0.55,
          scale: currentScene === 3 ? 1.15 : 1,
        }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      />

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && (
          <SceneHook
            key="hook"
            headline="A reading written for you."
            subline="Five chapters deep, every time."
          />
        )}
        {currentScene === 1 && <SceneCurrents key="currents" />}
        {currentScene === 2 && <SceneCrossroads key="crossroads" />}
        {currentScene === 3 && <SceneArchetype key="archetype" />}
        {currentScene === 4 && <SceneAppStoreClose key="close" />}
      </AnimatePresence>
    </div>
  );
}
