import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Shield, X, AlertTriangle, CheckCircle2, Eye, EyeOff, Sparkles, Key } from 'lucide-react';

export const LoginForm = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('alejosierra656@gmail.com');
  const [password, setPassword] = useState('Alejandro10@');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      onClose();
    } catch (err) {
      setError('Credenciales incorrectas. Verifique el usuario y la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const setAdminPreset = () => {
    setUsername('alejosierra656@gmail.com');
    setPassword('Alejandro10@');
    setError('');
  };

  const setProfePreset = () => {
    setUsername('admin');
    setPassword('coarc2026');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-colors animate-slideUp sm:animate-fadeIn">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-blue-200 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 border border-amber-400/30 rounded-xl shadow-inner">
              <Shield className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Autenticación COARC</h2>
              <p className="text-xs text-blue-200">Acceso Seguro de Administración y Coordinación</p>
            </div>
          </div>
        </div>

        {/* Quick Role Fillers */}
        <div className="px-6 pt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={setAdminPreset}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              username.includes('alejosierra')
                ? 'bg-amber-500/10 border-amber-400 text-amber-600 dark:text-amber-300 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-amber-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>Administrador</span>
          </button>

          <button
            type="button"
            onClick={setProfePreset}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              username === 'admin'
                ? 'bg-blue-600/10 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300'
            }`}
          >
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>Coordinador Profe</span>
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Usuario / Correo Electrónico
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej: alejosierra656@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-200 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-200 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 hover:shadow-blue-600/20 active:scale-[0.99]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Autenticando...' : 'Iniciar Sesión'}</span>
            </button>
          </div>

          <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Sistema de Designaciones Arbitrales COARC 2026
            </p>
          </div>
        </form>

      </div>
    </div>
  );
};
