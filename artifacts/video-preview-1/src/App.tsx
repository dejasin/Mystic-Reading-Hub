import VideoTemplate from './components/video/VideoTemplate';

export default function App() {
  return (
    <div className="w-full h-screen bg-background overflow-hidden relative flex items-center justify-center text-cream font-body text-[2vh]">
      <div className="w-[56.25vh] h-[100vh] max-w-full bg-background relative shadow-2xl overflow-hidden border-x border-surface/50">
        <VideoTemplate />
      </div>
    </div>
  );
}
