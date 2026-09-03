import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface MobileInstallBannerProps {
  onOpenGuide: () => void;
}

export const MobileInstallBanner: React.FC<MobileInstallBannerProps> = ({
  onOpenGuide,
}) => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('arcdesign_install_banner_dismissed') === 'true') {
        setIsDismissed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('arcdesign_install_banner_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  const handleInstall = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        onOpenGuide();
      }
    } else {
      onOpenGuide();
    }
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <div
      id="mobileInstallBanner"
      className="md:hidden bg-neutral-900 border-b-2 border-emerald-500 text-white px-3 py-2.5 flex items-center justify-between gap-2 shadow-md"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
          <Smartphone className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-black text-white flex items-center gap-1.5 truncate">
            <span>Install Android App</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-[9px] font-black uppercase text-neutral-950">
              Offline
            </span>
          </div>
          <div className="text-[10px] text-gray-400 truncate">
            Add to your home screen for quick site access
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleInstall}
          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 text-gray-400 hover:text-white rounded transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
