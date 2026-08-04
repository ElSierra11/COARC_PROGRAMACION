import React, { useState } from 'react';
import { useDesignaciones } from '../context/DesignacionesContext';
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
  Sparkles
} from 'lucide-react';
import { exportElementToJpg, copyElementImageToClipboard } from '../services/imageExportUtils';
import { exportDesignacionesToExcel, exportDesignacionesToWord, exportDesignacionesToPowerPoint } from '../services/officeExportUtils';

export const WhatsAppExportModal = ({ isOpen, onClose }) => {
  const { designaciones, selectedDateLabel } = useDesignaciones();
  const [copied, setCopied] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('image'); // 'image' | 'text' | 'office'

  if (!isOpen) return null;

  // Render text for WhatsApp
  const generateWhatsAppText = () => {
    let text = `=======================================\n`;
    text += `CORPORACION ARBITRAL DE CORDOBA - COARC\n`;
    text += `DESIGNACIONES ARBITRALES 2026\n`;
    text += `FECHA: ${selectedDateLabel}\n`;
    text += `=======================================\n\n`;

    if (designaciones.length === 0) {
      text += `No hay partidos programados para esta fecha.\n`;
    } else {
      designaciones.forEach((des, idx) => {
        const itemNum = des.item || idx + 1;
        text += `[PARTIDO #${itemNum}]\n`;
        text += `• HORARIO: ${des.hora}\n`;
        text += `• SEDE/CANCHA: ${des.cancha} (${(des.municipio || 'MONTERÍA').toUpperCase()})\n`;
        text += `• TORNEO: ${des.torneo} | CATEGORIA: ${des.categoria || des.categoria_torneo || ''}\n`;
        if (des.partido) {
          text += `• ENCUENTRO: ${des.partido}\n`;
        }

        if (des.es_cuadra) {
          text += `• TERNA ARBITRAL:\n`;
          text += `  - Arbitro Principal: ${des.arbitro_principal}\n`;
          text += `  - Asistente 1: ${des.asistente_1 || 'N/A'}\n`;
          text += `  - Asistente 2: ${des.asistente_2 || 'N/A'}\n`;
          text += `  - Emergente: ${des.emergente || 'N/A'}\n`;
        } else {
          text += `• ARBITRO: ${des.arbitro_principal}\n`;
        }
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
      // Usar la hoja oficial de impresión o tarjeta resumen
      await exportElementToJpg('official-coarc-print-sheet', `Programacion_COARC_${selectedDateLabel.replace(/\s+/g, '_')}`);
    } catch (err) {
      console.error('Error al descargar JPG:', err);
      // Fallback si no está disponible la hoja oficial
      await exportElementToJpg('whatsapp-preview-card', `Programacion_COARC_${selectedDateLabel.replace(/\s+/g, '_')}`);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleCopyImageToClipboard = async () => {
    setIsExportingImage(true);
    try {
      await copyElementImageToClipboard('official-coarc-print-sheet');
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2500);
    } catch (err) {
      try {
        await copyElementImageToClipboard('whatsapp-preview-card');
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
      } catch (err2) {
        alert('No se pudo copiar la imagen automáticamente al portapapeles. Utiliza el botón "Descargar Imagen JPG".');
      }
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 border border-white/20 rounded-xl">
              <Share2 className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">Exportador para WhatsApp y Archivos de Office</h2>
              <p className="text-xs text-emerald-100">Difusión en Imagen JPG, Texto formateado o planillas Excel/Word</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
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
                ? 'bg-white dark:bg-slate-900 border-emerald-600 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Imagen JPG / PNG para WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'text'
                ? 'bg-white dark:bg-slate-900 border-emerald-600 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Texto Estructurado para Grupos</span>
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
          
          {/* TAB 1: IMAGEN JPG PARA WHATSAPP */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                <strong>Exportación en Imagen JPG para WhatsApp:</strong> Genera una ficha gráfica de alta calidad con la programación oficial, lista para enviar en chats y grupos de WhatsApp.
              </div>

              {/* Vista Previa Gráfica de la Tarjeta */}
              <div
                id="whatsapp-preview-card"
                className="p-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-lg space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wide">
                      Corporación de Árbitros de Córdoba (COARC)
                    </h3>
                    <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                      Programación Oficial de Partidos - {selectedDateLabel}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-black">
                    {designaciones.length} Partidos
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {designaciones.map((d, i) => (
                    <div key={i} className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-200">
                          <span className="text-emerald-400 font-mono mr-2">{d.hora}</span>
                          <span>{d.partido}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {d.cancha} ({d.municipio || 'MONTERÍA'}) - {d.categoria_torneo || d.torneo}
                        </div>
                      </div>
                      <div className="text-right text-[11px] font-bold text-blue-300">
                        {d.arbitro_principal}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones de Acción para Imagen */}
              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyImageToClipboard}
                  disabled={isExportingImage}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedImage ? '¡Imagen Copiada al Portapapeles!' : 'Copiar Imagen al Portapapeles'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJpg}
                  disabled={isExportingImage}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
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
                  onClick={() => exportDesignacionesToExcel(designaciones, selectedDateLabel)}
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
                  onClick={() => exportDesignacionesToWord(designaciones, selectedDateLabel)}
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
                  onClick={() => exportDesignacionesToPowerPoint(designaciones, selectedDateLabel)}
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
