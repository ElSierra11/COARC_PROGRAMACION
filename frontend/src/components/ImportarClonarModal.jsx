import React, { useState } from 'react';
import { useDesignaciones } from '../context/DesignacionesContext';
import { X, FileText, Copy, Upload, CheckCircle, AlertCircle, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';

export const ImportarClonarModal = ({ isOpen, onClose }) => {
  const {
    selectedDateIso,
    selectedDateLabel,
    designaciones,
    importarDesignaciones,
    duplicarJornada
  } = useDesignaciones();

  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'clone'
  
  // Tab Importar State
  const [rawText, setRawText] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [importSuccess, setImportSuccess] = useState(null);

  // Tab Clonar State
  const [targetDateIso, setTargetDateIso] = useState('2026-08-02');
  const [targetDateLabel, setTargetDateLabel] = useState('DOMINGO 02 AGOSTO');
  const [cloneSuccess, setCloneSuccess] = useState(null);

  if (!isOpen) return null;

  const currentMatchesCount = designaciones.filter(
    d => (d.fecha_iso || selectedDateIso) === selectedDateIso
  ).length;

  // Analizador inteligente de texto/CSV
  const handleParseText = () => {
    if (!rawText.trim()) {
      setParsedItems([]);
      return;
    }

    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const results = [];

    lines.forEach((line, index) => {
      // Ignorar líneas de cabecera comunes
      if (line.toLowerCase().includes('hora') && line.toLowerCase().includes('cancha')) return;

      // Soportar separador por coma, punto y coma o tabulación
      let parts = [];
      if (line.includes(';')) parts = line.split(';');
      else if (line.includes('\t')) parts = line.split('\t');
      else if (line.includes(',')) parts = line.split(',');
      else parts = line.split('|');

      parts = parts.map(p => p.trim());

      // Estructura sugerida: Hora | Cancha | Torneo/Categoría | Partido | Municipio | Principal | Asistente1 | Asistente2
      const hora = parts[0] || '08:00 AM';
      const cancha = parts[1] || 'CANCHA 1';
      const torneo = parts[2] || 'TORNEO LOCAL';
      const partido = parts[3] || 'EQUIPO A VS EQUIPO B';
      const municipio = parts[4] || 'MONTERÍA';
      const arbitro_principal = parts[5] || '';
      const asistente_1 = parts[6] || '';
      const asistente_2 = parts[7] || '';

      results.push({
        id_temp: index + 1,
        hora,
        cancha,
        torneo,
        categoria_torneo: torneo,
        partido,
        municipio,
        arbitro_principal: arbitro_principal.toUpperCase(),
        asistente_1: asistente_1.toUpperCase(),
        asistente_2: asistente_2.toUpperCase(),
        emergente: '',
        observaciones: '',
        estado: 'PROGRAMADO'
      });
    });

    setParsedItems(results);
    setImportSuccess(null);
  };

  const handleExecuteImport = () => {
    if (parsedItems.length === 0) return;
    importarDesignaciones(parsedItems);
    setImportSuccess(`¡Se importaron exitosamente ${parsedItems.length} partidos para la fecha ${selectedDateLabel}!`);
    setRawText('');
    setParsedItems([]);
  };

  const handleExecuteClone = () => {
    if (currentMatchesCount === 0) return;
    const count = duplicarJornada(selectedDateIso, targetDateIso, targetDateLabel.toUpperCase());
    setCloneSuccess(`¡Se clonaron ${count} partidos desde "${selectedDateLabel}" a "${targetDateLabel}"!`);
  };

  const handleTargetDateChange = (e) => {
    const val = e.target.value;
    setTargetDateIso(val);
    if (val) {
      const dateObj = new Date(val + 'T00:00:00');
      const options = { weekday: 'long', day: '2-digit', month: 'long' };
      const label = dateObj.toLocaleDateString('es-ES', options).toUpperCase();
      setTargetDateLabel(label);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Carga Rápida y Duplicación de Jornada</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Optimiza la programación importando en lote o clonando partidos completos
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

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/50 px-6 pt-3 gap-2">
          <button
            onClick={() => { setActiveTab('import'); setImportSuccess(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'import'
                ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Importación Masiva (CSV / Texto)</span>
          </button>

          <button
            onClick={() => { setActiveTab('clone'); setCloneSuccess(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'clone'
                ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>Duplicar Jornada Completa</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">

          {/* TAB 1: IMPORTAR */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Formato sugerido (separado por comas, punto y coma o tabulación):</strong>
                  <p className="mt-1 font-mono text-[11px] bg-white/60 dark:bg-slate-950/60 p-2 rounded border border-blue-200/50 dark:border-blue-900">
                    Hora, Cancha, Torneo/Categoría, Partido, Municipio, Principal, Asistente 1, Asistente 2
                  </p>
                  <p className="mt-1 text-[11px] opacity-80">
                    Ejemplo: 08:00 AM, CANCHA 1, SUB-15, REAL CORDOBA VS DEPORTIVO, MONTERÍA, JUAN PÉREZ, CARLOS LÓPEZ, ANA GÓMEZ
                  </p>
                </div>
              </div>

              {importSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>{importSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                  Pega aquí las filas de partidos a importar:
                </label>
                <textarea
                  rows={5}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="08:00 AM, CANCHA 1, SUB-15, REAL CORDOBA VS CORDOBA FC, MONTERÍA, JUAN PEREZ, CARLOS LOPEZ&#10;10:00 AM, CANCHA 2, VETERANOS, MONTERIA FC VS CERETE FC, CERETÉ, LUIS DIAZ"
                  className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParseText}
                  disabled={!rawText.trim()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
                >
                  Analizar y Generar Vista Previa
                </button>
              </div>

              {/* Vista previa de partidos procesados */}
              {parsedItems.length > 0 && (
                <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Vista previa ({parsedItems.length} partidos detectados)</span>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400">Fecha destino: {selectedDateLabel}</span>
                  </h4>

                  <div className="overflow-x-auto max-h-48 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                        <tr>
                          <th className="p-2">Hora</th>
                          <th className="p-2">Cancha</th>
                          <th className="p-2">Torneo</th>
                          <th className="p-2">Partido</th>
                          <th className="p-2">Principal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {parsedItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                            <td className="p-2 font-mono font-bold text-blue-600 dark:text-blue-400">{item.hora}</td>
                            <td className="p-2">{item.cancha}</td>
                            <td className="p-2 font-medium">{item.torneo}</td>
                            <td className="p-2 font-semibold">{item.partido}</td>
                            <td className="p-2">{item.arbitro_principal || <span className="text-slate-400 italic">Sin asignar</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirmar e Importar {parsedItems.length} Partidos</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DUPLICAR JORNADA */}
          {activeTab === 'clone' && (
            <div className="space-y-5">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-900 dark:text-amber-300 space-y-1">
                <div className="font-bold text-sm flex items-center gap-2">
                  <Copy className="w-4 h-4 text-amber-600" />
                  <span>Clonación de la Jornada Actual</span>
                </div>
                <p>
                  Esta acción tomará los <strong>{currentMatchesCount} partidos</strong> de la jornada actual (<strong>{selectedDateLabel}</strong>) y creará copias idénticas en la fecha de destino elegida.
                </p>
              </div>

              {cloneSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>{cloneSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-500">Fecha Origen (Actual):</label>
                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400">
                    {selectedDateLabel} ({currentMatchesCount} partidos)
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">
                    Seleccionar Fecha Destino:
                  </label>
                  <input
                    type="date"
                    value={targetDateIso}
                    onChange={handleTargetDateChange}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Etiqueta: {targetDateLabel}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleExecuteClone}
                  disabled={currentMatchesCount === 0}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Copy className="w-4 h-4" />
                  <span>Duplicar {currentMatchesCount} Partidos a {targetDateLabel}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
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
