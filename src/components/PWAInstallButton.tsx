import React, { useState } from 'react';
import { Download, Share, X, Check, Smartphone, Monitor, ExternalLink, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'mobile' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'nav' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // If already installed in standalone mode, show subtle installed badge or null
  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg">
        <Check className="w-3.5 h-3.5 text-teal-600" />
        <span>Installed App</span>
      </span>
    );
  }

  const handleClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  return (
    <>
      {variant === 'nav' && (
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-xs hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          title="Install Scholarship Atlas as a standalone app"
        >
          <Download className="w-3.5 h-3.5 animate-pulse" />
          <span>Install App</span>
        </button>
      )}

      {variant === 'mobile' && (
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-teal-600 text-white font-semibold text-sm transition-colors shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <Download className="w-4 h-4" />
            <span>Install Scholarship Atlas App</span>
          </div>
          <span className="text-[10px] uppercase font-bold bg-teal-800/60 px-2 py-0.5 rounded text-teal-100">
            Free ($0)
          </span>
        </button>
      )}

      {variant === 'card' && (
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm"
        >
          <Download className="w-4 h-4 text-teal-400" />
          <span>Install on Your Device ($0)</span>
        </button>
      )}

      {/* Guide Modal for browsers where beforeinstallprompt is prevented (e.g. iframes, iOS Safari, desktop) */}
      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 text-slate-900 space-y-5 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <Smartphone className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Install Scholarship Atlas
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Works offline • No app store fees • Instant access
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context Note if inside preview iframe */}
            {isInIframe && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                  Viewing inside AI Studio Preview:
                </span>
                <p className="text-[11px] text-amber-950/80 leading-relaxed">
                  Web browsers restrict native app installation inside embedded preview panels. Open the app in its own tab to install with 1 click:
                </p>
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs"
                >
                  <span>Open Live App in New Tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Platform instructions */}
            <div className="space-y-3 text-xs text-slate-700">
              {/* Android / Chrome Desktop instructions */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-teal-600" />
                  <span>On Android or Chrome / Edge Desktop:</span>
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                  <li>
                    Look at your browser address bar on the right side for the <strong>Install</strong> icon (a computer monitor or phone with a down arrow).
                  </li>
                  <li>
                    Or click the <strong>three dots menu (⋮)</strong> at the top right of your browser and select <strong>"Install Scholarship Atlas"</strong> or <strong>"Add to Home Screen"</strong>.
                  </li>
                </ol>
              </div>

              {/* iOS Safari instructions */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-teal-600" />
                  <span>On iPhone / iPad (Safari):</span>
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
                  <li>
                    Tap the <strong>Share</strong> button <Share className="w-3 h-3 inline mx-0.5 text-teal-600" /> at the bottom of Safari.
                  </li>
                  <li>
                    Scroll down and tap <strong>"Add to Home Screen"</strong>.
                  </li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
