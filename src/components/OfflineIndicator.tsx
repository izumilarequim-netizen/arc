import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="offlineNoticeBanner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50 flex items-center gap-3 rounded-xl bg-neutral-900/95 text-white border-2 border-amber-500 px-4 py-2.5 shadow-2xl backdrop-blur-md animate-bounce"
    >
      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
        <WifiOff className="w-4 h-4" />
      </div>
      <div className="text-xs">
        <div className="font-bold text-amber-400 flex items-center gap-1.5">
          <span>Job Site Offline Mode Active</span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        </div>
        <div className="text-gray-300 text-[11px]">
          All timesheet changes are securely stored locally on this device.
        </div>
      </div>
    </div>
  );
};
