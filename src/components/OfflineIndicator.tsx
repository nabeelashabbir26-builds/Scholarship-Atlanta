import React from 'react';
import { WifiOff, Database, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 border border-slate-700/80 px-4 py-2.5 text-xs font-medium text-white shadow-xl animate-in slide-in-from-bottom-3 duration-200">
      <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
        <WifiOff className="w-4 h-4 text-amber-400" />
      </div>
      <div>
        <div className="flex items-center gap-1.5 font-bold text-amber-300">
          <span>Offline Mode Active</span>
        </div>
        <p className="text-[11px] text-slate-300">
          Browsing cached scholarship listings and local saved applications.
        </p>
      </div>
    </div>
  );
};
