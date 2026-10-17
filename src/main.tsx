import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for offline support
registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('[Scholarship Atlas] Service worker active. App ready to work offline.');
  },
  onNeedRefresh() {
    console.log('[Scholarship Atlas] New content available.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
