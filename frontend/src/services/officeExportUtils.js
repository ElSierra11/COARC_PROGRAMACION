import * as XLSX from 'xlsx';

/**
 * Parsea un archivo de Excel (.xlsx, .xls) o CSV y extrae la lista de partidos
 * Evaluando únicamente los campos esenciales: Árbitros (Principal, A1, A2, Emergente),
 * Hora, Cancha, Partido, Categoría y Municipio, ignorando columnas innecesarias.
 * 
 * @param {File} file - Archivo seleccionado por el usuario
 * @returns {Promise<Array>} Lista de objetos de partidos parseados
 */
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir la hoja a matriz 2D (filas x columnas)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!jsonData || jsonData.length === 0) {
          resolve([]);
          return;
        }

        let headerRowIndex = -1;

        // Buscar la fila de cabecera detectando palabras clave esenciales
        for (let i = 0; i < Math.min(jsonData.length, 15); i++) {
          const rowStr = jsonData[i].map(c => String(c).toLowerCase()).join(' ');
          if (
            rowStr.includes('cancha') ||
            rowStr.includes('hora') ||
            rowStr.includes('arbitro') ||
            rowStr.includes('árbitro') ||
            rowStr.includes('partido') ||
            rowStr.includes('encuentro') ||
            rowStr.includes('mod')
          ) {
            headerRowIndex = i;
            break;
          }
        }

        const headerRow = headerRowIndex >= 0 ? jsonData[headerRowIndex] : [];
        
        // Mapeo dinámico de nombres de columnas a índices de la hoja de cálculo
        const colMap = {
          item: -1,
          mod: -1,
          arbitro: -1,
          principal: -1,
          a1: -1,
          a2: -1,
          emergente: -1,
          hora: -1,
          cancha: -1,
          partido: -1,
          categoria: -1,
          municipio: -1,
          estado: -1
        };

        headerRow.forEach((cell, idx) => {
          const text = String(cell || '').toLowerCase().trim();
          if (!text) return;

          if (text === 'n°' || text === 'nro' || text === '#' || text === 'item' || text === 'item.') colMap.item = idx;
          else if (text.includes('mod')) colMap.mod = idx;
          else if (text.includes('principal') || text.includes('arbitro principal') || text.includes('árbitro principal')) colMap.principal = idx;
          else if (text.includes('asistente 1') || text.includes('asist. 1') || text === 'a1' || text === 'asistente1') colMap.a1 = idx;
          else if (text.includes('asistente 2') || text.includes('asist. 2') || text === 'a2' || text === 'asistente2') colMap.a2 = idx;
          else if (text.includes('emergente') || text.includes('cuarto') || text.includes('emerg') || text === '4to') colMap.emergente = idx;
          else if (text.includes('arbitro') || text.includes('árbitro') || text.includes('arbitros') || text.includes('árbitros')) colMap.arbitro = idx;
          else if (text.includes('hora') || text.includes('horario')) colMap.hora = idx;
          else if (text.includes('cancha') || text.includes('escenario') || text.includes('sede')) colMap.cancha = idx;
          else if (text.includes('partido') || text.includes('encuentro')) colMap.partido = idx;
          else if (text.includes('categoria') || text.includes('categoría') || text.includes('torneo')) colMap.categoria = idx;
          else if (text.includes('municipio') || text.includes('ciudad')) colMap.municipio = idx;
          else if (text.includes('estado')) colMap.estado = idx;
        });

        // Caso posicional fallback si no hubo coincidencia estricta de encabezado
        const startRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
        
        // Determinar si la primera columna (col 0) es un contador / N°
        const col0IsItem = colMap.item === 0 || (startRow > 0 && String(jsonData[startRow]?.[0] || '').match(/^\d+$/));
        const offset = col0IsItem ? 1 : 0;

        if (colMap.mod === -1 && headerRow.some(c => String(c).toLowerCase().includes('mod'))) colMap.mod = offset;
        if (colMap.arbitro === -1 && colMap.principal === -1) colMap.arbitro = offset + 1;
        if (colMap.hora === -1) colMap.hora = offset + 2;
        if (colMap.cancha === -1) colMap.cancha = offset + 3;
        if (colMap.partido === -1) colMap.partido = offset + 4;
        if (colMap.categoria === -1) colMap.categoria = offset + 5;

        const results = [];
        let currentMatchGroup = null;

        for (let i = startRow; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.every(val => val === '' || val === null || val === undefined)) continue;

          // Extraer valores de celda strictly evaluados
          const modVal      = colMap.mod >= 0 ? String(row[colMap.mod] || '').trim().toUpperCase() : '';
          const arbitroVal  = (colMap.principal >= 0 ? String(row[colMap.principal] || '') : (colMap.arbitro >= 0 ? String(row[colMap.arbitro] || '') : '')).trim().toUpperCase();
          const a1Val       = colMap.a1 >= 0 ? String(row[colMap.a1] || '').trim().toUpperCase() : '';
          const a2Val       = colMap.a2 >= 0 ? String(row[colMap.a2] || '').trim().toUpperCase() : '';
          const emVal       = colMap.emergente >= 0 ? String(row[colMap.emergente] || '').trim().toUpperCase() : '';
          const horaVal     = colMap.hora >= 0 ? String(row[colMap.hora] || '').trim() : '';
          const canchaVal   = colMap.cancha >= 0 ? String(row[colMap.cancha] || '').trim().toUpperCase() : '';
          const partidoVal  = colMap.partido >= 0 ? String(row[colMap.partido] || '').trim().toUpperCase() : '';
          const catVal      = colMap.categoria >= 0 ? String(row[colMap.categoria] || '').trim().toUpperCase() : '';
          const munVal      = colMap.municipio >= 0 ? String(row[colMap.municipio] || '').trim().toUpperCase() : 'MONTERÍA';
          const estadoVal   = colMap.estado >= 0 ? String(row[colMap.estado] || '').trim().toUpperCase() : 'PROGRAMADO';

          // Omitir filas vacías de datos esenciales
          if (!horaVal && !canchaVal && !partidoVal && !arbitroVal) continue;

          // Limpiar valores vacíos o guiones
          const cleanRef = (val) => (val === '-' || val === 'N/A' || val === 'NONE' || val === 'SIN ASIGNAR') ? '' : val;

          const refPrincipal = cleanRef(arbitroVal);
          const cleanA1 = cleanRef(a1Val);
          const cleanA2 = cleanRef(a2Val);
          const cleanEm = cleanRef(emVal);

          // Si las columnas anchas Traen Asistentes directos (A1, A2, Emergente en la misma fila)
          if (cleanA1 || cleanA2 || cleanEm || (colMap.a1 >= 0 && colMap.principal >= 0)) {
            results.push({
              id_temp: results.length + 1,
              hora: horaVal || '08:00 AM',
              cancha: canchaVal || 'CANCHA 1',
              torneo: catVal || 'TORNEO LOCAL',
              categoria: catVal || 'TORNEO LOCAL',
              categoria_torneo: catVal || 'TORNEO LOCAL',
              partido: partidoVal || 'ENCUENTRO',
              municipio: munVal || 'MONTERÍA',
              es_cuadra: Boolean(cleanA1 || cleanA2 || cleanEm),
              arbitro_principal: refPrincipal || 'SIN ASIGNAR',
              asistente_1: cleanA1,
              asistente_2: cleanA2,
              emergente: cleanEm,
              observaciones: '',
              estado: estadoVal || 'PROGRAMADO'
            });
            continue;
          }

          // Si el formato es por filas verticales (donde col MOD. = ARBITRO, A1, A2, EMERG)
          if (modVal.includes('A1') || modVal.includes('ASISTENTE 1') || modVal.includes('ASIST 1')) {
            if (currentMatchGroup && currentMatchGroup.hora === horaVal && currentMatchGroup.cancha === canchaVal) {
              currentMatchGroup.asistente_1 = refPrincipal;
              currentMatchGroup.es_cuadra = true;
              continue;
            }
          } else if (modVal.includes('A2') || modVal.includes('ASISTENTE 2') || modVal.includes('ASIST 2')) {
            if (currentMatchGroup && currentMatchGroup.hora === horaVal && currentMatchGroup.cancha === canchaVal) {
              currentMatchGroup.asistente_2 = refPrincipal;
              currentMatchGroup.es_cuadra = true;
              continue;
            }
          } else if (modVal.includes('EMERG') || modVal.includes('CUARTO') || modVal.includes('4TO')) {
            if (currentMatchGroup && currentMatchGroup.hora === horaVal && currentMatchGroup.cancha === canchaVal) {
              currentMatchGroup.emergente = refPrincipal;
              currentMatchGroup.es_cuadra = true;
              continue;
            }
          }

          // Si es un nuevo partido individual
          const newMatch = {
            id_temp: results.length + 1,
            hora: horaVal || '08:00 AM',
            cancha: canchaVal || 'CANCHA 1',
            torneo: catVal || 'TORNEO LOCAL',
            categoria: catVal || 'TORNEO LOCAL',
            categoria_torneo: catVal || 'TORNEO LOCAL',
            partido: partidoVal || 'ENCUENTRO',
            municipio: munVal || 'MONTERÍA',
            es_cuadra: false,
            arbitro_principal: refPrincipal || 'SIN ASIGNAR',
            asistente_1: '',
            asistente_2: '',
            emergente: '',
            observaciones: '',
            estado: estadoVal || 'PROGRAMADO'
          };

          currentMatchGroup = newMatch;
          results.push(newMatch);
        }

        resolve(results);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Exporta las designaciones/partidos a un archivo de Excel (.xlsx) profesional
 * @param {Array} designaciones - Lista de partidos
 * @param {string} fechaLabel - Etiqueta de la fecha (ej: "SÁBADO 01 AGOSTO")
 */
export const exportDesignacionesToExcel = (designaciones, fechaLabel) => {
  const rows = designaciones.map((d, idx) => ({
    'N°': idx + 1,
    'Hora': d.hora || '',
    'Cancha / Escenario': d.cancha || '',
    'Torneo / Categoría': d.categoria_torneo || d.torneo || '',
    'Encuentro (Partido)': d.partido || `${d.equipo_local || ''} vs ${d.equipo_visitante || ''}`,
    'Municipio': d.municipio || 'MONTERÍA',
    'Árbitro Principal': d.arbitro_principal || 'SIN ASIGNAR',
    'Asistente 1': d.asistente_1 || '-',
    'Asistente 2': d.asistente_2 || '-',
    'Cuarto / Emergente': d.emergente || '-',
    'Estado': d.estado || 'PROGRAMADO'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Ancho inteligente de columnas
  worksheet['!cols'] = [
    { wch: 6 },  // N°
    { wch: 14 }, // Hora
    { wch: 28 }, // Cancha
    { wch: 28 }, // Torneo
    { wch: 35 }, // Partido
    { wch: 18 }, // Municipio
    { wch: 25 }, // Árbitro Principal
    { wch: 25 }, // Asistente 1
    { wch: 25 }, // Asistente 2
    { wch: 20 }, // Emergente
    { wch: 15 }  // Estado
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Programación COARC');

  const fileName = `Programacion_COARC_${fechaLabel.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * Exporta el Presupuesto Corporativo a Excel (.xlsx)
 */
export const exportPresupuestoToExcel = (presupuestoItems, metrics, fechaLabel) => {
  const rows = presupuestoItems.map((item, idx) => ({
    'N°': idx + 1,
    'Tipo': item.tipo === 'INGRESO' ? 'INGRESO (+)' : 'EGRESO (-)',
    'Concepto / Descripción': item.concepto || '',
    'Categoría': item.categoria || 'GENERAL',
    'Monto ($)': item.monto || 0,
    'Fecha': item.fecha || fechaLabel || '',
    'Registrado Por': item.registrado_por || 'COORDINACIÓN',
    'Estado': item.estado || 'APROBADO'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 35 },
    { wch: 20 },
    { wch: 15 },
    { wch: 16 },
    { wch: 22 },
    { wch: 12 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Presupuesto COARC');
  const fileName = `Presupuesto_COARC_${(fechaLabel || '2026').replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * Exporta las designaciones a un documento de Microsoft Word (.doc)
 */
export const exportDesignacionesToWord = (designaciones, fechaLabel) => {
  let content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Programación COARC - ${fechaLabel}</title>
      <style>
        body { font-family: Calibri, sans-serif; font-size: 11pt; color: #1e293b; margin: 20px; }
        .header { text-align: center; background-color: #0b2580; color: #ffffff; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .header h1 { font-size: 18pt; margin: 0; color: #f59e0b; }
        .header h2 { font-size: 12pt; margin: 5px 0 0 0; color: #e2e8f0; }
        .date-banner { background-color: #e11d48; color: #ffffff; padding: 8px 12px; font-weight: bold; border-radius: 6px; margin-top: 15px; margin-bottom: 15px; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
        th { background-color: #f59e0b; color: #020617; font-weight: bold; text-transform: uppercase; padding: 8px; border: 1px solid #cbd5e1; text-align: left; }
        td { padding: 8px; border: 1px solid #cbd5e1; vertical-align: top; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .badge-ref { font-weight: bold; color: #0f172a; }
        .badge-a1 { color: #e11d48; font-weight: bold; }
        .badge-a2 { color: #2563eb; font-weight: bold; }
        .footer { margin-top: 30px; font-size: 9pt; color: #64748b; text-align: justify; border-top: 1px solid #e2e8f0; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div className="header">
        <h1>CORPORACIÓN ARBITRAL DE CÓRDOBA - COARC</h1>
        <h2>DESIGNACIONES ARBITRALES 2026</h2>
      </div>

      <div className="date-banner">
        FECHA DE LA JORNADA: ${fechaLabel} (${designaciones.length} PARTIDOS)
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 5%;">N°</th>
            <th style="width: 30%;">TERNA ARBITRAL</th>
            <th style="width: 12%;">HORARIO</th>
            <th style="width: 20%;">CANCHA / MUNICIPIO</th>
            <th style="width: 23%;">TORNEO / PARTIDO</th>
            <th style="width: 10%;">CATEGORÍA</th>
          </tr>
        </thead>
        <tbody>
  `;

  designaciones.forEach((d, idx) => {
    content += `
      <tr>
        <td style="text-align: center; font-weight: bold;">${d.item || idx + 1}</td>
        <td>
          <div className="badge-ref">ÁRBITRO: ${d.arbitro_principal || 'SIN ASIGNAR'}</div>
          ${d.asistente_1 ? `<div className="badge-a1">ASIST. 1: ${d.asistente_1}</div>` : ''}
          ${d.asistente_2 ? `<div className="badge-a2">ASIST. 2: ${d.asistente_2}</div>` : ''}
          ${d.emergente ? `<div style="color: #059669; font-weight: bold;">EMERG: ${d.emergente}</div>` : ''}
        </td>
        <td style="font-family: monospace; font-weight: bold; color: #1d4ed8;">${d.hora}</td>
        <td><strong>${d.cancha}</strong><br/><small style="color: #64748b;">${d.municipio || 'MONTERÍA'}</small></td>
        <td><strong>${d.categoria_torneo || d.torneo}</strong><br/>${d.partido || ''}</td>
        <td style="text-align: center; font-weight: bold;">${d.categoria || d.categoria_torneo || 'LIBRE'}</td>
      </tr>
    `;
  });

  content += `
        </tbody>
      </table>

      <div className="footer">
        <p><strong>RECOMENDACIONES E INSTRUCCIONES OFICIALES:</strong></p>
        <p>1. Presentarse en el escenario deportivo con mínimo 30 minutos de antelación al horario pactado.</p>
        <p>2. Portar el uniforme oficial COARC completo en excelente estado de presentación personal.</p>
        <p>3. Reportar los marcadores y planillas inmediatamente al finalizar cada partido al Coordinador de Designaciones.</p>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Programacion_COARC_${fechaLabel.replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exporta las designaciones a un archivo imprimible / PowerPoint de diapositivas HTML (.ppt)
 */
export const exportDesignacionesToPowerPoint = (designaciones, fechaLabel) => {
  let content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:p='urn:schemas-microsoft-com:office:powerpoint' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Presentación COARC - ${fechaLabel}</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #090d16; color: #ffffff; padding: 40px; }
        .slide { background-color: #1e293b; border: 2px solid #334155; border-radius: 16px; padding: 30px; margin-bottom: 40px; }
        .header { border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { color: #fbbf24; font-size: 24px; margin: 0; }
        .header h2 { color: #94a3b8; font-size: 14px; margin: 5px 0 0 0; }
        .match-card { background: #0f172a; padding: 20px; border-radius: 12px; margin-bottom: 15px; border-left: 6px solid #f59e0b; }
        .time { font-family: monospace; font-size: 18px; color: #60a5fa; font-weight: bold; }
        .teams { font-size: 16px; font-weight: bold; color: #ffffff; margin: 5px 0; }
        .refs { background: #1e293b; padding: 10px; border-radius: 8px; font-size: 13px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div className="slide">
        <div className="header">
          <h1>CORPORACIÓN ARBITRAL DE CÓRDOBA COARC</h1>
          <h2>PROGRAMACIÓN OFICIAL JORNADA - ${fechaLabel}</h2>
        </div>
        <p>Total de Partidos Asignados: <strong>${designaciones.length}</strong></p>
      </div>
  `;

  designaciones.forEach((d, idx) => {
    content += `
      <div className="slide">
        <div className="match-card">
          <div className="time">PARTIDO #${d.item || idx + 1} — ${d.hora}</div>
          <div className="teams">${d.partido || 'ENCUENTRO'}</div>
          <div>Cancha: <strong>${d.cancha}</strong> (${d.municipio || 'MONTERÍA'})</div>
          <div>Torneo: <strong>${d.categoria_torneo || d.torneo}</strong></div>
          
          <div className="refs">
            <div><strong>ÁRBITRO PRINCIPAL:</strong> ${d.arbitro_principal || 'SIN ASIGNAR'}</div>
            ${d.asistente_1 ? `<div><strong>ASISTENTE 1:</strong> ${d.asistente_1}</div>` : ''}
            ${d.asistente_2 ? `<div><strong>ASISTENTE 2:</strong> ${d.asistente_2}</div>` : ''}
            ${d.emergente ? `<div><strong>EMERGENTE:</strong> ${d.emergente}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  });

  content += `
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', content], { type: 'application/vnd.ms-powerpoint' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Presentacion_COARC_${fechaLabel.replace(/\s+/g, '_')}.ppt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
