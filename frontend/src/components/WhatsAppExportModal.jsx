import React, { useState } from 'react';
import { useDesignaciones } from '../context/DesignacionesContext';
import { CoarcLogo } from './CoarcLogo';
import {
  X,
  Share2,
  Copy,
  Check,
  FileText,
  Calendar,
  Image as ImageIcon,
  Download,
  FileSpreadsheet,
  Layers,
  UserCheck,
  MapPin,
  Trophy
} from 'lucide-react';
import { exportElementToJpg, copyElementImageToClipboard } from '../services/imageExportUtils';
import { exportDesignacionesToExcel, exportDesignacionesToWord, exportDesignacionesToPowerPoint } from '../services/officeExportUtils';

export const WhatsAppExportModal = ({ isOpen, onClose }) => {
  const { designaciones, selectedDateLabel, selectedDateIso } = useDesignaciones();
  const [copied, setCopied] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('image'); // 'image' | 'text' | 'office'

  if (!isOpen) return null;

  // Filtrar estrictamente por la fecha seleccionada
  const dateMatches = designaciones.filter(d => (d.fecha_iso || selectedDateIso) === selectedDateIso);

  // Render text for WhatsApp
  const generateWhatsAppText = () => {
    let text = `=======================================\n`;
    text += `CORPORACION ARBITRAL DE CORDOBA - COARC\n`;
    text += `DESIGNACIONES ARBITRALES 2026\n`;
    text += `FECHA: ${selectedDateLabel}\n`;
    text += `=======================================\n\n`;

    if (dateMatches.length === 0) {
      text += `No hay partidos programados para esta fecha.\n`;
    } else {
      dateMatches.forEach((des, idx) => {
        const itemNum = des.item || idx + 1;
        text += `[PARTIDO #${itemNum}]\n`;
        text += `• HORARIO: ${des.hora}\n`;
        text += `• SEDE/CANCHA: ${des.cancha} (${(des.municipio || 'MONTERÍA').toUpperCase()})\n`;
        text += `• TORNEO: ${des.torneo} | CATEGORIA: ${des.categoria || des.categoria_torneo || ''}\n`;
        if (des.partido) {
          text += `• ENCUENTRO: ${des.partido}\n`;
        }

        text += `• TERNA ARBITRAL:\n`;
        text += `  - Principal: ${des.arbitro_principal || 'Sin Asignar'}\n`;
        if (des.asistente_1) text += `  - Asistente 1: ${des.asistente_1}\n`;
        if (des.asistente_2) text += `  - Asistente 2: ${des.asistente_2}\n`;
        if (des.emergente) text += `  - Emergente: ${des.emergente}\n`;
        text += `---------------------------------------\n`;
      });
    }

    text += `\nFavor confirmar asistencia en los horarios indicados.\n`;
    text += `COARC - Corporacion Arbitral de Cordoba`;
    return text;
  };

  const textToCopy = generateWhatsAppText();

  const handleCopyText = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJpg = async () => {
    setIsExportingImage(true);
    try {
      await exportElementToJpg('whatsapp-preview-card', `Programacion_COARC_${selectedDateLabel.replace(/\s+/g, '_')}`);
    } catch (err) {
      console.error('Error al descargar JPG:', err);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleCopyImageToClipboard = async () => {
    setIsExportingImage(true);
    try {
      await copyElementImageToClipboard('whatsapp-preview-card');
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2500);
    } catch (err) {
      alert('No se pudo copiar la imagen automáticamente al portapapeles. Utiliza el botón "Descargar Imagen JPG".');
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 border border-white/20 rounded-xl">
              <Share2 className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">Exportador para WhatsApp y Archivos de Office</h2>
              <p className="text-xs text-blue-100">Difusión en Imagen JPG con terna completa, Texto formateado o planillas Office</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/60 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'image'
                ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Imagen JPG / PNG (Plantilla Oficial)</span>
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'text'
                ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Texto Estructurado para WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveTab('office')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'office'
                ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Documentos de Office (Excel / Word)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: IMAGEN JPG OFICIAL PARA WHATSAPP */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                <strong>Plantilla Oficial de Imagen COARC:</strong> Renderiza la hoja de designaciones exactamente con el membrete institucional, formato de canchas y la terna arbitral completa (Principal, Asistente 1, Asistente 2, Emergente).
              </div>

              {/* VISTA PREVIA Y CONTENEDOR CAPTURABLE PARA IMAGEN JPG */}
              <div
                id="whatsapp-preview-card"
                className="p-6 bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-xl space-y-4 max-w-full overflow-hidden"
              >
                {/* Header de la Ficha Corporativa */}
                <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 text-white p-4 rounded-xl shadow-md flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-white rounded-xl p-1.5 shadow flex items-center justify-center shrink-0">
                      <CoarcLogo />
                    </div>
                    <div>
                      <h1 className="text-base sm:text-lg font-black tracking-wide uppercase text-amber-400 leading-tight">
                        Corporación Arbitral de Córdoba COARC
                      </h1>
                      <h2 className="text-xs font-extrabold uppercase text-slate-200 tracking-wider">
                        Designaciones Arbitrales 2026
                      </h2>
                    </div>
                  </div>
                  <div className="hidden sm:block text-right">
                    <span className="px-3 py-1 bg-amber-500 text-slate-950 text-xs font-black rounded-lg uppercase shadow-sm">
                      Córdoba
                    </span>
                  </div>
                </div>

                {/* Banner de Fecha de la Jornada */}
                <div className="bg-gradient-to-r from-rose-600 to-pink-600 text-white px-4 py-2 rounded-xl flex items-center justify-between font-bold text-xs shadow-sm">
                  <div className="flex items-center gap-2 uppercase tracking-wide">
                    <Calendar className="w-4 h-4 text-rose-200" />
                    <span>FECHA: {selectedDateLabel}</span>
                  </div>
                  <div className="bg-white/20 px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase">
                    {dateMatches.length} PARTIDOS FILTRADOS
                  </div>
                </div>

                {/* Tabla Estructurada de Partidos con Ternas Completa */}
                {dateMatches.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-bold text-xs bg-slate-50 border border-slate-200 rounded-xl">
                    No hay partidos programados para la fecha seleccionada ({selectedDateLabel}).
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-amber-500 text-slate-950 font-black text-[11px] uppercase border-b border-amber-600">
                          <th className="p-2.5 text-center w-12 border-r border-amber-600">ITEM</th>
                          <th className="p-2.5 border-r border-amber-600 min-w-[200px]">ÁRBITROS (TERNA COMPLETA)</th>
                          <th className="p-2.5 border-r border-amber-600 min-w-[90px]">HORA</th>
                          <th className="p-2.5 border-r border-amber-600 min-w-[160px]">CANCHA / MUNICIPIO</th>
                          <th className="p-2.5 border-r border-amber-600 min-w-[200px]">TORNEO / PARTIDO</th>
                          <th className="p-2.5 text-center min-w-[90px]">CATEGORÍA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium">
                        {dateMatches.map((d, index) => {
                          const itemNum = d.item || index + 1;

                          return (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              {/* ITEM */}
                              <td className="p-2.5 text-center font-bold text-slate-700 border-r border-slate-200">
                                {itemNum}
                              </td>

                              {/* TERNA COMPLETA (Árbitro Principal, A1, A2, Emergente) */}
                              <td className="p-2.5 border-r border-slate-200 space-y-1">
                                <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-slate-950 uppercase shrink-0">
                                    ÁRBITRO
                                  </span>
                                  <span className="truncate">{d.arbitro_principal || 'SIN ASIGNAR'}</span>
                                </div>

                                {d.asistente_1 && (
                                  <div className="flex items-center gap-1.5 font-bold text-slate-700 text-[11px]">
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white uppercase shrink-0">
                                      ASIST. 1
                                    </span>
                                    <span className="truncate">{d.asistente_1}</span>
                                  </div>
                                )}

                                {d.asistente_2 && (
                                  <div className="flex items-center gap-1.5 font-bold text-slate-700 text-[11px]">
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-600 text-white uppercase shrink-0">
                                      ASIST. 2
                                    </span>
                                    <span className="truncate">{d.asistente_2}</span>
                                  </div>
                                )}

                                {d.emergente && (
                                  <div className="flex items-center gap-1.5 font-bold text-slate-600 text-[11px]">
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white uppercase shrink-0">
                                      EMERG.
                                    </span>
                                    <span className="truncate">{d.emergente}</span>
                                  </div>
                                )}
                              </td>

                              {/* HORA */}
                              <td className="p-2.5 font-mono font-bold text-blue-700 border-r border-slate-200 whitespace-nowrap">
                                {d.hora}
                              </td>

                              {/* CANCHA / MUNICIPIO */}
                              <td className="p-2.5 border-r border-slate-200">
                                <div className="font-bold text-slate-900 uppercase">{d.cancha}</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                                  {d.municipio || 'MONTERÍA'}
                                </div>
                              </td>

                              {/* TORNEO / PARTIDO */}
                              <td className="p-2.5 border-r border-slate-200">
                                <div className="font-extrabold text-blue-900 uppercase text-[11px]">
                                  {d.categoria_torneo || d.torneo}
                                </div>
                                <div className="font-bold text-slate-800 mt-0.5">
                                  {d.partido || 'ENCUENTRO'}
                                </div>
                              </td>

                              {/* CATEGORIA */}
                              <td className="p-2.5 text-center font-black border-r border-slate-200">
                                <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-[10px] uppercase inline-block">
                                  {d.categoria || d.categoria_torneo || 'LIBRE'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer Institucional de la Ficha */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>Corporación Arbitral de Córdoba - COARC 2026</span>
                  <span>Documento Oficial de Asignaciones</span>
                </div>
              </div>

              {/* Botones de Acción para Imagen */}
              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyImageToClipboard}
                  disabled={isExportingImage || dateMatches.length === 0}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedImage ? '¡Imagen Copiada al Portapapeles!' : 'Copiar Imagen al Portapapeles'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJpg}
                  disabled={isExportingImage || dateMatches.length === 0}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Imagen JPG</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TEXTO WHATSAPP */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="relative bg-slate-950 text-slate-100 font-mono text-xs p-4 rounded-xl border border-slate-800 leading-relaxed whitespace-pre-wrap select-all max-h-72 overflow-y-auto">
                {textToCopy}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCopyText}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-blue-200" />
                      <span>¡Texto Copiado al Portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Texto para WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: OFFICE EXPORT */}
          {activeTab === 'office' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                <strong>Exportación en Archivos de Microsoft Office:</strong> Genera planillas formateadas compatibles con Excel, Word y PowerPoint.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => exportDesignacionesToExcel(dateMatches, selectedDateLabel)}
                  className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-2xl text-left transition flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                    <FileSpreadsheet className="w-6 h-6" />
                    <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">Excel (.xlsx)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Planilla completa de partidos y ternas</div>
                  </div>
                </button>

                <button
                  onClick={() => exportDesignacionesToWord(dateMatches, selectedDateLabel)}
                  className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-2xl text-left transition flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-center justify-between text-blue-700 dark:text-blue-400">
                    <FileText className="w-6 h-6" />
                    <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">Word (.doc)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Documento oficial con membrete COARC</div>
                  </div>
                </button>

                <button
                  onClick={() => exportDesignacionesToPowerPoint(dateMatches, selectedDateLabel)}
                  className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-2xl text-left transition flex flex-col justify-between gap-3 group"
                >
                  <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
                    <Layers className="w-6 h-6" />
                    <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">PowerPoint (.ppt)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Ficha de presentación por escenario</div>
                  </div>
                </button>
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
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
