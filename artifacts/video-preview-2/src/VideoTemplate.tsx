import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import StarField from './components/StarField';
import Scene1Loading from './scenes/Scene1Loading';
import Scene2Reading from './scenes/Scene2Reading';
import Scene3DeepDive from './scenes/Scene3DeepDive';
import Scene4Career from './scenes/Scene4Career';
import Scene5Chat from './scenes/Scene5Chat';

const SCENE_DURATIONS = [4000, 5000, 5000, 4000, 4000];

export default function VideoTemplate() {
  const [scene, setScene] = useState(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const advance = (idx: number) => {
      timeout = setTimeout(() => {
        setScene((prev) => (prev + 1) % SCENE_DURATIONS.length);
      }, SCENE_DURATIONS[idx]);
    };
    advance(scene);
    return () => clearTimeout(timeout);
  }, [scene]);

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center">
      <StarField />
      
      <AnimatePresence mode="wait">
        {scene === 0 && <Scene1Loading key="s0" />}
        {scene === 1 && <Scene2Reading key="s1" />}
        {scene === 2 && <Scene3DeepDive key="s2" />}
        {scene === 3 && <Scene4Career key="s3" />}
        {scene === 4 && <Scene5Chat key="s4" />}
      </AnimatePresence>
    </div>
  );
}
