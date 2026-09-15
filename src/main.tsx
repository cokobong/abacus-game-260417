import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { DinosaurAssetReview } from './components/DinosaurAssetReview.tsx';
import './index.css';

const showAssetReview = import.meta.env.DEV
  && new URLSearchParams(window.location.search).get('asset-review') === '1';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {showAssetReview ? <DinosaurAssetReview /> : <App />}
  </StrictMode>,
);
