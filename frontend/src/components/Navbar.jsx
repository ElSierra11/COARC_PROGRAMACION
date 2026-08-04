import React, { useState, useEffect } from 'react';
import { CoarcLogo } from './CoarcLogo';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useDesignaciones } from '../context/DesignacionesContext';
import {
  Sun,
  Moon,
  Plus,
  Share2,
  Printer,
  Activity,
  LogOut,
  UserCheck,
  Calendar,
  Lock,
  Menu,
  X,
  Shield,
  DollarSign,
  FileSpreadsheet,
  Cloud,
  CloudOff,
  CheckCircle2,
  Loader2
} from 'lucide-react';

export const Navbar = ({
  onOpenNewModal,
  onOpenStatsModal,
  onOpenWhatsAppModal,
  onOpenLoginModal,
  onOpenAdminModal,
  onOpenPresupuestoModal,
  onOpenCalendarioModal,
  onOpenImportModal
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAdmin, isSuperAdmin, requireAuth } = useAuth();
  const {
    selectedDateIso,
    setSelectedDateIso,
    selectedDateLabel,
    setSelectedDateLabel,
    setSearchQuery,
    setSelectedCancha,
    setSelectedTorneo,
    setSelectedMunicipio
  } = useDesignaciones();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'pending' | 'success' | 'error'

  // Escuchar eventos de sincronización desde cloudSyncService
  useEffect(() => {
    let successTimer;
    const handleSyncEvent = (e) => {
      const { status } = e.detail || {};
      setSyncStatus(status);
      if (status === 'success') {
        // Volver a idle después de 3 segundos
        clearTimeout(successTimer);
        successTimer = setTimeout(() => setSyncStatus('idle'), 3000);
      }
    };
    window.addEventListener('coarc-sync', handleSyncEvent);
    return () => {
      window.removeEventListener('coarc-sync', handleSyncEvent);
      clearTimeout(successTimer);
    };
  }, []);

  const handleLogoClick = () => {
    setSearchQuery('');
    setSelectedCancha('');
    setSelectedTorneo('');
    setSelectedMunicipio('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logout();
    onOpenLoginModal();
  };

  const handleDateChange = (e) => {
    const isoVal = e.target.value;
    setSelectedDateIso(isoVal);
    
    if (isoVal) {
      const parts = isoVal.split('-');
      const year = parts[0];
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      
      const dateObj = new Date(year, month - 1, day);
      const daysStr = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
      const monthsStr = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
      
      const dayName = daysStr[dateObj.getDay()];
      const dayNum = day < 10 ? `0${day}` : `${day}`;
      const monthName = monthsStr[month - 1];
      
      setSelectedDateLabel(`${dayName} ${dayNum} ${monthName}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenNewMatchProtected = () => {
    requireAuth(
      onOpenNewModal,
      'Para programar un nuevo partido debes iniciar sesión con tus credenciales de Coordinador Arbitral.'
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-blue-100 dark:border-slate-800 shadow-sm transition-colors duration-200 no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Logo */}
        <CoarcLogo onClick={handleLogoClick} />

        {/* Indicador de Sincronización con la Nube */}
        {syncStatus !== 'idle' && (
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
            syncStatus === 'pending'
              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
              : syncStatus === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300'
          }`}>
            {syncStatus === 'pending' && <Loader2 className="w-3 h-3 animate-spin" />}
            {syncStatus === 'success' && <CheckCircle2 className="w-3 h-3" />}
            {syncStatus === 'error'   && <CloudOff className="w-3 h-3" />}
            <span>
              {syncStatus === 'pending' ? 'Sincronizando...' : syncStatus === 'success' ? 'Nube Sincronizada' : 'Sin conexión'}
            </span>
          </div>
        )}

        {/* Date Selector Banner & Calendar Modal Trigger */}
        <div className="hidden md:flex items-center gap-2 bg-blue-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">
          <button
            onClick={onOpenCalendarioModal}
            className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition"
            title="Abrir Vista de Calendario Interactivo"
          >
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider">{selectedDateLabel}</span>
          </button>
          <input
            type="date"
            value={selectedDateIso}
            onChange={handleDateChange}
            className="ml-1 bg-transparent text-xs font-semibold focus:outline-none cursor-pointer text-blue-700 dark:text-blue-300"
          />
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-2">
          
          {/* Botón Presupuesto Corporativo */}
          <button
            onClick={onOpenPresupuestoModal}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Ver Presupuesto Corporativo de Ingresos y Egresos"
          >
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Presupuesto</span>
          </button>

          {/* Workload Stats */}
          <button
            onClick={onOpenStatsModal}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Ver Carga de Partidos por Árbitro"
          >
            <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Carga Árbitros</span>
          </button>

          {/* WhatsApp Share / Image / Office */}
          <button
            onClick={onOpenWhatsAppModal}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Exportar WhatsApp / Imagen / Office"
          >
            <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp / Exportar</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Imprimir Hoja Oficial"
          >
            <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Imprimir</span>
          </button>

          {/* Import Excel Button */}
          <button
            onClick={onOpenImportModal}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Cargar e Importar Programación desde Archivo Excel (.xlsx, .csv)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Importar Excel</span>
          </button>

          {/* New Match Button */}
          <button
            onClick={handleOpenNewMatchProtected}
            className="bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:shadow active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Programar Partido</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Cambiar Tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Admin Panel Button for SuperAdmin */}
          {isSuperAdmin ? (
            <button
              onClick={onOpenAdminModal}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow transition-all border border-amber-300"
            >
              <Shield className="w-4 h-4 text-slate-950" />
              <span>Panel Admin</span>
            </button>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all border border-slate-200 dark:border-slate-700"
              title="Iniciar sesión como Administrador General"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Ingresar Admin</span>
            </button>
          )}

          {/* User Profile */}
          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-2">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">
                {user?.full_name || 'Invitado (Lectura)'}
              </span>
              <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase">
                {user?.role || 'COARC'}
              </span>
            </div>
            {user && (
              <button
                onClick={handleLogout}
                className="p-2 text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800/80 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Header Right Controls */}
        <div className="flex md:hidden items-center gap-1.5">
          {user && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-xs">
              {user.role === 'ADMIN' ? 'ADMIN' : 'PROFE'}
            </span>
          )}

          {/* Quick Calendar Trigger Badge (Mobile) */}
          <button
            onClick={onOpenCalendarioModal}
            className="flex items-center gap-1 bg-blue-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-blue-100 dark:border-slate-700 text-[11px] font-bold text-blue-900 dark:text-blue-200"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span className="truncate max-w-[110px]">{selectedDateLabel}</span>
          </button>

          {/* Theme Toggle Mobile */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg focus:outline-none"
            aria-label="Abrir Menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-rose-500" /> : <Menu className="w-6 h-6 text-blue-600" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-blue-100 dark:border-slate-800 px-4 pt-2 pb-4 space-y-3 animate-fadeIn shadow-lg">
          
          {/* Mobile User Status */}
          {user ? (
            <div className="p-3 bg-blue-50/70 dark:bg-slate-800/80 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{user.full_name}</p>
                <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase">{user.role}</p>
              </div>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-lg flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => { onOpenLoginModal(); setMobileMenuOpen(false); }}
              className="w-full p-2.5 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Ingresar Profe / Coordinador</span>
            </button>
          )}

          {/* Actions List */}
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <button
              onClick={() => { onOpenPresupuestoModal(); setMobileMenuOpen(false); }}
              className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 rounded-xl flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Presupuesto</span>
            </button>

            <button
              onClick={() => { onOpenCalendarioModal(); setMobileMenuOpen(false); }}
              className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 rounded-xl flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Calendario</span>
            </button>

            <button
              onClick={() => { onOpenStatsModal(); setMobileMenuOpen(false); }}
              className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 rounded-xl flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-amber-600" />
              <span>Carga Árbitros</span>
            </button>

            <button
              onClick={() => { onOpenWhatsAppModal(); setMobileMenuOpen(false); }}
              className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 rounded-xl flex items-center gap-2"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>Exportar WA/Office</span>
            </button>

            <button
              onClick={() => { handlePrint(); setMobileMenuOpen(false); }}
              className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200 rounded-xl flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleOpenNewMatchProtected();
              }}
              className="p-3 bg-blue-700 text-white rounded-xl flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Partido</span>
            </button>
          </div>

        </div>
      )}
    </header>
  );
};
