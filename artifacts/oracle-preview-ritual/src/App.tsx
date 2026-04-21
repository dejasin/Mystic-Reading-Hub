import { useEffect, useState } from 'react';
import { Stage886x1920 } from '@/components/Stage886x1920';
import RitualVideo from '@/components/video/RitualVideo';
import ReadingVideo from '@/components/video/ReadingVideo';
import BeyondVideo from '@/components/video/BeyondVideo';
import { PreviewIndex } from '@/components/PreviewIndex';

type Route = 'index' | 'ritual' | 'reading' | 'beyond';

function parseRoute(): Route {
  const h = (window.location.hash || '').replace(/^#\/?/, '').toLowerCase();
  if (h === 'ritual' || h === 'reading' || h === 'beyond') return h;
  return 'index';
}

function isCaptureMode(): boolean {
  return new URLSearchParams(window.location.search).get('capture') === '1';
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute());
  const [capture, setCapture] = useState<boolean>(() => isCaptureMode());

  useEffect(() => {
    const onHash = () => setRoute(parseRoute());
    const onSearch = () => setCapture(isCaptureMode());
    window.addEventListener('hashchange', onHash);
    window.addEventListener('popstate', onSearch);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('popstate', onSearch);
    };
  }, []);

  if (route === 'index') {
    return <PreviewIndex />;
  }

  return (
    <Stage886x1920 fit={!capture}>
      {route === 'ritual' && <RitualVideo />}
      {route === 'reading' && <ReadingVideo />}
      {route === 'beyond' && <BeyondVideo />}
    </Stage886x1920>
  );
}
