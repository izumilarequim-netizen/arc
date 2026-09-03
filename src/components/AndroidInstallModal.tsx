import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  X,
  CheckCircle2,
  Share2,
  ExternalLink,
  Wifi,
  Zap,
  Sparkles,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  Package
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'install' | 'features' | 'apk'>('install');

  if (!isOpen) return null;

  const currentAppUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    currentAppUrl
  )}&color=0d0d0d&bgcolor=ffffff&margin=6`;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  const handleCopyUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentAppUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div
      id="androidInstallModalOverlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        id="androidInstallModalContainer"
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-gray-300 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#0d0d0d] text-white px-5 py-4 border-b-2 border-[#d11a2a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                  ARCDESIGN for Android
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                  PWA Ready
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Install as a standalone native-feel app on your Android smartphone or tablet
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-neutral-100 px-5 py-2 border-b border-gray-200 flex gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('install')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'install'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-neutral-200'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-[#d11a2a]" />
            <span>Install on Android</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'features'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-neutral-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Android Capabilities</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'apk'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-neutral-200'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-blue-500" />
            <span>Google Play / APK Packaging</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'install' && (
            <div className="space-y-6">
              {/* Status Banner */}
              {isInstalled ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold text-emerald-900 text-sm">
                      App is Already Installed!
                    </div>
                    <div className="text-xs text-emerald-700">
                      ARCDESIGN is running in standalone mode on this device with offline support enabled.
                    </div>
                  </div>
                </div>
              ) : isInstallable ? (
                <div className="p-4 bg-neutral-900 text-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-emerald-500 shadow-md">
                  <div className="flex items-center gap-3 text-center sm:text-left">
                    <img
                      src="/pwa-192x192.png"
                      alt="App Icon"
                      className="w-14 h-14 rounded-xl shadow-md border border-neutral-700"
                    />
                    <div>
                      <div className="font-black text-white text-base">
                        Ready for Instant Installation
                      </div>
                      <div className="text-xs text-gray-300">
                        Tap below to add ARCDESIGN to your Android home screen and app launcher.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-lg cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>INSTALL NOW</span>
                  </button>
                </div>
              ) : null}

              {/* Scan with Android Phone / Open URL */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white p-2 rounded-lg border border-gray-300 shadow-xs shrink-0">
                  <img
                    src={qrCodeUrl}
                    alt="Scan QR code on Android phone"
                    className="w-32 h-32 object-contain"
                  />
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-black text-gray-900 uppercase">
                    <QrCode className="w-4 h-4 text-[#d11a2a]" />
                    <span>Open on your Android phone</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Open your Android camera or QR scanner to launch this tracker directly on your phone.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={currentAppUrl}
                      className="w-full text-xs bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-700 font-mono select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold rounded flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedUrl ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Android Browser Guide */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Manual Installation Steps on Android</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Chrome on Android */}
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2">
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">
                        1
                      </span>
                      <span>Google Chrome (Android)</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 text-[11px] pl-1">
                      <li>Open this website in <strong>Chrome</strong>.</li>
                      <li>Tap the <strong>three dots (⋮)</strong> in the top-right corner.</li>
                      <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                      <li>Confirm <strong>"Install"</strong> when prompted.</li>
                    </ol>
                  </div>

                  {/* Samsung Internet on Android */}
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2">
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-black">
                        2
                      </span>
                      <span>Samsung Internet Browser</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 text-[11px] pl-1">
                      <li>Open this tracker in <strong>Samsung Internet</strong>.</li>
                      <li>Tap the <strong>Menu (☰)</strong> icon at the bottom.</li>
                      <li>Tap <strong>"Add page to"</strong> and pick <strong>"Home screen"</strong>.</li>
                      <li>Tap <strong>"Add"</strong> to complete installation.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-neutral-50 rounded-xl border border-gray-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-gray-900">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Fullscreen Standalone</span>
                  </div>
                  <p className="text-gray-600 text-[11px]">
                    Runs in fullscreen mode without browser URL bars or navigation buttons, delivering a true native app experience.
                  </p>
                </div>

                <div className="p-3.5 bg-neutral-50 rounded-xl border border-gray-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-gray-900">
                    <Wifi className="w-4 h-4 text-amber-600" />
                    <span>Offline Job Site Caching</span>
                  </div>
                  <p className="text-gray-600 text-[11px]">
                    Vite Workbox Service Worker automatically caches all code, styles, and assets so the app opens reliably with zero cell reception.
                  </p>
                </div>

                <div className="p-3.5 bg-neutral-50 rounded-xl border border-gray-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-gray-900">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Local Data Persistence</span>
                  </div>
                  <p className="text-gray-600 text-[11px]">
                    All worker records, attendance check-ins, overtime, notes, and bale values remain safely stored on your device.
                  </p>
                </div>

                <div className="p-3.5 bg-neutral-50 rounded-xl border border-gray-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-gray-900">
                    <Sparkles className="w-4 h-4 text-[#d11a2a]" />
                    <span>Android Adaptive Icons</span>
                  </div>
                  <p className="text-gray-600 text-[11px]">
                    Configured with 192px, 512px, and 512px maskable icons that seamlessly adapt to Samsung, Pixel, and Xiaomi squircle/circle launchers.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'apk' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <div className="font-bold text-blue-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Packaging into a Native Android APK / Google Play Bundle</span>
                </div>
                <p className="text-blue-800 text-[11px] leading-relaxed">
                  Because this app adheres strictly to standard <strong>W3C Web App Manifest</strong> and <strong>Service Worker</strong> specifications, you can convert it into an installable <code>.apk</code> or signed <code>.aab</code> package for the Google Play Store using trusted tools:
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 border border-gray-200 rounded-xl bg-white space-y-2">
                  <div className="font-bold text-gray-900 flex items-center justify-between">
                    <span>Option 1: PWABuilder (Recommended - Zero Code)</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                      Online & Free
                    </span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600 text-[11px]">
                    <li>Visit <a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline">pwabuilder.com</a>.</li>
                    <li>Paste your deployed app URL: <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">{currentAppUrl}</code></li>
                    <li>Click <strong>"Package for Android"</strong> to download a ready-to-sign Android Studio project or APK.</li>
                  </ol>
                </div>

                <div className="p-3.5 border border-gray-200 rounded-xl bg-white space-y-2">
                  <div className="font-bold text-gray-900 flex items-center justify-between">
                    <span>Option 2: Google's Official Bubblewrap CLI</span>
                    <span className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded font-bold">
                      CLI Tool
                    </span>
                  </div>
                  <p className="text-gray-600 text-[11px]">
                    Run Google's official Trusted Web Activity (TWA) tool to generate an APK locally:
                  </p>
                  <pre className="bg-neutral-900 text-emerald-400 p-2.5 rounded font-mono text-[10px] overflow-x-auto">
{`npm install -g @bubblewrap/cli
bubblewrap init --manifest="${currentAppUrl}/manifest.webmanifest"
bubblewrap build`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-100 px-5 py-3 border-t border-gray-200 flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">
            Theme: Obsidian & Red • PWA Manifest v1.0
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
