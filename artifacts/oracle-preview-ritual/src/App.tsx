import { useEffect, useState, type ReactElement } from 'react';
import { StageVideo } from '@/components/StageVideo';
import { Stage1242x2688 } from '@/components/Stage1242x2688';
import RitualVideo from '@/components/video/RitualVideo';
import ReadingVideo from '@/components/video/ReadingVideo';
import BeyondVideo from '@/components/video/BeyondVideo';
import { PreviewIndex } from '@/components/PreviewIndex';
import { Shot1Ritual } from '@/components/screenshots/Shot1Ritual';
import { Shot2Reading } from '@/components/screenshots/Shot2Reading';
import { Shot3Chat } from '@/components/screenshots/Shot3Chat';
import { Shot4Journal } from '@/components/screenshots/Shot4Journal';
import { Shot5Synastry } from '@/components/screenshots/Shot5Synastry';
import {
  DEFAULT_PREVIEW_SIZE,
  PREVIEW_SIZES,
  isPreviewSizeKey,
  type PreviewSizeKey,
} from '@/lib/previewSizes';

type VideoRoute = 'ritual' | 'reading' | 'beyond';
type ShotRoute = 'shot-1' | 'shot-2' | 'shot-3' | 'shot-4' | 'shot-5';
type Route = 'index' | VideoRoute | ShotRoute;

const VIDEO_ROUTES: VideoRoute[] = ['ritual', 'reading', 'beyond'];
const SHOT_ROUTES: ShotRoute[] = ['shot-1', 'shot-2', 'shot-3', 'shot-4', 'shot-5'];

function parseRoute(): Route {
  const h = (window.location.hash || '').replace(/^#\/?/, '').toLowerCase();
  if ((VIDEO_ROUTES as string[]).includes(h)) return h as VideoRoute;
  if ((SHOT_ROUTES as string[]).includes(h)) return h as ShotRoute;
  return 'index';
}

function isCaptureMode(): boolean {
  return new URLSearchParams(window.location.search).get('capture') === '1';
}

function parseSize(): PreviewSizeKey {
  const raw = new URLSearchParams(window.location.search).get('size');
  return isPreviewSizeKey(raw) ? raw : DEFAULT_PREVIEW_SIZE;
}

const SHOT_COMPONENTS: Record<ShotRoute, () => ReactElement> = {
  'shot-1': Shot1Ritual,
  'shot-2': Shot2Reading,
  'shot-3': Shot3Chat,
  'shot-4': Shot4Journal,
  'shot-5': Shot5Synastry,
};

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute());
  const [capture, setCapture] = useState<boolean>(() => isCaptureMode());
  const [size, setSize] = useState<PreviewSizeKey>(() => parseSize());

  useEffect(() => {
    const onHash = () => setRoute(parseRoute());
    const onSearch = () => {
      setCapture(isCaptureMode());
      setSize(parseSize());
    };
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

  if ((SHOT_ROUTES as string[]).includes(route)) {
    const Shot = SHOT_COMPONENTS[route as ShotRoute];
    return (
      <Stage1242x2688 fit={!capture}>
        <Shot />
      </Stage1242x2688>
    );
  }

  const stageSize = PREVIEW_SIZES[size];
  return (
    <StageVideo width={stageSize.width} height={stageSize.height} fit={!capture}>
      {route === 'ritual' && <RitualVideo />}
      {route === 'reading' && <ReadingVideo />}
      {route === 'beyond' && <BeyondVideo />}
    </StageVideo>
  );
}
