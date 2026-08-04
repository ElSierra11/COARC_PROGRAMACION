import React, { useMemo } from 'react';
import { useDesignaciones } from '../context/DesignacionesContext';
import {
  X,
  DollarSign,
  CheckCircle2,
  Clock,
  UserCheck,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  CheckCheck
} from 'lucide-react';

export const HonorariosModal = ({ isOpen, onClose }) => {
  const {
    designaciones,
    selectedDateLabel,
    selectedDateIso,
    pagosState,
    togglePagoArbitro,
    setPagoArbitroStatus,
    updateDesignacion
  } = useDesignaciones();

  const safeDesignaciones = Array.isArray(designaciones) ? designaciones : [];

  const handleFeeChange = (desId, rolKey, val) => {
    const numericVal = val === '' ? 0 : parseInt(val, 10);
    const des = safeDesignaciones.find(d => d.id === desId);
    if (!des) return;
    const fieldToUpdate = rolKey === 'Principal' ? 'tarifa_principal' : 'tarifa_asistente';
    updateDesignacion(desId, {
      ...des,
      [fieldToUpdate]: isNaN(numericVal) ? 0 : numericVal
    });
  };

  // Calcular agregación de honorarios por partido y por árbitro (solo para la jornada seleccionada)
  const { refereePayroll, totalJornada, totalPagado, totalPendiente } = useMemo(() => {
    let grandTotal = 0;
    let paidTotal = 0;
    const refereeMap = {};

    // Filtrar solo los partidos de la fecha activa
    const desJornada = safeDesignaciones.filter(
      d => !d.fecha_iso || d.fecha_iso === selectedDateIso
    );

    desJornada.forEach((des, idx) => {
      const desId = des.id || `des_${idx}`;
      const feePrincipal = des.tarifa_principal !== undefined && des.tarifa_principal !== null ? parseInt(des.tarifa_principal, 10) : 0;
      const feeAsistente = des.tarifa_asistente !== undefined && des.tarifa_asistente !== null ? parseInt(des.tarifa_asistente, 10) : 0;

      const roles = [
        { name: des.arbitro_principal, rol: 'Principal', fee: feePrincipal, rolKey: 'Principal' },
        { name: des.es_cuadra ? des.asistente_1 : null, rol: 'Asistente 1', fee: feeAsistente, rolKey: 'Asistente' },
        { name: des.es_cuadra ? des.asistente_2 : null, rol: 'Asistente 2', fee: feeAsistente, rolKey: 'Asistente' },
        { name: des.es_cuadra ? des.emergente : null, rol: 'Emergente', fee: feeAsistente, rolKey: 'Asistente' }
      ];

      roles.forEach(r => {
        if (!r.name || !r.name.trim()) return;
        const cleanName = r.name.trim().toUpperCase();
        const paymentKey = `${desId}_${cleanName}`;
        const isPaid = !!pagosState[paymentKey];

        grandTotal += r.fee;
        if (isPaid) paidTotal += r.fee;

        if (!refereeMap[cleanName]) {
          refereeMap[cleanName] = {
            nombre: cleanName,
            partidos: [],
            totalEarned: 0,
            totalPaid: 0
          };
        }

        refereeMap[cleanName].partidos.push({
          desId: des.id,
          partidoId: des.item || idx + 1,
          torneo: des.torneo || 'Torneo',
          categoria: des.categoria || '',
          cancha: des.cancha || '',
          hora: des.hora || '',
          rol: r.rol,
          rolKey: r.rolKey,
          tarifa: r.fee,
          isPaid
        });

        refereeMap[cleanName].totalEarned += r.fee;
        if (isPaid) refereeMap[cleanName].totalPaid += r.fee;
      });
    });

    const payrollList = Object.values(refereeMap).map(ref => {
      const isFullyPaid = ref.partidos.length > 0 && ref.partidos.every(p => p.isPaid);
      return {
        ...ref,
        isFullyPaid
      };
    }).sort((a, b) => b.totalEarned - a.totalEarned);

    return {
      refereePayroll: payrollList,
      totalJornada: grandTotal,
      totalPagado: paidTotal,
      totalPendiente: grandTotal - paidTotal
    };
  }, [safeDesignaciones, pagosState, selectedDateIso]);

  if (!isOpen) return null;

  // Marcar todos los partidos de un árbitro como pagados
  const handleMarkAllPaidForReferee = (ref) => {
    ref.partidos.forEach(p => {
      setPagoArbitroStatus(p.desId, ref.nombre, true);
    });
  };

  const formatCOP = (val) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-400/30 rounded-xl">
              <DollarSign className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Tesorería y Nómina de Honorarios - COARC</h2>
              <p className="text-xs text-emerald-200 font-mono">
                Jornada: <strong className="text-white">{selectedDateLabel}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-0.5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Honorarios Jornada</div>
            <div className="text-xl font-black text-blue-900 dark:text-blue-200">{formatCOP(totalJornada)}</div>
            <div className="text-[10px] text-slate-400">{safeDesignaciones.length} partidos programados</div>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-0.5">
            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Total Liquidado (Pagado)</span>
            </div>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">{formatCOP(totalPagado)}</div>
            <div className="text-[10px] text-emerald-600/80">Dinero entregado a árbitros</div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl space-y-0.5">
            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Saldo Pendiente por Pagar</span>
            </div>
            <div className="text-xl font-black text-amber-700 dark:text-amber-300">{formatCOP(totalPendiente)}</div>
            <div className="text-[10px] text-amber-600/80">Pendiente de liquidación</div>
          </div>
        </div>

        {/* Referee List & Payroll Breakdown */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {refereePayroll.length === 0 ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="font-bold text-sm">No hay partidos con terna programada para esta fecha.</p>
              <p className="text-xs text-slate-400">Asigna árbitros a los partidos para calcular la nómina de honorarios.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
                <span>Desglose por Árbitro ({refereePayroll.length})</span>
                <span>Estado de Liquidación</span>
              </div>

              <div className="space-y-3">
                {refereePayroll.map(ref => (
                  <div
                    key={ref.nombre}
                    className={`p-4 rounded-2xl border transition-all ${
                      ref.isFullyPaid
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Header Row per Referee */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-xl font-black text-xs">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-black text-sm text-slate-900 dark:text-white">{ref.nombre}</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {ref.partidos.length} {ref.partidos.length === 1 ? 'partido pitado' : 'partidos pitados'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-500">Total a Cobrar:</div>
                          <div className="text-base font-black text-blue-700 dark:text-blue-400">
                            {formatCOP(ref.totalEarned)}
                          </div>
                        </div>

                        {!ref.isFullyPaid && (
                          <button
                            type="button"
                            onClick={() => handleMarkAllPaidForReferee(ref)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1"
                            title="Marcar todos los partidos como pagados"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Marcar Pagado</span>
                          </button>
                        )}

                        {ref.isFullyPaid && (
                          <span className="px-3 py-1 bg-emerald-600 text-white font-black text-[11px] rounded-xl flex items-center gap-1 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>PAGADO COMPLETO</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Matches List per Referee */}
                    <div className="pt-3 space-y-2">
                      {ref.partidos.map(p => (
                        <div
                          key={`${p.desId}_${p.rol}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-bold rounded text-[10px]">
                              Partido #{p.partidoId}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {p.cancha} - {p.hora}
                            </span>
                            <span className="text-[11px] text-slate-500">({p.torneo} {p.categoria})</span>
                          </div>

                          <div className="flex items-center gap-3 justify-between sm:justify-end">
                            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                              <span>Rol: <strong>{p.rol}</strong> ($</span>
                              <input
                                type="number"
                                value={p.tarifa || ''}
                                onChange={(e) => handleFeeChange(p.desId, p.rolKey, e.target.value)}
                                placeholder="0"
                                className="w-20 px-1.5 py-0.5 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold text-blue-900 dark:text-blue-200 text-right bg-white dark:bg-slate-900 focus:ring-1 focus:ring-blue-500"
                                title="Ingresar o modificar valor del partido"
                              />
                              <span>)</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => togglePagoArbitro(p.desId, ref.nombre)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition flex items-center gap-1 ${
                                p.isPaid
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              }`}
                            >
                              {p.isPaid ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>PAGADO</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>PENDIENTE</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Control de tesorería y liquidación de partidos COARC
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
          >
            Cerrar Tesorería
          </button>
        </div>

      </div>
    </div>
  );
};
