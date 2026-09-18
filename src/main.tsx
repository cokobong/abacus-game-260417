import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { DinosaurAssetReview } from './components/DinosaurAssetReview.tsx';
import { IceFossilPrototypeHost } from './components/screens/IceFossilPrototypeHost.tsx';
import './index.css';

const showAssetReview = import.meta.env.DEV
  && new URLSearchParams(window.location.search).get('asset-review') === '1';
const params = new URLSearchParams(window.location.search);
const showIcePrototype = params.get('icePrototype') === '1';

const root = createRoot(document.getElementById('root')!);
if (showIcePrototype) {
  root.render(<StrictMode><div className="h-dvh w-full"><IceFossilPrototypeHost onExit={() => window.location.assign(window.location.pathname)} /></div></StrictMode>);
} else {
  root.render(<StrictMode>{showAssetReview ? <DinosaurAssetReview /> : <App />}</StrictMode>);
}
