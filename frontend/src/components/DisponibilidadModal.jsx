import React, { useState, useMemo } from 'react';
import { useDesignaciones } from '../context/DesignacionesContext';
import { X, Calendar, CheckCircle2, AlertCircle, Clock, Search, ShieldAlert, UserCheck, MessageSquare, Trash2, Sun, Moon, XCircle } from 'lucide-react';

export const DisponibilidadModal = ({ isOpen, onClose }) => {
  const {
    selectedDateIso,
    selectedDateLabel,
    arbitros,
    customArbitros,
    addCustomArbitros,
    removeCustomArbitro,
    designaciones,
    disponibilidades,
    updateDisponibilidad
  } = useDesignaciones();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'DISPONIBLE' | 'SOLO_MANANA' | 'SOLO_TARDE' | 'NO_DISPONIBLE'
  const [newArbitroName, setNewArbitroName] = useState('');

  // Lista unificada de todos los árbitros conocidos (API + Custom + Asignados en Partidos)
  const allRefereesList = useMemo(() => {
    const fromApi = (arbitros || []).map(a => (a.nombre || a).trim().toUpperCase());
    const fromCustom = (customArbitros || []).map(c => c.trim().toUpperCase());
    const fromDesignaciones = (designaciones || []).flatMap(d => [
      d?.arbitro_principal,
      d?.asistente_1,
      d?.asistente_2,
      d?.emergente
    ]).filter(Boolean).map(n => n.trim().toUpperCase());

    const combined = Array.from(new Set([...fromApi, ...fromCustom, ...fromDesignaciones])).filter(Boolean).sort();
    return combined;
  }, [arbitros, customArbitros, designaciones]);

  if (!isOpen) return null;

  const handleAddManualArbitro = (e) => {
    e.preventDefault();
    if (!newArbitroName.trim()) return;
    addCustomArbitros([newArbitroName]);
    setNewArbitroName('');
  };

  const fechaDispMap = disponibilidades[selectedDateIso] || {};

  const filteredReferees = allRefereesList.filter(name => {
    if (searchTerm && !name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    const currentObj = fechaDispMap[name] || { estado: 'DISPONIBLE' };
    if (filterStatus !== 'ALL' && currentObj.estado !== filterStatus) {
      return false;
    }
    return true;
  });

  const handleStatusChange = (name, newStatus) => {
    const currentObj = fechaDispMap[name] || { nota: '' };
    updateDisponibilidad(selectedDateIso, name, newStatus, currentObj.nota || '');
  };

  const handleNotaChange = (name, newNota) => {
    const currentObj = fechaDispMap[name] || { estado: 'DISPONIBLE' };
    updateDisponibilidad(selectedDateIso, name, currentObj.estado, newNota);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Gestión de Disponibilidad Previa</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Jornada: <span className="font-bold text-blue-600 dark:text-blue-400">{selectedDateLabel}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar árbitro por nombre..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Quick Add Referee Input */}
            <form onSubmit={handleAddManualArbitro} className="flex gap-1">
              <input
                type="text"
                value={newArbitroName}
                onChange={(e) => setNewArbitroName(e.target.value)}
                placeholder="+ Nombre del Árbitro"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-blue-900 dark:text-blue-200 focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!newArbitroName.trim()}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-40"
              >
                Agregar
              </button>
            </form>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1 rounded-lg border transition ${
                filterStatus === 'ALL'
                  ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              Todos ({allRefereesList.length})
            </button>
            <button
              onClick={() => setFilterStatus('DISPONIBLE')}
              className={`px-3 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                filterStatus === 'DISPONIBLE'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-slate-900 text-emerald-600 border-emerald-200 dark:border-emerald-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Disponible Todo el Día</span>
            </button>
            <button
              onClick={() => setFilterStatus('SOLO_MANANA')}
              className={`px-3 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                filterStatus === 'SOLO_MANANA'
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white dark:bg-slate-900 text-amber-600 border-amber-200 dark:border-amber-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Solo Mañana (AM)</span>
            </button>
            <button
              onClick={() => setFilterStatus('SOLO_TARDE')}
              className={`px-3 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                filterStatus === 'SOLO_TARDE'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white dark:bg-slate-900 text-amber-700 border-amber-300 dark:border-amber-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Solo Tarde (PM)</span>
            </button>
            <button
              onClick={() => setFilterStatus('NO_DISPONIBLE')}
              className={`px-3 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                filterStatus === 'NO_DISPONIBLE'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white dark:bg-slate-900 text-rose-600 border-rose-200 dark:border-rose-900'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>No Disponible</span>
            </button>
          </div>
        </div>

        {/* Referees List */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800 space-y-1">
          {filteredReferees.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <UserCheck className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="font-semibold">No hay árbitros en esta lista aún.</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Puedes registrar nombres con el botón "+ Nombre del Árbitro" arriba o se guardarán automáticamente a medida que los asignes en cualquier partido.
              </p>
            </div>
          ) : (
            filteredReferees.map(name => {
              const currentObj = fechaDispMap[name] || { estado: 'DISPONIBLE', nota: '' };
              const currentStatus = currentObj.estado || 'DISPONIBLE';

              return (
                <div key={name} className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-all">
                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>{name}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomArbitro(name)}
                        className="p-1 ml-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded transition-colors"
                        title={`Eliminar a ${name} de la lista`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* Inline note input */}
                    <div className="mt-1 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={currentObj.nota || ''}
                        onChange={(e) => handleNotaChange(name, e.target.value)}
                        placeholder="Agregar nota (ej. permiso, viaja)..."
                        className="text-[11px] px-2 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:ring-1 focus:ring-blue-500 w-64"
                      />
                    </div>
                  </div>

                  {/* Status Selector Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      title="Disponible Todo el Día"
                      onClick={() => handleStatusChange(name, 'DISPONIBLE')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition border flex items-center gap-1 ${
                        currentStatus === 'DISPONIBLE'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-emerald-50 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Todo el día</span>
                    </button>
                    <button
                      title="Solo Mañana (AM)"
                      onClick={() => handleStatusChange(name, 'SOLO_MANANA')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg transition border flex items-center gap-1 ${
                        currentStatus === 'SOLO_MANANA'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-amber-50 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Sun className="w-3 h-3" />
                      <span>AM</span>
                    </button>
                    <button
                      title="Solo Tarde (PM)"
                      onClick={() => handleStatusChange(name, 'SOLO_TARDE')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg transition border flex items-center gap-1 ${
                        currentStatus === 'SOLO_TARDE'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-amber-50 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Moon className="w-3 h-3" />
                      <span>PM</span>
                    </button>
                    <button
                      title="No Disponible"
                      onClick={() => handleStatusChange(name, 'NO_DISPONIBLE')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition border flex items-center gap-1 ${
                        currentStatus === 'NO_DISPONIBLE'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-50 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <XCircle className="w-3 h-3" />
                      <span>No Disponible</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition"
          >
            Guardar y Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
