import React, { useState } from 'react';
import { useDesignaciones } from '../context/DesignacionesContext';
import { useAuth } from '../context/AuthContext';
import { CronogramaGrid } from './CronogramaGrid';
import { ImportarClonarModal } from './ImportarClonarModal';
import { DisponibilidadModal } from './DisponibilidadModal';
import { HonorariosModal } from './HonorariosModal';
import {
  Search,
  MapPin,
  Trophy,
  Filter,
  Edit2,
  Trash2,
  Clock,
  UserCheck,
  AlertTriangle,
  Users,
  Calendar,
  Layers,
  Plus,
  Copy,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  UserCheck2,
  Grid,
  List,
  DollarSign
} from 'lucide-react';

export const DesignacionesTable = ({ onEditModal }) => {
  const {
    designaciones,
    selectedDateIso,
    selectedDateLabel,
    loading,
    searchQuery,
    setSearchQuery,
    selectedCancha,
    setSelectedCancha,
    selectedTorneo,
    setSelectedTorneo,
    selectedMunicipio,
    setSelectedMunicipio,
    deleteDesignacion,
    updateDesignacion,
    arbitroStats
  } = useDesignaciones();

  const [selectedEstado, setSelectedEstado] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDisponibilidadModalOpen, setIsDisponibilidadModalOpen] = useState(false);
  const [isHonorariosModalOpen, setIsHonorariosModalOpen] = useState(false);

  const { isAdmin, requireAuth } = useAuth();

  const safeDesignaciones = Array.isArray(designaciones) ? designaciones : [];

  // Instant client-side filter strictly by selected date, referee name, venue, tournament, municipio, and estado
  const filteredDesignaciones = safeDesignaciones.filter(d => {
    if (!d) return false;
    
    // Filtrado estricto por fecha ISO seleccionada
    const itemDateIso = d.fecha_iso || selectedDateIso;
    if (selectedDateIso && itemDateIso !== selectedDateIso) {
      return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchPrincipal = d.arbitro_principal?.toLowerCase().includes(q);
      const matchAsst1 = d.asistente_1?.toLowerCase().includes(q);
      const matchAsst2 = d.asistente_2?.toLowerCase().includes(q);
      const matchEmerg = d.emergente?.toLowerCase().includes(q);
      if (!matchPrincipal && !matchAsst1 && !matchAsst2 && !matchEmerg) {
        return false;
      }
    }
    if (selectedCancha && d.cancha !== selectedCancha) {
      return false;
    }
    if (selectedTorneo && d.torneo !== selectedTorneo) {
      return false;
    }
    if (selectedMunicipio && (d.municipio || "MONTERÍA").toUpperCase() !== selectedMunicipio.toUpperCase()) {
      return false;
    }
    if (selectedEstado && (d.estado || "PROGRAMADO").toUpperCase() !== selectedEstado.toUpperCase()) {
      return false;
    }
    return true;
  });

  const toggleMatchStatus = async (des) => {
    requireAuth(async () => {
      const states = ['PROGRAMADO', 'CONFIRMADO', 'EN_JUEGO', 'FINALIZADO'];
      const currentIdx = states.indexOf(des.estado || 'PROGRAMADO');
      const nextState = states[(currentIdx + 1) % states.length];
      await updateDesignacion(des.id, { estado: nextState });
    }, 'Debes iniciar sesión como Coordinador Arbitral para cambiar el estado del partido.');
  };

  // Lista dinámica de municipios (Predeterminados + Creados en partidos + Agregados manualmente)
  const [customMunicipios, setCustomMunicipios] = useState(() => {
    try {
      const saved = localStorage.getItem('coarc_custom_municipios');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const safeCustomMunicipios = Array.isArray(customMunicipios) ? customMunicipios : [];
  const defaultMunicipios = ["MONTERÍA", "CERETÉ", "LORICA", "PLANETA RICA", "SAHAGÚN"];
  const designacionesMunicipios = safeDesignaciones.map(d => (d?.municipio || "MONTERÍA").toUpperCase());

  const municipiosLista = Array.from(
    new Set([...defaultMunicipios, ...designacionesMunicipios, ...safeCustomMunicipios])
  ).filter(Boolean);

  const handleAddMunicipio = () => {
    requireAuth(() => {
      const newMun = prompt("Ingresa el nombre del nuevo Municipio / Ciudad (ej: Chinú, San Pelayo, Montelíbano, Ciénaga de Oro):");
      if (newMun && newMun.trim()) {
        const clean = newMun.trim().toUpperCase();
        if (!customMunicipios.includes(clean)) {
          const updated = [...customMunicipios, clean];
          setCustomMunicipios(updated);
          localStorage.setItem('coarc_custom_municipios', JSON.stringify(updated));
        }
        setSelectedMunicipio(clean);
      }
    }, 'Para registrar nuevos municipios debes iniciar sesión con tus credenciales de Coordinador.');
  };

  // Extract unique venues and tournaments for quick dropdown filters
  const uniqueCanchas = Array.from(new Set(designaciones.map(d => d.cancha))).filter(Boolean);
  const uniqueTorneos = Array.from(new Set(designaciones.map(d => d.torneo))).filter(Boolean);

  // Helper to get referee total match count for workload badge
  const getRefereeMatchCount = (refereeName) => {
    if (!refereeName) return 0;
    const stat = arbitroStats.find(s => s.nombre.toUpperCase() === refereeName.toUpperCase());
    return stat ? stat.total_partidos : 0;
  };

  // Helper to render workload pill
  const renderWorkloadBadge = (count) => {
    if (count <= 0) return null;
    let badgeColor = "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    if (count === 3) badgeColor = "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    if (count >= 4) badgeColor = "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 animate-pulse";

    return (
      <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold border ${badgeColor}`}>
        {count} {count === 1 ? 'partido' : 'partidos'}
      </span>
    );
  };

  const sendIndividualWhatsApp = (e, refereeName, des) => {
    e.stopPropagation();
    if (!refereeName) return;
    const msg = `Hola *${refereeName}*, la Corporación Arbitral COARC te notifica tu designación:\n\n• HORARIO: ${des.hora}\n• SEDE/CANCHA: ${des.cancha} (${(des.municipio || 'MONTERÍA').toUpperCase()})\n• TORNEO: ${des.torneo} | CATEGORÍA: ${des.categoria}\n\nFavor confirmar asistencia.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 no-print">
      
      {/* Municipality Tabs / Clasificación por Ciudad */}
      <div className="bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 p-2 rounded-2xl shadow-sm overflow-x-auto flex items-center gap-1.5 scrollbar-none">
        <button
          onClick={() => setSelectedMunicipio('')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
            !selectedMunicipio
              ? 'bg-blue-700 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700'
          }`}
        >
          TODAS LAS SEDES / MUNICIPIOS
        </button>

        {municipiosLista.map((mun) => {
          const isActive = selectedMunicipio.toUpperCase() === mun;
          return (
            <button
              key={mun}
              onClick={() => setSelectedMunicipio(mun)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700'
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-blue-600'}`} />
              <span>{mun}</span>
            </button>
          );
        })}

        {/* Button to Add New Custom Municipality */}
        <button
          onClick={handleAddMunicipio}
          className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white transition-all whitespace-nowrap flex items-center gap-1 shadow-sm ml-auto cursor-pointer"
          title="Agregar Nuevo Municipio"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Agregar Municipio</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-3 transition-colors">
        
        {/* Advanced Scheduling Tools Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => requireAuth(
                () => setIsImportModalOpen(true),
                'Debes iniciar sesión con las credenciales de Coordinador Arbitral para usar Carga Rápida o Duplicar Jornada.'
              )}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Carga Rápida / Duplicar Jornada</span>
            </button>

            <button
              type="button"
              onClick={() => requireAuth(
                () => setIsDisponibilidadModalOpen(true),
                'Debes iniciar sesión con las credenciales de Coordinador para gestionar la Disponibilidad de Árbitros.'
              )}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck2 className="w-4 h-4" />
              <span>Disponibilidad Árbitros</span>
            </button>

            <button
              type="button"
              onClick={() => requireAuth(
                () => setIsHonorariosModalOpen(true),
                'Debes iniciar sesión con las credenciales de Coordinador o Administrador para gestionar Tesorería y Honorarios.'
              )}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 border border-amber-300 cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-slate-950" />
              <span>Tesorería / Honorarios</span>
            </button>
          </div>

          {/* View Switcher: Table vs Grid */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold gap-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Vista Tabla</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Cronograma Grid</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Real-time Referee Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por Árbitro..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
          </div>

          {/* Quick Cancha Dropdown Filter */}
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <select
              value={selectedCancha}
              onChange={(e) => setSelectedCancha(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-200 appearance-none"
            >
              <option value="">Todas las Canchas</option>
              {uniqueCanchas.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Quick Torneo Dropdown Filter */}
          <div className="relative">
            <Trophy className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <select
              value={selectedTorneo}
              onChange={(e) => setSelectedTorneo(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-200 appearance-none"
            >
              <option value="">Todos los Torneos</option>
              {uniqueTorneos.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Stats & Reset */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <span className="font-semibold text-slate-500 dark:text-slate-400">
            Mostrando <strong className="text-blue-700 dark:text-blue-400">{filteredDesignaciones.length}</strong> partidos
          </span>

          {(searchQuery || selectedCancha || selectedTorneo || selectedMunicipio || selectedEstado) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCancha('');
                setSelectedTorneo('');
                setSelectedMunicipio('');
                setSelectedEstado('');
              }}
              className="text-rose-600 dark:text-rose-400 hover:underline font-bold"
            >
              Limpiar Filtros
            </button>
          )}
        </div>

      </div>

      {/* Main Table Card (Official COARC Shield Aesthetics) */}
      <div className="bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
        
        {/* Table Banner Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-4 flex items-center justify-between border-b-4 border-amber-400">
          <div>
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-300">
              CORPORACIÓN ARBITRAL DE CÓRDOBA COARC
            </h2>
            <p className="text-xs font-bold text-blue-100 uppercase tracking-widest mt-0.5">
              DESIGNACIONES ARBITRALES 2026
            </p>
          </div>
          <span className="bg-amber-500 text-slate-950 font-black px-3 py-1 rounded-lg text-xs uppercase shadow-sm">
            {selectedMunicipio ? `SEDE ${selectedMunicipio}` : 'CÓRDOBA'}
          </span>
        </div>

        {/* Pink Date Header */}
        <div className="bg-pink-600 text-white px-4 py-2 font-black text-xs uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-pink-200" />
            <span>FECHA: {selectedDateLabel}</span>
          </div>
          <span className="bg-pink-800/80 text-pink-100 px-2 py-0.5 rounded text-[10px] font-bold">
            {filteredDesignaciones.length} PARTIDOS FILTRADOS
          </span>
        </div>

        {/* View Switch: Desktop Table vs Mobile Cards vs Cronograma Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Cargando designaciones arbitrales...</span>
          </div>
        ) : filteredDesignaciones.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm font-semibold">No se encontraron partidos para la búsqueda.</p>
            <p className="text-xs">Intenta borrar filtros o realizar una carga masiva.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-4 bg-slate-50 dark:bg-slate-950">
            <CronogramaGrid
              filteredDesignaciones={filteredDesignaciones}
              onEditModal={onEditModal}
            />
          </div>
        ) : (
          <>
            {/* MOBILE CARDS VIEW (< md) */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDesignaciones.map((des, idx) => {
                const isCuadra = des.es_cuadra;

                return (
                  <div
                    key={des.id || idx}
                    className="p-4 space-y-3 hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Card Header: Item, Hora, Cancha & Estado */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-extrabold text-xs flex items-center justify-center">
                          {des.item || idx + 1}
                        </span>
                        <div className="flex items-center gap-1 font-bold text-xs text-slate-800 dark:text-slate-200">
                          <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>{des.hora}</span>
                        </div>
                      </div>

                      {/* Match Status Button */}
                      <button
                        onClick={() => toggleMatchStatus(des)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all shadow-sm ${
                          (des.estado || 'PROGRAMADO') === 'FINALIZADO'
                            ? 'bg-emerald-600 text-white'
                            : (des.estado || 'PROGRAMADO') === 'CONFIRMADO'
                            ? 'bg-sky-600 text-white'
                            : (des.estado || 'PROGRAMADO') === 'EN_JUEGO'
                            ? 'bg-amber-500 text-white animate-pulse'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {(des.estado || 'PROGRAMADO') === 'FINALIZADO' && <CheckCircle2 className="w-3 h-3 text-emerald-200" />}
                        {(des.estado || 'PROGRAMADO') === 'CONFIRMADO' && <UserCheck className="w-3 h-3 text-sky-200" />}
                        {(des.estado || 'PROGRAMADO') === 'EN_JUEGO' && <Clock className="w-3 h-3 text-amber-200" />}
                        <span>{des.estado || 'PROGRAMADO'}</span>
                      </button>
                    </div>

                    {/* Cancha, Municipio & Categoria */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <span className="font-extrabold text-blue-900 dark:text-blue-300 uppercase">{des.cancha}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {des.municipio || "MONTERÍA"}
                        </span>
                      </div>
                      <span className="font-black bg-amber-400 dark:bg-amber-600 text-slate-950 px-2 py-0.5 rounded text-[10px]">
                        CAT. {des.categoria}
                      </span>
                    </div>

                    {/* Torneo & Partido */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-black text-slate-900 dark:text-slate-100">{des.torneo}</p>
                      {des.partido && (
                        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mt-0.5">{des.partido}</p>
                      )}
                    </div>

                    {/* Referees Section */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          {isCuadra ? 'Terna / Cuadra Arbitral' : 'Árbitro Principal'}
                        </span>
                      </div>

                      {isCuadra ? (
                        <div className="space-y-1 text-xs">
                          {/* Principal */}
                          <div className="flex items-center justify-between bg-amber-500/10 dark:bg-amber-500/20 p-2 rounded-xl border border-amber-400/30">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded text-[9px] font-extrabold">ARBITRO</span>
                              <span className="font-bold text-slate-900 dark:text-slate-100">{des.arbitro_principal}</span>
                              {renderWorkloadBadge(getRefereeMatchCount(des.arbitro_principal))}
                            </div>
                            <button
                              onClick={(e) => sendIndividualWhatsApp(e, des.arbitro_principal, des)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950 rounded-lg transition-colors"
                              title="WhatsApp Citación"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Asistente 1 */}
                          {des.asistente_1 && (
                            <div className="flex items-center justify-between bg-rose-500/10 dark:bg-rose-500/20 p-2 rounded-xl border border-rose-400/30">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-rose-600 text-white px-1.5 py-0.5 rounded text-[9px] font-extrabold">ASIST 1</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{des.asistente_1}</span>
                                {renderWorkloadBadge(getRefereeMatchCount(des.asistente_1))}
                              </div>
                              <button
                                onClick={(e) => sendIndividualWhatsApp(e, des.asistente_1, des)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950 rounded-lg"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {/* Asistente 2 */}
                          {des.asistente_2 && (
                            <div className="flex items-center justify-between bg-sky-500/10 dark:bg-sky-500/20 p-2 rounded-xl border border-sky-400/30">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-sky-600 text-white px-1.5 py-0.5 rounded text-[9px] font-extrabold">ASIST 2</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{des.asistente_2}</span>
                                {renderWorkloadBadge(getRefereeMatchCount(des.asistente_2))}
                              </div>
                              <button
                                onClick={(e) => sendIndividualWhatsApp(e, des.asistente_2, des)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950 rounded-lg"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {/* Emergente */}
                          {des.emergente && (
                            <div className="flex items-center justify-between bg-emerald-500/10 dark:bg-emerald-500/20 p-2 rounded-xl border border-emerald-400/30">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-emerald-600 text-white px-1.5 py-0.5 rounded text-[9px] font-extrabold">EMERG.</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{des.emergente}</span>
                                {renderWorkloadBadge(getRefereeMatchCount(des.emergente))}
                              </div>
                              <button
                                onClick={(e) => sendIndividualWhatsApp(e, des.emergente, des)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950 rounded-lg"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-blue-50/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-blue-100 dark:border-slate-700 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 dark:text-slate-100">{des.arbitro_principal}</span>
                            {renderWorkloadBadge(getRefereeMatchCount(des.arbitro_principal))}
                          </div>
                          <button
                            onClick={(e) => sendIndividualWhatsApp(e, des.arbitro_principal, des)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950 rounded-lg"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Match Actions Footer */}
                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <button
                        onClick={() => requireAuth(
                          () => onEditModal({ ...des, id: null, item: (des.item || 0) + 1 }),
                          'Debes iniciar sesión con tus credenciales de Coordinador para clonar este partido.'
                        )}
                        className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Clonar</span>
                      </button>
                      <button
                        onClick={() => requireAuth(
                          () => onEditModal(des),
                          'Debes iniciar sesión con tus credenciales de Coordinador Arbitral para editar este partido.'
                        )}
                        className="px-2.5 py-1.5 bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => requireAuth(
                          () => deleteDesignacion(des.id),
                          'Debes iniciar sesión con tus credenciales de Coordinador Arbitral para eliminar este partido.'
                        )}
                        className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                
                {/* Yellow Table Headers matching Official COARC Sheet */}
                <thead>
                  <tr className="bg-amber-400 dark:bg-amber-600 text-slate-900 dark:text-slate-950 font-black text-[11px] uppercase tracking-wider border-b border-amber-500">
                    <th className="py-2.5 px-3 w-12 text-center">ITEM</th>
                    <th className="py-2.5 px-3 w-24">MOD.</th>
                    <th className="py-2.5 px-4 min-w-[200px]">ÁRBITROS</th>
                    <th className="py-2.5 px-3 w-28">HORA</th>
                    <th className="py-2.5 px-3 min-w-[150px]">CANCHA</th>
                    <th className="py-2.5 px-3 min-w-[150px]">TORNEO / PARTIDO</th>
                    <th className="py-2.5 px-3 w-28">CATEGORIA</th>
                    <th className="py-2.5 px-3 w-28">ESTADO</th>
                    <th className="py-2.5 px-3 w-24 text-center no-print">ACCIONES</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {filteredDesignaciones.map((des, idx) => {
                    const isCuadra = des.es_cuadra;

                    return (
                      <tr
                        key={des.id || idx}
                        className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* ITEM */}
                        <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                          {des.item || idx + 1}
                        </td>

                        {/* MOD */}
                        <td className="py-3 px-3">
                          {isCuadra ? (
                            <div className="space-y-1 font-bold text-[10px]">
                              <div className="bg-amber-500 text-white px-1.5 py-0.5 rounded text-center">ÁRBITRO</div>
                              <div className="bg-rose-600 text-white px-1.5 py-0.5 rounded text-center">ASIST. 1</div>
                              <div className="bg-sky-600 text-white px-1.5 py-0.5 rounded text-center">ASIST. 2</div>
                              <div className="bg-emerald-600 text-white px-1.5 py-0.5 rounded text-center">EMERG.</div>
                            </div>
                          ) : (
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-[10px]">
                              ÁRBITRO
                            </span>
                          )}
                        </td>

                        {/* ÁRBITROS NAMES */}
                        <td
                          onClick={isAdmin ? () => onEditModal(des) : undefined}
                          className={`py-3 px-4 ${isAdmin ? 'cursor-pointer group' : ''}`}
                          title={isAdmin ? "Haz clic para cambiar o reasignar árbitro" : ""}
                        >
                          {isCuadra ? (
                            <div className="space-y-1 font-bold">
                              <div className="text-slate-900 dark:text-slate-100 flex items-center group-hover:text-blue-600 transition-colors">
                                <span>{des.arbitro_principal}</span>
                                {renderWorkloadBadge(getRefereeMatchCount(des.arbitro_principal))}
                                <button
                                  onClick={(e) => sendIndividualWhatsApp(e, des.arbitro_principal, des)}
                                  className="ml-1.5 p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-full transition-colors"
                                  title={`Enviar citación personal a ${des.arbitro_principal} por WhatsApp`}
                                >
                                  <MessageCircle className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="text-slate-700 dark:text-slate-300 flex items-center group-hover:text-blue-600 transition-colors">
                                <span>{des.asistente_1 || '-'}</span>
                                {renderWorkloadBadge(getRefereeMatchCount(des.asistente_1))}
                                {des.asistente_1 && (
                                  <button
                                    onClick={(e) => sendIndividualWhatsApp(e, des.asistente_1, des)}
                                    className="ml-1.5 p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-full transition-colors"
                                    title={`Enviar citación personal a ${des.asistente_1} por WhatsApp`}
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <div className="text-slate-700 dark:text-slate-300 flex items-center group-hover:text-blue-600 transition-colors">
                                <span>{des.asistente_2 || '-'}</span>
                                {renderWorkloadBadge(getRefereeMatchCount(des.asistente_2))}
                                {des.asistente_2 && (
                                  <button
                                    onClick={(e) => sendIndividualWhatsApp(e, des.asistente_2, des)}
                                    className="ml-1.5 p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-full transition-colors"
                                    title={`Enviar citación personal a ${des.asistente_2} por WhatsApp`}
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <div className="text-slate-700 dark:text-slate-300 flex items-center group-hover:text-blue-600 transition-colors">
                                <span>{des.emergente || '-'}</span>
                                {renderWorkloadBadge(getRefereeMatchCount(des.emergente))}
                                {des.emergente && (
                                  <button
                                    onClick={(e) => sendIndividualWhatsApp(e, des.emergente, des)}
                                    className="ml-1.5 p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-full transition-colors"
                                    title={`Enviar citación personal a ${des.emergente} por WhatsApp`}
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center group-hover:text-blue-600 transition-colors">
                              <span>{des.arbitro_principal}</span>
                              {renderWorkloadBadge(getRefereeMatchCount(des.arbitro_principal))}
                              <button
                                onClick={(e) => sendIndividualWhatsApp(e, des.arbitro_principal, des)}
                                className="ml-1.5 p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-full transition-colors"
                                title={`Enviar citación personal a ${des.arbitro_principal} por WhatsApp`}
                              >
                                <MessageCircle className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* HORA */}
                        <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>{des.hora}</span>
                          </div>
                        </td>

                        {/* CANCHA & MUNICIPIO */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-blue-900 dark:text-blue-300 uppercase flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>{des.cancha}</span>
                          </div>
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {des.municipio || "MONTERÍA"}
                          </span>
                        </td>

                        {/* TORNEO / PARTIDO */}
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-slate-800 dark:text-slate-200">
                            {des.torneo}
                          </div>
                          {des.partido && (
                            <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                              {des.partido}
                            </div>
                          )}
                        </td>

                        {/* CATEGORIA */}
                        <td className="py-3 px-3">
                          <span className="font-black bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded text-xs">
                            {des.categoria}
                          </span>
                        </td>

                        {/* ESTADO DEL PARTIDO */}
                        <td className="py-3 px-3">
                          <button
                            onClick={() => toggleMatchStatus(des)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 transition-all shadow-sm ${
                              (des.estado || 'PROGRAMADO') === 'FINALIZADO'
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : (des.estado || 'PROGRAMADO') === 'CONFIRMADO'
                                ? 'bg-sky-600 text-white hover:bg-sky-700'
                                : (des.estado || 'PROGRAMADO') === 'EN_JUEGO'
                                ? 'bg-amber-500 text-white hover:bg-amber-600 animate-pulse'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                            }`}
                            title="Haz clic para cambiar estado (Programado -> Confirmado -> En Juego -> Finalizado)"
                          >
                            {(des.estado || 'PROGRAMADO') === 'FINALIZADO' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />}
                            {(des.estado || 'PROGRAMADO') === 'CONFIRMADO' && <UserCheck className="w-3.5 h-3.5 text-sky-200" />}
                            {(des.estado || 'PROGRAMADO') === 'EN_JUEGO' && <Clock className="w-3.5 h-3.5 text-amber-200" />}
                            <span>{des.estado || 'PROGRAMADO'}</span>
                          </button>
                        </td>

                        {/* ACCIONES */}
                        <td className="py-3 px-3 text-center no-print">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => requireAuth(
                                () => onEditModal({ ...des, id: null, item: (des.item || 0) + 1 }),
                                'Debes iniciar sesión con tus credenciales de Coordinador para clonar este partido.'
                              )}
                              className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Duplicar Partido (Clonar)"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => requireAuth(
                                () => onEditModal(des),
                                'Debes iniciar sesión con tus credenciales de Coordinador Arbitral para editar este partido.'
                              )}
                              className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Editar Designación"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => requireAuth(
                                () => deleteDesignacion(des.id),
                                'Debes iniciar sesión con tus credenciales de Coordinador Arbitral para eliminar este partido.'
                              )}
                              className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Eliminar Designación"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>

      {/* Modales de Herramientas de Programación */}
      <ImportarClonarModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <DisponibilidadModal
        isOpen={isDisponibilidadModalOpen}
        onClose={() => setIsDisponibilidadModalOpen(false)}
      />

      <HonorariosModal
        isOpen={isHonorariosModalOpen}
        onClose={() => setIsHonorariosModalOpen(false)}
      />
    </div>
  );
};
