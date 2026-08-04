import * as XLSX from 'xlsx';

/**
 * Parsea un archivo de Excel (.xlsx, .xls) o CSV y extrae la lista de partidos
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
        
        // Convertir la hoja a formato JSON (matriz de objetos o arreglos)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!jsonData || jsonData.length === 0) {
          resolve([]);
          return;
        }

        const results = [];
        let headerRowIndex = -1;

        // Buscar la fila de cabecera de la tabla
        for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
          const rowStr = jsonData[i].join(' ').toLowerCase();
          if (rowStr.includes('cancha') || rowStr.includes('partido') || rowStr.includes('hora') || rowStr.includes('árbitro') || rowStr.includes('arbitro')) {
            headerRowIndex = i;
            break;
          }
        }

        const startRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;

        for (let i = startRow; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.every(val => val === '' || val === null || val === undefined)) continue;

          // Mapeo inteligente por posición o nombre de columna
          const hora = String(row[0] || '08:00 AM').trim();
          const cancha = String(row[1] || 'CANCHA 1').trim().toUpperCase();
          const torneo = String(row[2] || 'TORNEO LOCAL').trim().toUpperCase();
          const partido = String(row[3] || 'EQUIPO A VS EQUIPO B').trim().toUpperCase();
          const municipio = String(row[4] || 'MONTERÍA').trim().toUpperCase();
          const principal = String(row[5] || '').trim().toUpperCase();
          const a1 = String(row[6] || '').trim().toUpperCase();
          const a2 = String(row[7] || '').trim().toUpperCase();

          results.push({
            id_temp: i + 1,
            hora,
            cancha,
            torneo,
            categoria_torneo: torneo,
            partido,
            municipio,
            arbitro_principal: principal,
            asistente_1: a1,
            asistente_2: a2,
            emergente: '',
            observaciones: '',
            estado: 'PROGRAMADO'
          });
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

  // Configurar anchos de columna recomendados
  worksheet['!cols'] = [
    { wch: 5 },   // N°
    { wch: 12 },  // Hora
    { wch: 22 },  // Cancha
    { wch: 22 },  // Torneo
    { wch: 35 },  // Partido
    { wch: 16 },  // Municipio
    { wch: 25 },  // Principal
    { wch: 22 },  // A1
    { wch: 22 },  // A2
    { wch: 18 },  // Emergente
    { wch: 15 }   // Estado
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Programación COARC');

  const filename = `Programacion_COARC_${(fechaLabel || 'Jornada').replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

/**
 * Exporta el presupuesto corporativo a un archivo de Excel (.xlsx)
 * @param {Array} presupuestoItems - Lista de partidas de presupuesto
 * @param {Object} resumen - Objeto con métricas (totalIngresos, totalEgresos, balance)
 */
export const exportPresupuestoToExcel = (presupuestoItems, resumen) => {
  const rows = presupuestoItems.map((item, idx) => ({
    'N°': idx + 1,
    'Fecha': item.fecha,
    'Tipo': item.tipo,
    'Concepto / Descripción': item.concepto,
    'Categoría': item.categoria,
    'Monto (COP)': item.monto,
    'Estado': item.estado,
    'Notas / Referencia': item.notas || ''
  }));

  // Agregar fila de resumen al final
  rows.push({});
  rows.push({
    'N°': 'RESUMEN',
    'Concepto / Descripción': 'TOTAL INGRESOS',
    'Monto (COP)': resumen.totalIngresos
  });
  rows.push({
    'N°': 'RESUMEN',
    'Concepto / Descripción': 'TOTAL EGRESOS',
    'Monto (COP)': resumen.totalEgresos
  });
  rows.push({
    'N°': 'RESUMEN',
    'Concepto / Descripción': 'BALANCE NETO',
    'Monto (COP)': resumen.balance
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 12 },
    { wch: 40 },
    { wch: 25 },
    { wch: 18 },
    { wch: 15 },
    { wch: 30 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Presupuesto COARC');

  XLSX.writeFile(workbook, `Presupuesto_Corporativo_COARC_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/**
 * Genera y descarga un documento compatible con MS Word (.docx) con membrete corporativo
 * @param {Array} designaciones - Lista de partidos
 * @param {string} fechaLabel - Fecha de la jornada
 */
export const exportDesignacionesToWord = (designaciones, fechaLabel) => {
  let tableRows = designaciones.map((d, index) => `
    <tr style="background-color: ${index % 2 === 0 ? '#f8fafc' : '#ffffff'};">
      <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${index + 1}</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e3a8a;">${d.hora || ''}</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">${d.cancha || ''}</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1;">${d.categoria_torneo || d.torneo || ''}</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">${d.partido || ''}</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1;">${d.municipio || 'MONTERÍA'}</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #1d4ed8;">${d.arbitro_principal || 'SIN ASIGNAR'}</td>
      <td style="padding: 8px; border: 1px solid #cbd5e1;">${d.asistente_1 || '-'} / ${d.asistente_2 || '-'}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Programación Oficial COARC</title>
      <style>
        body { font-family: 'Arial', sans-serif; font-size: 12px; color: #1e293b; line-height: 1.4; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
        .title { font-size: 18px; font-weight: bold; color: #1e3a8a; margin: 0; }
        .subtitle { font-size: 13px; font-weight: bold; color: #475569; margin-top: 4px; }
        .badge { background-color: #dbeafe; color: #1e4ed8; padding: 4px 8px; font-weight: bold; border-radius: 4px; display: inline-block; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background-color: #1e3a8a; color: #ffffff; padding: 10px; border: 1px solid #1e3a8a; text-align: left; font-size: 11px; text-transform: uppercase; }
        .footer { margin-top: 30px; font-size: 10px; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">CORPORACIÓN DE ÁRBITROS DE FÚTBOL (COARC)</h1>
        <div class="subtitle">HOJA OFICIAL DE DESIGNACIONES ARBITRALES</div>
        <div style="margin-top: 10px;">
          <span class="badge">FECHA: ${fechaLabel || 'JORNADA OFICIAL'}</span>
        </div>
      </div>

      <p>A continuación se detalla la programación oficial de partidos y la terna arbitral asignada para cada escenario deportivo:</p>

      <table>
        <thead>
          <tr>
            <th style="width: 4%;">N°</th>
            <th style="width: 10%;">Hora</th>
            <th style="width: 18%;">Cancha</th>
            <th style="width: 16%;">Torneo</th>
            <th style="width: 24%;">Encuentro</th>
            <th style="width: 10%;">Municipio</th>
            <th style="width: 18%;">Árbitro Principal</th>
            <th style="width: 20%;">Asistentes</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="footer">
        Documento generado automáticamente por el Sistema de Gestión Arbitral COARC - Total partidos: ${designaciones.length}
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Designaciones_COARC_${(fechaLabel || 'Jornada').replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Genera un archivo de presentación / resumen corporativo compatible con PowerPoint (.pptx / HTML Slide Show)
 * @param {Array} designaciones - Lista de partidos
 * @param {string} fechaLabel - Fecha
 */
export const exportDesignacionesToPowerPoint = (designaciones, fechaLabel) => {
  // Agrupar por cancha para generar diapositivas por escenario
  const porCancha = {};
  designaciones.forEach(d => {
    const c = d.cancha || 'GENERAL';
    if (!porCancha[c]) porCancha[c] = [];
    porCancha[c].push(d);
  });

  let slidesHtml = Object.keys(porCancha).map(cancha => {
    const partidos = porCancha[cancha];
    const partidosRows = partidos.map(p => `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 5px solid #2563eb; padding: 12px; margin-bottom: 10px; border-radius: 8px;">
        <div style="font-weight: bold; color: #1e3a8a; font-size: 14px;">${p.hora} - ${p.partido}</div>
        <div style="font-size: 12px; color: #475569; margin-top: 4px;">Torneo: ${p.categoria_torneo || p.torneo} | Municipio: ${p.municipio}</div>
        <div style="font-size: 12px; font-weight: bold; color: #1d4ed8; margin-top: 6px;">
          Árbitro Principal: ${p.arbitro_principal || 'Sin asignar'}
          ${p.asistente_1 ? ` | A1: ${p.asistente_1}` : ''}
          ${p.asistente_2 ? ` | A2: ${p.asistente_2}` : ''}
        </div>
      </div>
    `).join('');

    return `
      <div style="page-break-after: always; padding: 30px; background-color: #f8fafc; font-family: sans-serif;">
        <div style="background: #1e3a8a; color: #ffffff; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 20px;">ESCENARIO: ${cancha}</h2>
          <div style="font-size: 12px; opacity: 0.9; margin-top: 5px;">COARC - ${fechaLabel} (${partidos.length} partidos)</div>
        </div>
        ${partidosRows}
      </div>
    `;
  }).join('');

  const fullContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:p='urn:schemas-microsoft-com:office:powerpoint' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Presentación Jornada COARC</title>
    </head>
    <body style="margin: 0; background: #ffffff;">
      ${slidesHtml}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', fullContent], {
    type: 'application/vnd.ms-powerpoint'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Presentacion_Jornada_COARC_${(fechaLabel || 'Programacion').replace(/\s+/g, '_')}.ppt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
