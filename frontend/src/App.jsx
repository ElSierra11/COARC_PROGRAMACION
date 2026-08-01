import React, { useState, Component } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DesignacionesProvider } from './context/DesignacionesContext';
import { Navbar } from './components/Navbar';
import { DesignacionesTable } from './components/DesignacionesTable';
import { DesignacionModal } from './components/DesignacionModal';
import { ArbitrosStatsModal } from './components/ArbitrosStatsModal';
import { WhatsAppExportModal } from './components/WhatsAppExportModal';
import { LoginForm } from './components/LoginForm';
import { OfficialCoarcPrintSheet } from './components/OfficialCoarcPrintSheet';
import { AdminPanelModal } from './components/AdminPanelModal';
import { Shield, RefreshCw, Plus, Calendar, Activity, Share2, Printer, Lock } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary atrapó un error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-xl space-y-4">
            <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center mx-auto text-amber-400">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold">Restablecimiento de Sistema COARC</h2>
            <p className="text-xs text-slate-300">
              Diagnóstico de actualización:
            </p>
            <div className="p-3 bg-slate-950 rounded-lg text-[11px] text-rose-400 font-mono text-left overflow-auto max-h-32 border border-slate-800 break-all">
              {this.state.error?.toString()}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Restaurar App y Cargar Vista</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminPanelModalOpen, setIsAdminPanelModalOpen] = useState(false);
  const [editingDesignacion, setEditingDesignacion] = useState(null);

  const { isAdmin, isSuperAdmin, logout, user, requireAuth } = useAuth();

  const handleOpenNewModalProtected = () => {
    requireAuth(
      () => { setEditingDesignacion(null); setIsNewModalOpen(true); },
      'Para programar un nuevo partido debes iniciar sesión con tus credenciales de Coordinador Arbitral.'
    );
  };

  const handleEditModal = (des) => {
    setEditingDesignacion(des);
    setIsNewModalOpen(true);
  };

  const handleCloseNewModal = () => {
    setIsNewModalOpen(false);
    setEditingDesignacion(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 pb-20 md:pb-12">
      
      {/* Navbar Header */}
      <Navbar
        onOpenNewModal={handleOpenNewModalProtected}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
        onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenAdminModal={() => setIsAdminPanelModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <DesignacionesTable onEditModal={handleEditModal} />
      </main>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        onClick={handleOpenNewModalProtected}
        className="md:hidden fixed right-4 bottom-20 z-40 bg-blue-700 hover:bg-blue-800 text-white p-4 rounded-full shadow-2xl flex items-center justify-center border-2 border-amber-400 active:scale-95 transition-transform cursor-pointer"
        aria-label="Programar Partido"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-2 pb-safe flex items-center justify-around text-[10px] font-bold text-slate-600 dark:text-slate-400 no-print shadow-lg">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center gap-1 p-1 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <Calendar className="w-5 h-5 text-blue-600" />
          <span>Partidos</span>
        </button>

        <button
          onClick={() => setIsStatsModalOpen(true)}
          className="flex flex-col items-center gap-1 p-1 hover:text-amber-600 dark:hover:text-amber-400"
        >
          <Activity className="w-5 h-5 text-amber-500" />
          <span>Carga</span>
        </button>

        <button
          onClick={() => setIsWhatsAppModalOpen(true)}
          className="flex flex-col items-center gap-1 p-1 hover:text-emerald-600 dark:hover:text-emerald-400"
        >
          <Share2 className="w-5 h-5 text-emerald-500" />
          <span>WhatsApp</span>
        </button>

        <button
          onClick={() => window.print()}
          className="flex flex-col items-center gap-1 p-1 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <Printer className="w-5 h-5 text-indigo-500" />
          <span>Imprimir</span>
        </button>

        <button
          onClick={isSuperAdmin ? logout : () => setIsLoginModalOpen(true)}
          className="flex flex-col items-center gap-1 p-1 text-amber-600 dark:text-amber-400"
        >
          <Lock className="w-5 h-5 text-amber-500" />
          <span>{isSuperAdmin ? 'Salir Admin' : 'Ingresar'}</span>
        </button>
      </nav>

      {/* Modals */}
      <DesignacionModal
        isOpen={isNewModalOpen}
        onClose={handleCloseNewModal}
        initialData={editingDesignacion}
      />

      <ArbitrosStatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
      />

      <WhatsAppExportModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
      />

      <LoginForm
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <AdminPanelModal
        isOpen={isAdminPanelModalOpen}
        onClose={() => setIsAdminPanelModalOpen(false)}
      />

      {/* Printable Sheet (Rendered on Ctrl+P) */}
      <OfficialCoarcPrintSheet />

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <DesignacionesProvider>
            <AppContent />
          </DesignacionesProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
