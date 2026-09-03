import React from 'react';
import { Smartphone, Download, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenGuide?: () => void;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onOpenGuide,
  className = '',
}) => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();

  const handleClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success && onOpenGuide) {
        onOpenGuide();
      }
    } else if (onOpenGuide) {
      onOpenGuide();
    }
  };

  if (isInstalled) {
    return (
      <button
        type="button"
        onClick={onOpenGuide}
        title="App is installed on this device"
        className={`h-[34px] px-3 bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer ${className}`}
      >
        <Check className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Android App Active</span>
        <span className="sm:hidden">Installed</span>
      </button>
    );
  }

  return (
    <button
      id="pwaInstallAppButton"
      type="button"
      onClick={handleClick}
      title="Install ARCDESIGN as an Android app on your device"
      className={`h-[34px] px-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-black rounded flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer shrink-0 ${className}`}
    >
      <Smartphone className="w-4 h-4 text-emerald-200 shrink-0" />
      <span className="whitespace-nowrap">
        {isInstallable ? 'Install Android App' : 'Android App'}
      </span>
      <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] bg-white/20 rounded font-bold uppercase tracking-wider">
        PWA
      </span>
    </button>
  );
};
