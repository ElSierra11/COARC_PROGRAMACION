import React, { useState } from 'react';
import { useDesignaciones } from '../context/DesignacionesContext';
import {
  X,
  Share2,
  Copy,
  Check,
  FileText,
  Calendar,
  MessageSquare
} from 'lucide-react';

export const WhatsAppExportModal = ({ isOpen, onClose }) => {
  const { designaciones, selectedDateLabel } = useDesignaciones();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate WhatsApp formatted text without emojis
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
        text += `• TORNEO: ${des.torneo} | CATEGORIA: ${des.categoria}\n`;
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

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-xl max-w-2xl w-full max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden transition-colors animate-slideUp sm:animate-fadeIn">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 border border-white/20 rounded-xl">
              <Share2 className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">Exportador para WhatsApp</h2>
              <p className="text-xs text-emerald-100">Formato estructurado listo para copiar y enviar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text Preview Body */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="relative bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-xl border border-slate-800 leading-relaxed whitespace-pre-wrap select-all">
            {textToCopy}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {designaciones.length} partidos incluidos en el resumen
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleCopy}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-2 shadow transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>¡Copiado al Portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar para WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
