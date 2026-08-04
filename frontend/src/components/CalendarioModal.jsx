import React, { useState, useMemo } from 'react';
import { useDesignaciones } from '../context/DesignacionesContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  Plus,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';

const MONTH_NAMES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

const DAY_NAMES = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

export const CalendarioModal = ({ isOpen, onClose, onOpenNewModalForDate }) => {
  const {
    designaciones,
    selectedDateIso,
    setSelectedDateIso,
    setSelectedDateLabel
  } = useDesignaciones();

  // Estado para el año y mes visible en el calendario
  const [currentYear, setCurrentYear] = useState(() => {
    if (selectedDateIso) return parseInt(selectedDateIso.split('-')[0], 10);
    return new Date().getFullYear();
  });

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDateIso) return parseInt(selectedDateIso.split('-')[1], 10) - 1;
    return new Date().getMonth();
  });

  // Mapa de partidos por fecha ISO (ej: '2026-08-01': 5 partidos)
  const matchesByDate = useMemo(() => {
    const map = new Map();
    const safeDesignaciones = Array.isArray(designaciones) ? designaciones : [];
    safeDesignaciones.forEach(d => {
      const iso = d?.fecha_iso;
      if (iso) {
        map.set(iso, (map.get(iso) || 0) + 1);
      }
    });
    return map;
  }, [designaciones]);

  // Generar la grilla de días del mes actual
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Ajustar para que la semana empiece en Lunes (0 = Lunes, 6 = Domingo)
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const totalDays = lastDayOfMonth.getDate();
    const days = [];

    // Días de relleno del mes anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ isPadding: true, key: `pad-${i}` });
    }

    // Días del mes en curso
    const todayIso = new Date().toISOString().slice(0, 10);

    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const monthStr = currentMonth + 1 < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
      const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
      const dateIso = `${currentYear}-${monthStr}-${dayStr}`;

      const dateObj = new Date(currentYear, currentMonth, dayNum);
      const daysOfWeekStr = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
      const dayName = daysOfWeekStr[dateObj.getDay()];
      const monthName = MONTH_NAMES[currentMonth];
      const dateLabel = `${dayName} ${dayStr} ${monthName}`;

      const count = matchesByDate.get(dateIso) || 0;
      const isSelected = dateIso === selectedDateIso;
      const isToday = dateIso === todayIso;

      days.push({
        isPadding: false,
        dayNum,
        dateIso,
        dateLabel,
        count,
        isSelected,
        isToday,
        key: dateIso
      });
    }

    return days;
  }, [currentYear, currentMonth, matchesByDate, selectedDateIso]);

  // TODOS LOS HOOKS SE EJECUTAN SIEMPRE -> AHORA SÍ EL RETURN DE GUARDIA
  if (!isOpen) return null;

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleSelectDate = (dayItem) => {
    if (dayItem.isPadding) return;
    setSelectedDateIso(dayItem.dateIso);
    setSelectedDateLabel(dayItem.dateLabel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Calendario de Programación y Jornadas</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Haz clic en cualquier día para visualizar los partidos programados de esa fecha
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

        {/* Nivel de Navegación de Meses */}
        <div className="p-4 bg-slate-100/50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Mes Anterior</span>
          </button>

          <div className="text-base font-black text-blue-700 dark:text-blue-400 tracking-wider">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </div>

          <button
            onClick={handleNextMonth}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1"
          >
            <span>Mes Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Grid Calendario */}
        <div className="p-4 overflow-y-auto flex-1">
          
          {/* Cabecera Días de la Semana */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
            {DAY_NAMES.map(day => (
              <div key={day} className="py-1 bg-slate-100 dark:bg-slate-800/60 rounded-lg">
                {day}
              </div>
            ))}
          </div>

          {/* Grilla de Celda por Día */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              if (day.isPadding) {
                return (
                  <div key={day.key} className="h-24 rounded-xl border border-slate-100 dark:border-slate-800/40 bg-slate-50/40 dark:bg-slate-950/20 opacity-30" />
                );
              }

              return (
                <div
                  key={day.key}
                  onClick={() => handleSelectDate(day)}
                  className={`h-24 p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group relative shadow-xs hover:shadow-md ${
                    day.isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/30'
                      : day.count > 0
                      ? 'bg-white dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 hover:border-blue-400'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 opacity-80 hover:opacity-100 hover:border-slate-400'
                  }`}
                >
                  {/* Fila Superior: Número de día e indicadores */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black rounded-lg px-1.5 py-0.5 ${
                      day.isToday
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : day.isSelected
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {day.dayNum}
                    </span>

                    {day.isToday && (
                      <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">
                        Hoy
                      </span>
                    )}
                  </div>

                  {/* Badge de Partidos Programados */}
                  <div className="my-auto">
                    {day.count > 0 ? (
                      <div className="px-2 py-1 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded-lg text-[10px] font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span>{day.count} {day.count === 1 ? 'Partido' : 'Partidos'}</span>
                        </span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 dark:text-slate-600 font-medium italic">
                        Sin partidos
                      </div>
                    )}
                  </div>

                  {/* Acción rápida de seleccionar */}
                  <div className="text-[9px] font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition text-right">
                    Ver Jornada →
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer Leyenda */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-[11px] text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="w-3 h-3 rounded bg-blue-600 inline-block" /> Día Seleccionado
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="w-3 h-3 rounded bg-emerald-600 inline-block" /> Día Actual (Hoy)
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="w-3 h-3 rounded bg-blue-100 border border-blue-400 inline-block" /> Con Partidos Programados
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
