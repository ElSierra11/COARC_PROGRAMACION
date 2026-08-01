import React from 'react';
import { useDesignaciones } from '../context/DesignacionesContext';

// Escudo Oficial SVG COARC optimizado para impresión
const CoarcShieldPrint = () => (
  <svg viewBox="0 0 100 120" className="w-14 h-16 shrink-0 drop-shadow">
    <path
      d="M 10,10 L 90,10 L 90,70 Q 90,110 50,118 Q 10,110 10,70 Z"
      fill="#0B2580"
      stroke="#D97706"
      strokeWidth="4"
    />
    <path d="M 12,12 L 88,12 L 88,48 L 12,48 Z" fill="#FFFDF5" />
    <rect x="12" y="48" width="76" height="22" fill="#78350F" />
    <text x="50" y="30" textAnchor="middle" fill="#0B2580" fontSize="19" fontWeight="900" fontFamily="sans-serif">COARC</text>
    <text x="50" y="42" textAnchor="middle" fill="#78350F" fontSize="6" fontWeight="700" fontFamily="sans-serif">CORDOBA</text>
    <text x="50" y="64" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="sans-serif">ÁRBITRO</text>
    <circle cx="50" cy="90" r="16" fill="#1D4ED8" stroke="#D97706" strokeWidth="2" />
    <circle cx="50" cy="90" r="8" fill="#FFFFFF" stroke="#000" strokeWidth="1" />
    <polygon points="50,85 53,88 52,92 48,92 47,88" fill="#000" />
  </svg>
);

export const OfficialCoarcPrintSheet = () => {
  const { designaciones, selectedDateLabel, selectedMunicipio } = useDesignaciones();
  const safeDesignaciones = Array.isArray(designaciones) ? designaciones : [];

  return (
    <div className="print-only print-container p-4 bg-white text-slate-900 font-sans">
      
      {/* Official Header */}
      <div className="border-2 border-slate-900 rounded-t-xl overflow-hidden">
        <div className="bg-[#0B2580] text-white p-3 flex items-center justify-between border-b-4 border-[#D97706]">
          <div className="flex items-center gap-4">
            <CoarcShieldPrint />
            <div>
              <h1 className="text-lg font-black tracking-wider uppercase text-amber-300 leading-tight">
                CORPORACIÓN ARBITRAL DE CÓRDOBA - COARC
              </h1>
              <h2 className="text-xs font-extrabold text-blue-100 uppercase tracking-widest mt-1">
                PLANILLA OFICIAL DE DESIGNACIONES ARBITRALES 2026
              </h2>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block bg-amber-400 text-slate-950 font-black px-3 py-1 rounded text-xs uppercase tracking-wider shadow">
              {selectedMunicipio ? `SEDE ${selectedMunicipio.toUpperCase()}` : 'DEPARTAMENTO DE CÓRDOBA'}
            </span>
          </div>
        </div>

        {/* Subheader Bars */}
        <div className="grid grid-cols-2 text-xs font-black uppercase text-white border-b-2 border-slate-900">
          <div className="bg-[#15803D] px-4 py-2 flex items-center gap-2 border-r border-slate-900">
            <span className="opacity-80">TORNEO:</span>
            <span>DESIGNACIONES GENERALES</span>
          </div>
          <div className="bg-[#BE185D] px-4 py-2 flex items-center justify-between">
            <div>
              <span className="opacity-80">FECHA:</span>
              <span className="ml-1 text-amber-200">{selectedDateLabel}</span>
            </div>
            <div className="text-[10px] bg-pink-900/80 px-2 py-0.5 rounded">
              TOTAL: {safeDesignaciones.length} PARTIDOS
            </div>
          </div>
        </div>
      </div>

      {/* Official Printable Table */}
      <table className="w-full text-left border-collapse border-x-2 border-b-2 border-slate-900 text-xs">
        <thead>
          <tr className="bg-[#FACC15] text-slate-950 font-black text-[11px] uppercase tracking-wider border-b-2 border-slate-900">
            <th className="py-2.5 px-2 border-r border-slate-400 w-10 text-center">ITEM</th>
            <th className="py-2.5 px-2 border-r border-slate-400 w-20">MOD.</th>
            <th className="py-2.5 px-3 border-r border-slate-400 min-w-[180px]">ÁRBITROS DESIGNADOS</th>
            <th className="py-2.5 px-2 border-r border-slate-400 w-24">HORA</th>
            <th className="py-2.5 px-2 border-r border-slate-400 min-w-[130px]">CANCHA / SEDE</th>
            <th className="py-2.5 px-2 border-r border-slate-400 min-w-[150px]">TORNEO / ENCUENTRO</th>
            <th className="py-2.5 px-2 w-24 text-center">CATEGORÍA</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300">
          {safeDesignaciones.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-8 text-center text-slate-500 font-bold italic">
                No hay partidos registrados para imprimir en esta fecha.
              </td>
            </tr>
          ) : (
            safeDesignaciones.map((des, idx) => {
              const isCuadra = des.es_cuadra;

              return (
                <tr key={des.id || idx} className="hover:bg-slate-50 font-medium">
                  {/* ITEM */}
                  <td className="py-2 px-2 border-r border-slate-300 text-center font-black text-slate-800">
                    {des.item || idx + 1}
                  </td>

                  {/* MODALIDAD */}
                  <td className="py-2 px-2 border-r border-slate-300">
                    {isCuadra ? (
                      <div className="space-y-1 font-extrabold text-[9px] text-center">
                        <div className="bg-amber-500 text-white px-1 py-0.5 rounded">ÁRBITRO</div>
                        <div className="bg-rose-600 text-white px-1 py-0.5 rounded">ASIST. 1</div>
                        <div className="bg-sky-600 text-white px-1 py-0.5 rounded">ASIST. 2</div>
                        <div className="bg-emerald-600 text-white px-1 py-0.5 rounded">EMERG.</div>
                      </div>
                    ) : (
                      <span className="inline-block bg-slate-200 text-slate-800 font-black px-2 py-1 rounded text-[10px] uppercase">
                        ÁRBITRO
                      </span>
                    )}
                  </td>

                  {/* ÁRBITROS */}
                  <td className="py-2 px-3 border-r border-slate-300 font-bold text-slate-900">
                    {isCuadra ? (
                      <div className="space-y-1">
                        <div className="font-extrabold text-blue-950">{des.arbitro_principal}</div>
                        <div className="text-slate-700">{des.asistente_1 || '-'}</div>
                        <div className="text-slate-700">{des.asistente_2 || '-'}</div>
                        <div className="text-slate-700">{des.emergente || '-'}</div>
                      </div>
                    ) : (
                      <div className="font-extrabold text-blue-950">{des.arbitro_principal}</div>
                    )}
                  </td>

                  {/* HORA */}
                  <td className="py-2 px-2 border-r border-slate-300 font-mono font-bold whitespace-nowrap text-slate-800">
                    {des.hora}
                  </td>

                  {/* CANCHA & MUNICIPIO */}
                  <td className="py-2 px-2 border-r border-slate-300 font-extrabold uppercase text-blue-900">
                    <div>{des.cancha}</div>
                    {des.municipio && (
                      <div className="text-[10px] text-amber-700 font-bold">{des.municipio}</div>
                    )}
                  </td>

                  {/* TORNEO & PARTIDO */}
                  <td className="py-2 px-2 border-r border-slate-300">
                    <div className="font-extrabold text-slate-900">{des.torneo}</div>
                    {des.partido && (
                      <div className="text-[11px] font-semibold text-slate-600 mt-0.5">{des.partido}</div>
                    )}
                  </td>

                  {/* CATEGORÍA */}
                  <td className="py-2 px-2 text-center font-black">
                    <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                      {des.categoria}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Official Signatures Block */}
      <div className="mt-12 pt-6 border-t-2 border-slate-400 grid grid-cols-2 gap-8 text-center text-xs font-bold text-slate-800">
        <div>
          <div className="h-12 border-b border-slate-400 max-w-xs mx-auto mb-2" />
          <div>COORDINACIÓN DE ARBITRAJE</div>
          <div className="text-[10px] text-slate-500 font-normal">Corporación Arbitral de Córdoba COARC</div>
        </div>

        <div>
          <div className="h-12 border-b border-slate-400 max-w-xs mx-auto mb-2" />
          <div>PRESIDENCIA / TESORERÍA</div>
          <div className="text-[10px] text-slate-500 font-normal">Corporación Arbitral de Córdoba COARC</div>
        </div>
      </div>

    </div>
  );
};
