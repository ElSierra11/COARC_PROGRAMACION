import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, RefreshCw, Share } from 'lucide-react';

export const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      // Show banner after 2 seconds for iOS
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }

    // 3. Listen for Android / Chrome / Edge PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSTip(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSTip(false);
  };

  if (isInstalled || (!showBanner && !needRefresh)) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Installation Banner */}
      {showBanner && !isInstalled && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-bounce-short">
          <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-4 rounded-2xl shadow-2xl border border-blue-500/30 backdrop-blur-md flex items-center justify-between gap-3">
            
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-md border border-white/20">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  Instalar COARC App
                  <span className="bg-blue-500/30 text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase border border-blue-400/30">
                    PWA Rápida
                  </span>
                </span>
                <span className="text-xs text-slate-300">
                  Acceso directo rápido y funcionamiento sin conexión.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Instalar</span>
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIOSTip && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 max-w-sm w-full p-6 rounded-3xl shadow-2xl border border-blue-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-extrabold text-base">Instalar en iOS (iPhone / iPad)</h3>
              </div>
              <button onClick={() => setShowIOSTip(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Para instalar la app de COARC en tu pantalla de inicio en iOS:
            </p>

            <ol className="space-y-2 text-xs font-medium text-slate-700 dark:text-slate-200">
              <li className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">1</span>
                <span>Toca el botón <strong className="text-blue-600 dark:text-blue-400">Compartir <Share className="w-3.5 h-3.5 inline ml-0.5" /></strong> en Safari.</span>
              </li>
              <li className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">2</span>
                <span>Desplázate hacia abajo y elige <strong className="text-blue-600 dark:text-blue-400">"Agregar a inicio"</strong>.</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSTip(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
