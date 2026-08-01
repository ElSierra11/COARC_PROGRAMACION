import React, { useState } from 'react';
import { useDesignaciones } from '../context/DesignacionesContext';
import {
  X,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Search,
  Clock,
  MapPin,
  Users,
  Shield,
  Layers
} from 'lucide-react';

export const ArbitrosStatsModal = ({ isOpen, onClose }) => {
  const { arbitroStats, selectedDateLabel } = useDesignaciones();
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen) return null;

  const safeStats = Array.isArray(arbitroStats) ? arbitroStats : [];
  const filteredStats = safeStats.filter(s =>
    s && s.nombre && s.nombre.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-xl max-w-3xl w-full max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden transition-colors animate-slideUp sm:animate-fadeIn">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-400/30 rounded-xl">
              <Activity className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold">Control de Carga y Balance de Árbitros</h2>
              <p className="text-xs text-blue-200">Resumen de partidos por juez - {selectedDateLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-blue-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Buscar por nombre de árbitro..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-200"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 1-2 Normal
            </span>
            <span className="flex items-center gap-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-1 rounded border border-amber-200 dark:border-amber-800">
              <Activity className="w-3 h-3 text-amber-600" /> 3 Moderado
            </span>
            <span className="flex items-center gap-1 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-1 rounded border border-rose-200 dark:border-rose-800">
              <AlertTriangle className="w-3 h-3 text-rose-600" /> 4+ Excesivo
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {filteredStats.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
              No hay registros de partidos asignados a ningún árbitro en esta fecha.
            </div>
          ) : (
            filteredStats.map((stat, idx) => {
              const total = stat.total_partidos;

              let statusColor = "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20";
              let badgeStyle = "bg-emerald-600 text-white";
              let statusText = "Carga Adecuada";

              if (total === 3) {
                statusColor = "border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20";
                badgeStyle = "bg-amber-600 text-white";
                statusText = "Jornada Completa";
              } else if (total >= 4) {
                statusColor = "border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20";
                badgeStyle = "bg-rose-600 text-white";
                statusText = "Alerta: Sobrecarga de Partidos";
              }

              return (
                <div
                  key={idx}
                  className={`border rounded-xl p-4 transition-all ${statusColor}`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                        {stat.nombre}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${badgeStyle}`}>
                        {total} {total === 1 ? 'Partido' : 'Partidos'}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      {statusText}
                    </span>
                  </div>

                  {/* Match Schedule Detail list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    {stat.detalles_partidos.map((det, i) => (
                      <div
                        key={i}
                        className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-blue-900 dark:text-blue-300">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-600" />
                            {det.hora}
                          </span>
                          <span className="text-amber-700 dark:text-amber-400 font-extrabold">
                            {det.cancha}
                          </span>
                        </div>
                        <div className="text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>{det.torneo} ({det.categoria})</span>
                          <span className="font-bold text-slate-500 text-[10px] uppercase">
                            [{det.rol}]
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition-colors"
          >
            Cerrar Resumen
          </button>
        </div>

      </div>
    </div>
  );
};
