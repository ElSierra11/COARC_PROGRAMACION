import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDesignaciones } from '../context/DesignacionesContext';
import {
  X,
  Shield,
  Users,
  Database,
  Download,
  Upload,
  Trash2,
  CheckCircle,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  Key,
  Layers
} from 'lucide-react';

export const AdminPanelModal = ({ isOpen, onClose }) => {
  const { user, isSuperAdmin } = useAuth();
  const { designaciones, customArbitros, disponibilidades } = useDesignaciones();

  const [activeTab, setActiveTab] = useState('backup'); // 'users' | 'backup' | 'metrics'

  // User Management State
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('PROFE');
  const [userCreatedMessage, setUserCreatedMessage] = useState(null);

  // Backup / Restore State
  const [backupMessage, setBackupMessage] = useState(null);

  if (!isOpen || !isSuperAdmin) return null;

  // Export Complete System Backup (JSON)
  const handleExportBackup = () => {
    const backupData = {
      app: 'COARC - Sistema de Designaciones Arbitrales',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      designaciones: designaciones || [],
      customArbitros: customArbitros || [],
      disponibilidades: disponibilidades || {}
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `coarc_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setBackupMessage("¡Copia de seguridad exportada y descargada exitosamente!");
  };

  // Import / Restore Backup JSON
  const handleImportBackup = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed.designaciones && Array.isArray(parsed.designaciones)) {
            localStorage.setItem('coarc_saved_designaciones', JSON.stringify(parsed.designaciones));
          }
          if (parsed.customArbitros && Array.isArray(parsed.customArbitros)) {
            localStorage.setItem('coarc_custom_arbitros', JSON.stringify(parsed.customArbitros));
          }
          if (parsed.disponibilidades) {
            localStorage.setItem('coarc_disponibilidades', JSON.stringify(parsed.disponibilidades));
          }
          setBackupMessage("¡Copia de seguridad restaurada! La aplicación se recargará automáticamente en 2 segundos...");
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } catch (err) {
          alert("El archivo de copia de seguridad no tiene un formato válido JSON.");
        }
      };
    }
  };

  // Handle Manual User Creation
  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;

    setUserCreatedMessage(`¡Usuario ${newUsername || newEmail} (${newRole}) registrado con éxito!`);
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
  };

  // Reset local state if needed
  const handleClearLocalData = () => {
    if (window.confirm("¿Estás seguro de que deseas restablecer los datos guardados localmente? Se recomienda hacer una copia de seguridad primero.")) {
      localStorage.removeItem('coarc_saved_designaciones');
      localStorage.removeItem('coarc_custom_arbitros');
      localStorage.removeItem('coarc_disponibilidades');
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-400/30 rounded-xl">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold">Panel de Administración General - COARC</h2>
              <p className="text-xs text-blue-200 font-mono">
                Sesión: <strong className="text-amber-300">{user?.email || 'alejosierra656@gmail.com'}</strong> (ROL: ADMIN)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-6 pt-3 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 ${
              activeTab === 'backup'
                ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Copias de Seguridad (Backup & Restore)</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 ${
              activeTab === 'users'
                ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Gestión de Usuarios</span>
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all border-b-2 ${
              activeTab === 'metrics'
                ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Métricas del Sistema</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">

          {/* TAB 1: BACKUPS */}
          {activeTab === 'backup' && (
            <div className="space-y-5 text-xs">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl text-blue-900 dark:text-blue-300 space-y-1">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>Resguardo de Información de la Corporación</span>
                </h3>
                <p>
                  Genera una copia de seguridad descargable en formato JSON que incluye todos los partidos creados, el catálogo de árbitros y sus estados de disponibilidad.
                </p>
              </div>

              {backupMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-semibold">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>{backupMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Download className="w-4 h-4 text-blue-600" />
                      <span>Exportar Copia de Seguridad</span>
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      Descarga un archivo <strong>.JSON</strong> con el estado completo del sistema.
                    </p>
                  </div>
                  <button
                    onClick={handleExportBackup}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Backup JSON</span>
                  </button>
                </div>

                {/* Import Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      <span>Restaurar Copia de Seguridad</span>
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      Sube un archivo <strong>.JSON</strong> de respaldo previo para restaurar los datos.
                    </p>
                  </div>
                  <label className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer text-center">
                    <Upload className="w-4 h-4" />
                    <span>Seleccionar Archivo JSON</span>
                    <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Restablecimiento Completo de Datos</span>
                    </h4>
                    <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                      Borra el estado de almacenamiento local para reiniciar la temporada.
                    </p>
                  </div>
                  <button
                    onClick={handleClearLocalData}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow transition shrink-0"
                  >
                    Restablecer Datos
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-4 text-xs">
              
              {userCreatedMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>{userCreatedMessage}</span>
                </div>
              )}

              {/* Form Create User */}
              <form onSubmit={handleCreateUser} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span>Crear Nuevo Usuario / Rol</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Nombre Completo:</label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Ej. Profesor Carlos"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Correo Electrónico:</label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Contraseña:</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Rol del Usuario:</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                    >
                      <option value="PROFE">Coordinador (PROFE)</option>
                      <option value="ADMIN">Administrador General (ADMIN)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition"
                  >
                    Registrar Usuario
                  </button>
                </div>
              </form>

              {/* Users List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 dark:text-slate-300">Usuarios Configurados</h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800">
                  <div className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">alejosierra656@gmail.com</div>
                      <div className="text-[11px] text-slate-500">Alejandro Sierra (Administrador)</div>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black rounded-lg text-[10px]">
                      ROL: ADMIN
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">admin (coordinador_profe)</div>
                      <div className="text-[11px] text-slate-500">Profesor / Coordinador COARC</div>
                    </div>
                    <span className="px-2.5 py-1 bg-blue-600 text-white font-black rounded-lg text-[10px]">
                      ROL: PROFE
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: METRICS */}
          {activeTab === 'metrics' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-1">
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {(designaciones || []).length}
                </div>
                <div className="font-bold text-slate-700 dark:text-slate-300">Partidos Programados</div>
                <div className="text-[10px] text-slate-400">Total en la base de datos</div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-1">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {(customArbitros || []).length}
                </div>
                <div className="font-bold text-slate-700 dark:text-slate-300">Árbitros Registrados</div>
                <div className="text-[10px] text-slate-400">En la lista maestra de autocompletado</div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-1">
                <div className="text-2xl font-black text-amber-500">
                  {Object.keys(disponibilidades || {}).length}
                </div>
                <div className="font-bold text-slate-700 dark:text-slate-300">Jornadas con Disponibilidad</div>
                <div className="text-[10px] text-slate-400">Fechas con marcación previa</div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
          >
            Cerrar Panel
          </button>
        </div>

      </div>
    </div>
  );
};
