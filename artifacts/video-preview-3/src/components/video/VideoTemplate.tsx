import { AnimatePresence, motion } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import Scene1Morning from '../../scenes/Scene1Morning';
import Scene2Journal from '../../scenes/Scene2Journal';
import Scene3Chat from '../../scenes/Scene3Chat';
import Scene4Community from '../../scenes/Scene4Community';
import Scene5Begin from '../../scenes/Scene5Begin';
import GlowOverlay from '../GlowOverlay';

const SCENE_DURATIONS = {
  morning: 4500,
  journal: 4500,
  chat: 4500,
  community: 4500,
  begin: 4000,
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({
    durations: SCENE_DURATIONS,
  });

  return (
    <div className="w-full h-full overflow-hidden relative bg-[#04040f] text-[#f0e6cc]">
      {/* Cross-scene persistent glow */}
      <GlowOverlay currentScene={currentScene} />

      <AnimatePresence mode="wait">
        {currentScene === 0 && <Scene1Morning key="morning" />}
        {currentScene === 1 && <Scene2Journal key="journal" />}
        {currentScene === 2 && <Scene3Chat key="chat" />}
        {currentScene === 3 && <Scene4Community key="community" />}
        {currentScene === 4 && <Scene5Begin key="begin" />}
      </AnimatePresence>
    </div>
  );
}
