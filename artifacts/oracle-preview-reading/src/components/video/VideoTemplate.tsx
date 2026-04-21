import { AnimatePresence, motion } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { StarField } from './video_scenes/StarField';
import { SceneIntake } from './video_scenes/SceneIntake';
import { SceneCurrents } from './video_scenes/SceneCurrents';
import { SceneCrossroads } from './video_scenes/SceneCrossroads';
import { SceneArchetype } from './video_scenes/SceneArchetype';
import { SceneCounsel } from './video_scenes/SceneCounsel';

const SCENE_DURATIONS = {
  intake: 4000,
  currents: 5000,
  crossroads: 5000,
  archetype: 7000,
  counsel: 4500,
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
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
        {currentScene === 0 && <SceneIntake key="intake" />}
        {currentScene === 1 && <SceneCurrents key="currents" />}
        {currentScene === 2 && <SceneCrossroads key="crossroads" />}
        {currentScene === 3 && <SceneArchetype key="archetype" />}
        {currentScene === 4 && <SceneCounsel key="counsel" />}
      </AnimatePresence>
    </div>
  );
}
