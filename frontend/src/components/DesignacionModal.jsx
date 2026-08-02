import React, { useState, useEffect, useMemo } from 'react';
import { useDesignaciones } from '../context/DesignacionesContext';
import {
  X,
  Plus,
  Save,
  Clock,
  MapPin,
  Trophy,
  Users,
  UserCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Sun,
  Moon,
  DollarSign
} from 'lucide-react';

export const DesignacionModal = ({ isOpen, onClose, initialData = null }) => {
  const {
    arbitros,
    customArbitros,
    addCustomArbitros,
    designaciones,
    addDesignacion,
    updateDesignacion,
    selectedDateIso,
    selectedDateLabel,
    autoRegisterArbitro,
    disponibilidades
  } = useDesignaciones();

  // Autocompletado dinámico unificado (API + Creados por usuario + Asignados en partidos)
  const allRefereesAutocomplete = useMemo(() => {
    const fromApi = (arbitros || []).map(a => (a.nombre || a).trim().toUpperCase());
    const fromCustom = (customArbitros || []).map(c => c.trim().toUpperCase());
    const fromDesignaciones = (designaciones || []).flatMap(d => [
      d?.arbitro_principal,
      d?.asistente_1,
      d?.asistente_2,
      d?.emergente
    ]).filter(Boolean).map(n => n.trim().toUpperCase());

    return Array.from(new Set([...fromApi, ...fromCustom, ...fromDesignaciones])).filter(Boolean).sort();
  }, [arbitros, customArbitros, designaciones]);

  const convert12To24 = (str12) => {
    if (!str12) return '08:00';
    if (str12.includes(':')) {
      const match = str12.match(/(\d+):(\d+)/);
      if (match) {
        let h = parseInt(match[1], 10);
        const m = match[2];
        if (str12.toLowerCase().includes('p. m.') || str12.toLowerCase().includes('pm')) {
          if (h < 12) h += 12;
        } else if (str12.toLowerCase().includes('a. m.') || str12.toLowerCase().includes('am')) {
          if (h === 12) h = 0;
        }
        return `${h < 10 ? '0' + h : h}:${m}`;
      }
    }
    return '08:00';
  };

  const formatTime12h = (raw) => {
    if (!raw) return '8:00 a. m.';
    const [h, m] = raw.split(':');
    if (h === undefined || m === undefined) return raw;
    
    let hour = parseInt(h, 10);
    const min = m.substring(0, 2);
    const ampm = hour >= 12 ? 'p. m.' : 'a. m.';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${min} ${ampm}`;
  };

  const [esCuadra, setEsCuadra] = useState(false);
  const [item, setItem] = useState('');
  const [hora, setHora] = useState('8:00 a. m.');
  const [hora24, setHora24] = useState('08:00');
  
  // Estados para el selector de 12 Horas + AM/PM
  const [hour12, setHour12] = useState('8');
  const [minute, setMinute] = useState('00');
  const [ampm, setAmpm] = useState('a. m.');

  const [cancha, setCancha] = useState('VALLEGRANDE');
  const [municipio, setMunicipio] = useState('MONTERÍA');
  const [torneo, setTorneo] = useState('TORNEO VALORES');
  const [partido, setPartido] = useState('');
  const [categoria, setCategoria] = useState('2018');

  const [arbitroPrincipal, setArbitroPrincipal] = useState('');
  const [asistente1, setAsistente1] = useState('');
  const [asistente2, setAsistente2] = useState('');
  const [emergente, setEmergente] = useState('');

  const [tarifaPrincipal, setTarifaPrincipal] = useState('40000');
  const [tarifaAsistente, setTarifaAsistente] = useState('25000');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTimeChange = (h, m, p) => {
    setHour12(h);
    setMinute(m);
    setAmpm(p);

    const formatted12 = `${h}:${m} ${p}`;
    setHora(formatted12);

    // Calcular hora24
    let numH = parseInt(h, 10);
    if (p === 'p. m.') {
      if (numH < 12) numH += 12;
    } else if (p === 'a. m.') {
      if (numH === 12) numH = 0;
    }
    const formatted24 = `${numH < 10 ? '0' + numH : numH}:${m}`;
    setHora24(formatted24);
  };

  const parseTimeParts = (str) => {
    let h = '8';
    let m = '00';
    let p = 'a. m.';

    if (!str) return { h, m, p };

    const lower = str.toLowerCase();
    if (lower.includes('p. m.') || lower.includes('pm')) p = 'p. m.';
    else if (lower.includes('a. m.') || lower.includes('am')) p = 'a. m.';

    const match = str.match(/(\d+):(\d+)/);
    if (match) {
      let rawH = parseInt(match[1], 10);
      m = match[2].substring(0, 2);

      if (!lower.includes('am') && !lower.includes('pm') && !lower.includes('a. m.') && !lower.includes('p. m.')) {
        if (rawH >= 12) {
          p = 'p. m.';
          if (rawH > 12) rawH -= 12;
        } else {
          p = 'a. m.';
          if (rawH === 0) rawH = 12;
        }
      } else {
        if (rawH > 12) rawH -= 12;
        if (rawH === 0) rawH = 12;
      }
      h = String(rawH);
    }
    return { h, m, p };
  };

  useEffect(() => {
    if (initialData) {
      setEsCuadra(initialData.es_cuadra || false);
      setItem(initialData.item || '');
      const rawHora = initialData.hora || '8:00 a. m.';
      setHora(rawHora);
      setHora24(convert12To24(rawHora));
      const parts = parseTimeParts(rawHora);
      setHour12(parts.h);
      setMinute(parts.m);
      setAmpm(parts.p);

      setCancha(initialData.cancha || '');
      setMunicipio(initialData.municipio || 'MONTERÍA');
      setTorneo(initialData.torneo || '');
      setPartido(initialData.partido || '');
      setCategoria(initialData.categoria || '');
      setArbitroPrincipal(initialData.arbitro_principal || '');
      setAsistente1(initialData.asistente_1 || '');
      setAsistente2(initialData.asistente_2 || '');
      setEmergente(initialData.emergente || '');
      setTarifaPrincipal(initialData.tarifa_principal !== undefined && initialData.tarifa_principal !== null ? String(initialData.tarifa_principal) : '');
      setTarifaAsistente(initialData.tarifa_asistente !== undefined && initialData.tarifa_asistente !== null ? String(initialData.tarifa_asistente) : '');
    } else {
      setEsCuadra(false);
      setItem('');
      setHora('8:00 a. m.');
      setHora24('08:00');
      setHour12('8');
      setMinute('00');
      setAmpm('a. m.');
      setCancha('VALLEGRANDE');
      setMunicipio('MONTERÍA');
      setTorneo('TORNEO VALORES');
      setPartido('');
      setCategoria('2018');
      setArbitroPrincipal(arbitros[0]?.nombre || '');
      setAsistente1('');
      setAsistente2('');
      setEmergente('');
      setTarifaPrincipal('');
      setTarifaAsistente('');
    }
  }, [initialData, isOpen, arbitros]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!arbitroPrincipal) {
      setError('Debes seleccionar al menos el Árbitro Principal.');
      return;
    }

    const payload = {
      item: item ? parseInt(item, 10) : null,
      fecha: selectedDateLabel,
      fecha_iso: selectedDateIso,
      hora,
      cancha: cancha.toUpperCase(),
      municipio: municipio.toUpperCase(),
      torneo: torneo.toUpperCase(),
      partido: partido ? partido.toUpperCase() : null,
      categoria: categoria.toUpperCase(),
      es_cuadra: esCuadra,
      arbitro_principal: arbitroPrincipal.toUpperCase(),
      asistente_1: esCuadra && asistente1 ? asistente1.toUpperCase() : null,
      asistente_2: esCuadra && asistente2 ? asistente2.toUpperCase() : null,
      emergente: esCuadra && emergente ? emergente.toUpperCase() : null,
      tarifa_principal: tarifaPrincipal ? parseInt(tarifaPrincipal, 10) : 0,
      tarifa_asistente: tarifaAsistente ? parseInt(tarifaAsistente, 10) : 0,
    };

    // Guardar localmente (instantáneo) y cerrar el modal de inmediato
    if (initialData?.id) {
      updateDesignacion(initialData.id, payload);
    } else {
      addDesignacion(payload);
    }
    onClose();

    // Registrar árbitros nuevos en el sistema y guardarlos localmente — en segundo plano
    const namesToRegister = [
      arbitroPrincipal,
      esCuadra ? asistente1 : null,
      esCuadra ? asistente2 : null,
      esCuadra ? emergente : null,
    ].filter(Boolean);

    // Solo registrar en el backend — el autocompletado usa 'fromDesignaciones'
    // (calculado dinámicamente desde los partidos activos, no desde customArbitros)
    // Si los árbitros se agregaran a customArbitros aquí, persistirían en la lista
    // aunque el partido fuera eliminado.
    Promise.allSettled(namesToRegister.map(n => autoRegisterArbitro(n)));
  };


  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden transition-colors animate-slideUp sm:animate-fadeIn">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-400/30 rounded-xl">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {initialData ? 'Editar Designación Arbitral' : 'Programar Nueva Designación'}
              </h2>
              <p className="text-xs text-blue-200">FECHA: {selectedDateLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Check Availability Warnings */}
          {(() => {
            const fechaMap = disponibilidades[selectedDateIso] || {};
            const assignedNames = [
              { label: 'Principal', name: arbitroPrincipal },
              ...(esCuadra ? [
                { label: 'Asistente 1', name: asistente1 },
                { label: 'Asistente 2', name: asistente2 },
                { label: 'Emergente', name: emergente }
              ] : [])
            ].filter(item => item.name && item.name.trim());

            const unavailables = assignedNames.map(item => {
              const clean = item.name.trim().toUpperCase();
              const info = fechaMap[clean];
              if (!info) return null;

              if (info.estado === 'NO_DISPONIBLE') {
                return `🔴 ${item.label} (${clean}): Marcó "NO DISPONIBLE"${info.nota ? ` - Nota: ${info.nota}` : ''}`;
              }
              if (info.estado === 'SOLO_MANANA' && hora24 >= '12:00') {
                return `🟡 ${item.label} (${clean}): Marcó "SOLO MAÑANA" (partido a las ${hora})`;
              }
              if (info.estado === 'SOLO_TARDE' && hora24 < '12:00') {
                return `🟡 ${item.label} (${clean}): Marcó "SOLO TARDE" (partido a las ${hora})`;
              }
              return null;
            }).filter(Boolean);

            if (unavailables.length === 0) return null;

            return (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Advertencia de Disponibilidad Previa:</span>
                </div>
                {unavailables.map((msg, idx) => (
                  <div key={idx} className="text-[11px] font-medium pl-5">{msg}</div>
                ))}
              </div>
            );
          })()}

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Switch: 1 Referee vs 4-Referee Quadra */}
          <div className="p-3 bg-blue-50/70 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Modalidad de Cuadra / Terna</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Activa si el partido requiere 4 roles arbitrales</p>
            </div>
            <button
              type="button"
              onClick={() => setEsCuadra(!esCuadra)}
              className={`px-3 py-1.5 rounded-lg font-extrabold text-xs transition-colors flex items-center gap-1.5 ${
                esCuadra
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>{esCuadra ? 'Cuadra Completa (4 Roles)' : 'Árbitro Único'}</span>
            </button>
          </div>

          {/* Selector Interactivo de 12 Horas con AM / PM */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Hora del Partido (Formatos AM / PM)</span>
              </label>
              <span className="text-[11px] font-black px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono">
                {hora}
              </span>
            </div>

            {/* Selectores de Hora, Minuto y Botón AM / PM */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Select Hora */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Hora:</span>
                <select
                  value={hour12}
                  onChange={(e) => handleTimeChange(e.target.value, minute, ampm)}
                  className="bg-transparent font-black text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                    <option key={n} value={String(n)} className="bg-white dark:bg-slate-900 font-bold">
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <span className="font-extrabold text-slate-400">:</span>

              {/* Select Minuto */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Min:</span>
                <select
                  value={minute}
                  onChange={(e) => handleTimeChange(hour12, e.target.value, ampm)}
                  className="bg-transparent font-black text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer font-mono"
                >
                  {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                    <option key={m} value={m} className="bg-white dark:bg-slate-900 font-bold">
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle AM / PM */}
              <div className="flex items-center bg-slate-200 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={() => handleTimeChange(hour12, minute, 'a. m.')}
                  className={`px-3 py-1 rounded text-xs font-black transition-all flex items-center gap-1 ${
                    ampm === 'a. m.'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sun className="w-3 h-3" />
                  <span>a. m.</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeChange(hour12, minute, 'p. m.')}
                  className={`px-3 py-1 rounded text-xs font-black transition-all flex items-center gap-1 ${
                    ampm === 'p. m.'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Moon className="w-3 h-3" />
                  <span>p. m.</span>
                </button>
              </div>
            </div>

            {/* Horarios Rápidos de Partido */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Rápidos:</span>
              {[
                { h: '7', m: '00', p: 'a. m.' },
                { h: '8', m: '00', p: 'a. m.' },
                { h: '9', m: '00', p: 'a. m.' },
                { h: '10', m: '00', p: 'a. m.' },
                { h: '2', m: '00', p: 'p. m.' },
                { h: '3', m: '00', p: 'p. m.' },
                { h: '4', m: '00', p: 'p. m.' },
                { h: '5', m: '00', p: 'p. m.' }
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTimeChange(preset.h, preset.m, preset.p)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition border ${
                    hour12 === preset.h && minute === preset.m && ampm === preset.p
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset.h}:{preset.m} {preset.p === 'a. m.' ? 'AM' : 'PM'}
                </button>
              ))}
            </div>
          </div>

          {/* Grid 1: Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cancha / Sede</label>
              <input
                type="text"
                required
                value={cancha}
                onChange={(e) => setCancha(e.target.value)}
                placeholder="ej: VALLEGRANDE"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Municipio / Ciudad</label>
              <input
                type="text"
                list="municipios-list"
                required
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                placeholder="ej: MONTERÍA, CERETÉ"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-blue-900 dark:text-blue-200 focus:ring-2 focus:ring-blue-600"
              />
              <datalist id="municipios-list">
                <option value="MONTERÍA" />
                <option value="CERETÉ" />
                <option value="LORICA" />
                <option value="PLANETA RICA" />
                <option value="SAHAGÚN" />
                <option value="MONTELÍBANO" />
                <option value="TIERRALTA" />
                <option value="CIÉNAGA DE ORO" />
              </datalist>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
              <input
                type="text"
                required
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="ej: 2018, SEMIFINAL"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Torneo</label>
              <input
                type="text"
                required
                value={torneo}
                onChange={(e) => setTorneo(e.target.value)}
                placeholder="ej: TORNEO VALORES, BABY FUTBOL"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Partido / Encuentro (Opcional)</label>
              <input
                type="text"
                value={partido}
                onChange={(e) => setPartido(e.target.value)}
                placeholder="ej: LEICY SANTOS VS AREA CHICA"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Section: Referees */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="font-extrabold text-blue-900 dark:text-blue-400 uppercase tracking-wider text-[11px]">
              Asignación de Árbitros
            </h3>

            {/* Árbitro Principal */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Árbitro Principal (Obligatorio)
              </label>
              <input
                type="text"
                list="arbitros-list"
                required
                value={arbitroPrincipal}
                onChange={(e) => setArbitroPrincipal(e.target.value)}
                placeholder="Escribe o selecciona un árbitro..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-blue-900 dark:text-blue-200 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Additional 3 Roles if Cuadra */}
            {esCuadra && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-rose-700 dark:text-rose-400 mb-1">
                    Asistente 1
                  </label>
                  <input
                    type="text"
                    list="arbitros-list"
                    value={asistente1}
                    onChange={(e) => setAsistente1(e.target.value)}
                    placeholder="Nombre Asistente 1"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-sky-700 dark:text-sky-400 mb-1">
                    Asistente 2
                  </label>
                  <input
                    type="text"
                    list="arbitros-list"
                    value={asistente2}
                    onChange={(e) => setAsistente2(e.target.value)}
                    placeholder="Nombre Asistente 2"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                    Emergente
                  </label>
                  <input
                    type="text"
                    list="arbitros-list"
                    value={emergente}
                    onChange={(e) => setEmergente(e.target.value)}
                    placeholder="Nombre Emergente"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>
              </div>
            )}

            {/* Honorarios / Tarifas del Partido */}
            <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
              <label className="font-extrabold text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Honorarios / Tarifas por Rol (COP)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Tarifa Principal:</span>
                  <input
                    type="number"
                    value={tarifaPrincipal}
                    onChange={(e) => setTarifaPrincipal(e.target.value)}
                    placeholder="40000"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-bold text-emerald-900 dark:text-emerald-200"
                  />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Tarifa Asistentes / Emergente:</span>
                  <input
                    type="number"
                    value={tarifaAsistente}
                    onChange={(e) => setTarifaAsistente(e.target.value)}
                    placeholder="25000"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-bold text-emerald-900 dark:text-emerald-200"
                  />
                </div>
              </div>
            </div>

            {/* Datalist for autocomplete */}
            <datalist id="arbitros-list">
              {allRefereesAutocomplete.map((name, idx) => (
                <option key={idx} value={name} />
              ))}
            </datalist>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-5 py-2 rounded-xl flex items-center gap-2 shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : 'Guardar Designación'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
