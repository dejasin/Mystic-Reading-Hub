import { AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '../../lib/video';
import StarField from '../StarField';
import Scene1Loading from '../../scenes/Scene1Loading';
import Scene2Reading from '../../scenes/Scene2Reading';
import Scene3DeepDive from '../../scenes/Scene3DeepDive';
import Scene4Career from '../../scenes/Scene4Career';
import Scene5Chat from '../../scenes/Scene5Chat';

const SCENE_DURATIONS = { s1: 4000, s2: 5000, s3: 5000, s4: 4000, s5: 4000 };

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center">
      <StarField />
      <AnimatePresence mode="wait">
        {currentScene === 0 && <Scene1Loading key="s1" />}
        {currentScene === 1 && <Scene2Reading key="s2" />}
        {currentScene === 2 && <Scene3DeepDive key="s3" />}
        {currentScene === 3 && <Scene4Career key="s4" />}
        {currentScene === 4 && <Scene5Chat key="s5" />}
      </AnimatePresence>
    </div>
  );
}
