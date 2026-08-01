import React, { useMemo } from 'react';
import { useDesignaciones } from '../context/DesignacionesContext';
import { MapPin, Trophy, Clock, UserCheck, AlertTriangle, Edit2, Users } from 'lucide-react';

export const CronogramaGrid = ({ filteredDesignaciones, onEditModal }) => {
  const { selectedDateLabel } = useDesignaciones();

  // Extraer lista única de canchas del conjunto de designaciones filtradas
  const canchas = useMemo(() => {
    const set = new Set();
    filteredDesignaciones.forEach(d => {
      if (d && d.cancha) set.add(d.cancha.trim().toUpperCase());
    });
    const result = Array.from(set).sort();
    return result.length > 0 ? result : ['CANCHA 1', 'CANCHA 2', 'VILLA OLÍMPICA'];
  }, [filteredDesignaciones]);

  // Bloques de horas predeterminados para la grilla
  const timeSlots = useMemo(() => {
    const standardSlots = [
      '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
      '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
      '06:00 PM', '07:00 PM', '08:00 PM'
    ];
    
    // Incluir horas personalizadas si existen partidos fuera de la grilla estándar
    const matchTimes = filteredDesignaciones
      .map(d => d.hora ? d.hora.toUpperCase().trim() : null)
      .filter(Boolean);

    const merged = Array.from(new Set([...standardSlots, ...matchTimes]));
    return merged;
  }, [filteredDesignaciones]);

  // Mapa de cruces de árbitros en el mismo horario
  const refereeConflicts = useMemo(() => {
    const timeRefMap = new Map();
    const conflictsSet = new Set();

    filteredDesignaciones.forEach(d => {
      const time = (d.hora || '').trim().toUpperCase();
      if (!time) return;

      const refs = [
        d.arbitro_principal,
        d.asistente_1,
        d.asistente_2,
        d.emergente
      ].map(r => r ? r.trim().toUpperCase() : null).filter(Boolean);

      refs.forEach(ref => {
        const key = `${time}___${ref}`;
        if (timeRefMap.has(key)) {
          conflictsSet.add(d.id);
          conflictsSet.add(timeRefMap.get(key));
        } else {
          timeRefMap.set(key, d.id);
        }
      });
    });

    return conflictsSet;
  }, [filteredDesignaciones]);

  return (
    <div className="space-y-4">
      {/* Dynamic Subheader */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Matriz de Programación por Canchas ({canchas.length} Escenarios | {filteredDesignaciones.length} Partidos)</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500 inline-block" /> Programado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500 inline-block" /> Cruce Horario
          </span>
        </div>
      </div>

      {/* Grid Table Container */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-lg">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
              <th className="p-3 w-28 text-center sticky left-0 z-20 bg-slate-100 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-sm">
                Hora / Cancha
              </th>
              {canchas.map(cancha => (
                <th key={cancha} className="p-3 text-left border-r border-slate-200 dark:border-slate-800 min-w-[220px]">
                  <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-extrabold uppercase">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{cancha}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {timeSlots.map(slot => {
              // Filtrar si esta fila de hora tiene al menos 1 partido en alguna cancha
              const matchesInSlot = filteredDesignaciones.filter(d => (d.hora || '').trim().toUpperCase() === slot);
              if (matchesInSlot.length === 0) return null;

              return (
                <tr key={slot} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition">
                  {/* Left Column: Hour */}
                  <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-300 text-center sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm">
                    {slot}
                  </td>

                  {/* Columns per Cancha */}
                  {canchas.map(cancha => {
                    const matchesCell = matchesInSlot.filter(
                      d => (d.cancha || '').trim().toUpperCase() === cancha
                    );

                    return (
                      <td key={cancha} className="p-2 border-r border-slate-200 dark:border-slate-800 vertical-align-top">
                        {matchesCell.length === 0 ? (
                          <div className="h-full min-h-[48px] rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] text-slate-300 dark:text-slate-700 font-mono">
                            Libre
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {matchesCell.map(m => {
                              const hasConflict = refereeConflicts.has(m.id);

                              return (
                                <div
                                  key={m.id}
                                  onClick={() => onEditModal && onEditModal(m)}
                                  className={`p-3 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md group relative ${
                                    hasConflict
                                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                                      : 'bg-blue-50/60 dark:bg-slate-800/80 border-blue-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:border-blue-500'
                                  }`}
                                >
                                  {/* Conflict Badge */}
                                  {hasConflict && (
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 mb-1">
                                      <AlertTriangle className="w-3 h-3 shrink-0" />
                                      <span>¡Conflicto de Árbitro en esta hora!</span>
                                    </div>
                                  )}

                                  {/* Tournament / Category */}
                                  <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-400">
                                    <span className="truncate max-w-[140px] flex items-center gap-1">
                                      <Trophy className="w-3 h-3 text-amber-500 shrink-0" />
                                      {m.categoria_torneo || m.torneo || 'Categoría'}
                                    </span>
                                    <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-blue-600" />
                                  </div>

                                  {/* Teams */}
                                  <div className="font-extrabold text-xs my-1 text-slate-800 dark:text-white line-clamp-2">
                                    {m.partido || `${m.equipo_local} vs ${m.equipo_visitante}`}
                                  </div>

                                  {/* Terna Arbitral */}
                                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] space-y-0.5">
                                    <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                                      <UserCheck className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                                      <span className="truncate">{m.arbitro_principal || 'Sin asignar'}</span>
                                    </div>
                                    {(m.asistente_1 || m.asistente_2) && (
                                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                        A1: {m.asistente_1 || '-'} | A2: {m.asistente_2 || '-'}
                                      </div>
                                    )}
                                  </div>

                                  {/* Municipio Badge */}
                                  {m.municipio && m.municipio !== 'MONTERÍA' && (
                                    <div className="mt-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                                      📍 {m.municipio}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
