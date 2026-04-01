import VideoTemplate from './VideoTemplate';

export default function App() {
  return (
    <div className="w-full h-[100dvh] bg-[#000] flex items-center justify-center">
      {/* Container forcing 9:16 aspect ratio */}
      <div className="relative w-full max-w-[450px] aspect-[9/16] bg-oracle-bg overflow-hidden shadow-2xl">
        <VideoTemplate />
      </div>
    </div>
  );
}
