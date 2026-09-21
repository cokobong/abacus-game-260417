import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { DinosaurAssetReview } from './components/DinosaurAssetReview.tsx';
import { IceFossilPrototypeHost } from './components/screens/IceFossilPrototypeHost.tsx';
import { IceFossilSliceHost } from './components/screens/IceFossilSliceHost.tsx';
import { IceContinentGameHost } from './components/screens/IceContinentGameHost.tsx';
import './index.css';

const showAssetReview = import.meta.env.DEV
  && new URLSearchParams(window.location.search).get('asset-review') === '1';
const params = new URLSearchParams(window.location.search);
const showIcePrototype = params.get('icePrototype') === '1';
const showIceSlice = params.get('icePrototype') === '2';
const showIceMission = params.has('iceMission');

const root = createRoot(document.getElementById('root')!);
if (showIceMission) {
  root.render(<StrictMode><div className="h-dvh w-full"><IceContinentGameHost runId={`dev-${Date.now()}`} onExit={() => window.location.assign(window.location.pathname)} onFinishRun={(_runId, rewards) => rewards} onRetry={() => window.location.reload()} /></div></StrictMode>);
} else if (showIceSlice) {
  root.render(<StrictMode><div className="h-dvh w-full"><IceFossilSliceHost onExit={() => window.location.assign(window.location.pathname)} /></div></StrictMode>);
} else if (showIcePrototype) {
  root.render(<StrictMode><div className="h-dvh w-full"><IceFossilPrototypeHost onExit={() => window.location.assign(window.location.pathname)} /></div></StrictMode>);
} else {
  root.render(<StrictMode>{showAssetReview ? <DinosaurAssetReview /> : <App />}</StrictMode>);
}
