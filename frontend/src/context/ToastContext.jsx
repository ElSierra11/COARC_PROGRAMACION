import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext();

const TOAST_CONFIGS = {
  success: {
    bar: 'bg-emerald-500',
    border: 'border-emerald-700/60',
    bg: 'bg-slate-900',
    text: 'text-emerald-200',
    icon: CheckCircle,
    iconColor: 'text-emerald-400'
  },
  error: {
    bar: 'bg-rose-500',
    border: 'border-rose-700/60',
    bg: 'bg-slate-900',
    text: 'text-rose-200',
    icon: AlertCircle,
    iconColor: 'text-rose-400'
  },
  warning: {
    bar: 'bg-amber-500',
    border: 'border-amber-700/60',
    bg: 'bg-slate-900',
    text: 'text-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-400'
  },
  info: {
    bar: 'bg-blue-500',
    border: 'border-blue-700/60',
    bg: 'bg-slate-900',
    text: 'text-blue-200',
    icon: Info,
    iconColor: 'text-blue-400'
  }
};

const ToastItem = ({ toast, onRemove }) => {
  const cfg = TOAST_CONFIGS[toast.type] || TOAST_CONFIGS.info;
  const Icon = cfg.icon;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl text-xs font-semibold min-w-[240px] max-w-[340px] relative overflow-hidden ${cfg.bg} ${cfg.border} ${cfg.text}`}
      style={{
        animation: 'toastSlideIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both'
      }}
    >
      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${cfg.bar}`}
        style={{
          animation: `toastProgress ${toast.duration}ms linear both`
        }}
      />
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.iconColor}`} />
      <span className="flex-1 leading-relaxed">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-0.5 rounded hover:bg-white/10 transition mt-0.5"
      >
        <X className="w-3.5 h-3.5 opacity-50 hover:opacity-100" />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-4), { id, message, type, duration }]);
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Container — top-right, above everything */}
      <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>

      {/* Keyframe CSS injected once */}
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(40px) scale(0.9); }
          to   { opacity: 1; transform: translateX(0)   scale(1); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
