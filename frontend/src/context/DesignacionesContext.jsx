import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { designacionesService, arbitrosService } from '../services/api';
import { cloudSyncService } from '../services/cloudSyncService';

const DesignacionesContext = createContext();

export const DesignacionesProvider = ({ children }) => {
  // Bug #7 fix: usar la fecha actual del sistema en lugar de una fecha hardcodeada
  const [selectedDateIso, setSelectedDateIso] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedDateLabel, setSelectedDateLabel] = useState(() => {
    const d = new Date();
    const DIAS = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    return `${DIAS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]}`;
  });

  // ────────────────────────────────────────────────────────────────────
  // Estado inicial desde localStorage
  // ────────────────────────────────────────────────────────────────────
  const [designaciones, setDesignaciones] = useState(() => {
    try {
      const saved = localStorage.getItem('coarc_saved_designaciones');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  });

  const [customArbitros, setCustomArbitros] = useState(() => {
    try {
      const saved = localStorage.getItem('coarc_custom_arbitros');
      const parsed = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(parsed)) return [];
      // Deduplicar al cargar: normalizar a mayúsculas y eliminar duplicados del localStorage viejo
      const deduped = Array.from(new Set(parsed.map(n => n?.trim().toUpperCase()).filter(Boolean)));
      return deduped;
    } catch (e) { return []; }
  });

  const [pagosState, setPagosState] = useState(() => {
    try {
      const saved = localStorage.getItem('coarc_pagos_state');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  const [disponibilidades, setDisponibilidades] = useState(() => {
    try {
      const saved = localStorage.getItem('coarc_disponibilidades');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  const [arbitros, setArbitros] = useState([]);
  const [arbitroStats, setArbitroStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCancha, setSelectedCancha] = useState('');
  const [selectedTorneo, setSelectedTorneo] = useState('');
  const [selectedMunicipio, setSelectedMunicipio] = useState('');

  // ────────────────────────────────────────────────────────────────────
  // Helpers de persistencia local
  // ────────────────────────────────────────────────────────────────────
  const saveDesignacionesLocal = (list) => {
    setDesignaciones(list);
    try { localStorage.setItem('coarc_saved_designaciones', JSON.stringify(list)); } catch (e) {}
  };

  const readDesignacionesLocal = () => {
    try {
      const raw = localStorage.getItem('coarc_saved_designaciones');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  };

  // ────────────────────────────────────────────────────────────────────
  // Helpers para rastrear IDs eliminados — evita que el cloud sync los restaure
  // ────────────────────────────────────────────────────────────────────
  const getDeletedIds = () => {
    try {
      const raw = localStorage.getItem('coarc_deleted_ids');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };

  const addDeletedId = (id) => {
    const ids = getDeletedIds();
    const idStr = String(id);
    if (!ids.includes(idStr)) {
      ids.push(idStr);
      // Mantener solo los últimos 500 IDs eliminados para no crecer indefinidamente
      const trimmed = ids.slice(-500);
      try { localStorage.setItem('coarc_deleted_ids', JSON.stringify(trimmed)); } catch (e) {}
    }
  };

  // ────────────────────────────────────────────────────────────────────
  // PUSH A LA NUBE
  // Siempre pasa la lista ACTUALIZADA directamente. Nunca lee del estado React
  // (que puede ser stale). Lee customArbitros/disponibilidades/pagos de
  // localStorage para asegurarse de tener el valor más reciente.
  // ────────────────────────────────────────────────────────────────────
  const pushToCloud = (updatedDesignaciones) => {
    // Leer los demás datos de localStorage (siempre frescos)
    let freshCustomArbitros = [];
    let freshDisponibilidades = {};
    let freshPagosState = {};

    try {
      const raw = localStorage.getItem('coarc_custom_arbitros');
      freshCustomArbitros = raw ? JSON.parse(raw) : [];
    } catch (e) {}
    try {
      const raw = localStorage.getItem('coarc_disponibilidades');
      freshDisponibilidades = raw ? JSON.parse(raw) : {};
    } catch (e) {}
    try {
      const raw = localStorage.getItem('coarc_pagos_state');
      freshPagosState = raw ? JSON.parse(raw) : {};
    } catch (e) {}

    // El cloudSyncService se encarga del merge y del mutex
    cloudSyncService.pushCloudData({
      designaciones: updatedDesignaciones,
      customArbitros: freshCustomArbitros,
      disponibilidades: freshDisponibilidades,
      pagosState: freshPagosState
    });
  };

  // Helper para fusionar listas de partidos sin perder ninguno
  // Respeta los IDs eliminados localmente para que el cloud no los restaure
  const mergeDesignaciones = (localArr = [], cloudArr = []) => {
    const deletedIds = new Set(getDeletedIds().map(String));
    const map = new Map();

    localArr.forEach(item => {
      if (item && item.id && !deletedIds.has(String(item.id))) {
        map.set(String(item.id), item);
      }
    });

    cloudArr.forEach(item => {
      if (item && item.id) {
        const key = String(item.id);
        if (deletedIds.has(key)) return; // Este ID fue eliminado localmente → ignorar
        const existing = map.get(key);
        if (!existing) {
          map.set(key, item);
        } else {
          const existingTime = existing.updatedAt || 0;
          const cloudTime = item.updatedAt || 0;
          if (cloudTime >= existingTime) {
            map.set(key, item);
          }
        }
      }
    });

    const merged = Array.from(map.values());
    merged.sort((a, b) => (a.item || 0) - (b.item || 0) || (a.id || 0) - (b.id || 0));
    return merged;
  };

  // ────────────────────────────────────────────────────────────────────
  // FETCH Y MERGE DESDE LA NUBE
  // ────────────────────────────────────────────────────────────────────
  const pullFromCloud = async () => {
    const cloudData = await cloudSyncService.fetchCloudData();
    if (!cloudData) return; // Si falla la red, conserva el estado local sin romper nada

    const localList = readDesignacionesLocal();

    if (Array.isArray(cloudData.designaciones)) {
      const mergedList = mergeDesignaciones(localList, cloudData.designaciones);
      if (JSON.stringify(mergedList) !== JSON.stringify(localList)) {
        saveDesignacionesLocal(mergedList);
      }
    }

    if (Array.isArray(cloudData.customArbitros) && cloudData.customArbitros.length > 0) {
      setCustomArbitros(prev => {
        // Bug #2 fix: normalizar a mayúsculas antes de deduplicar (Set es case-sensitive)
        const normalizedPrev = prev.map(n => n?.trim().toUpperCase()).filter(Boolean);
        const normalizedCloud = cloudData.customArbitros.map(n => n?.trim().toUpperCase()).filter(Boolean);
        const union = Array.from(new Set([...normalizedPrev, ...normalizedCloud]));
        try { localStorage.setItem('coarc_custom_arbitros', JSON.stringify(union)); } catch (e) {}
        return union;
      });
    }

    if (cloudData.disponibilidades && typeof cloudData.disponibilidades === 'object') {
      setDisponibilidades(prev => {
        // Bug #3 fix: deep merge por árbitro usando updatedAt para no perder cambios locales
        const result = { ...prev };
        Object.entries(cloudData.disponibilidades).forEach(([fecha, arbitros]) => {
          if (!result[fecha]) {
            result[fecha] = arbitros;
          } else {
            const mergedFecha = { ...result[fecha] };
            Object.entries(arbitros || {}).forEach(([arbitro, data]) => {
              const existing = mergedFecha[arbitro];
              if (!existing || (data.updatedAt && (!existing.updatedAt || data.updatedAt > existing.updatedAt))) {
                mergedFecha[arbitro] = data;
              }
            });
            result[fecha] = mergedFecha;
          }
        });
        try { localStorage.setItem('coarc_disponibilidades', JSON.stringify(result)); } catch (e) {}
        return result;
      });
    }

    if (cloudData.pagosState && typeof cloudData.pagosState === 'object') {
      setPagosState(prev => {
        const merged = { ...prev, ...cloudData.pagosState };
        try { localStorage.setItem('coarc_pagos_state', JSON.stringify(merged)); } catch (e) {}
        return merged;
      });
    }
  };

  const fetchArbitros = async () => {
    try {
      const data = await arbitrosService.getArbitros();
      setArbitros(data);
    } catch (err) {}
  };

  const autoRegisterArbitro = async (nombre) => {
    if (!nombre) return;
    const clean = nombre.trim().toUpperCase();
    try { await arbitrosService.registerArbitro({ nombre: clean, is_active: true }); } catch (err) {}
  };

  // ────────────────────────────────────────────────────────────────────
  // Carga inicial, polling y sincronización en tiempo real entre pestañas
  // ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchArbitros();

    const initialSync = async () => {
      const cloudData = await cloudSyncService.fetchCloudData();
      const localList = readDesignacionesLocal();

      if (cloudData !== null) {
        const cloudList = Array.isArray(cloudData.designaciones) ? cloudData.designaciones : [];
        const merged = mergeDesignaciones(localList, cloudList);

        saveDesignacionesLocal(merged);

        // Bug #4 fix: detectar cambios por contenido, no solo por cantidad.
        // Si se editó un árbitro o estado de un partido existente, el count es igual → antes no subía.
        const cloudMap = new Map(cloudList.map(d => [String(d.id), d]));
        const hasNew = merged.some(d => !cloudMap.has(String(d.id)));
        const hasModified = merged.some(d => {
          const cloudItem = cloudMap.get(String(d.id));
          return cloudItem && (d.updatedAt || 0) > (cloudItem.updatedAt || 0);
        });
        if (hasNew || hasModified) {
          console.log(`[CloudSync] Subiendo ${merged.length} partidos (cambios detectados) a la nube...`);
          cloudSyncService.pushCloudData({
            designaciones: merged,
            customArbitros: JSON.parse(localStorage.getItem('coarc_custom_arbitros') || '[]'),
            disponibilidades: JSON.parse(localStorage.getItem('coarc_disponibilidades') || '{}'),
            pagosState: JSON.parse(localStorage.getItem('coarc_pagos_state') || '{}')
          });
        }
      } else {
        console.warn('[CloudSync] No se pudo conectar a la nube en el inicio. Conservando datos locales.');
      }
    };

    initialSync();

    // Polling recurrente cada 6 segundos
    const intervalId = setInterval(pullFromCloud, 6000);

    // Al enfocar ventana/pestaña
    const handleFocus = () => pullFromCloud();
    window.addEventListener('focus', handleFocus);

    // Sincronización instantánea entre pestañas/ventanas del mismo navegador
    const handleStorage = (e) => {
      if (e.key === 'coarc_saved_designaciones') {
        try {
          const parsed = JSON.parse(e.newValue || '[]');
          setDesignaciones(parsed);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Stats del backend (opcional, no crítico)
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const stats = await designacionesService.getArbitrosStats(selectedDateIso);
        setArbitroStats(stats);
      } catch (err) {}
      finally { setLoading(false); }
    };
    fetchStats();
  }, [selectedDateIso]);

  // ────────────────────────────────────────────────────────────────────
  // CRUD de Designaciones
  // ────────────────────────────────────────────────────────────────────
  const addDesignacion = (data) => {
    const current = readDesignacionesLocal(); // Leer SIEMPRE del storage (más fresco que estado React)
    const newDes = { ...data, id: Date.now(), item: current.length + 1, updatedAt: Date.now() };
    const updated = [...current, newDes];
    saveDesignacionesLocal(updated);
    pushToCloud(updated); // Subir la lista completa actualizada
    designacionesService.createDesignacion(data).catch(() => {});
    return newDes;
  };

  const updateDesignacion = (id, data) => {
    const current = readDesignacionesLocal();
    const updated = current.map(d => d.id === id ? { ...d, ...data, updatedAt: Date.now() } : d);
    saveDesignacionesLocal(updated);
    pushToCloud(updated);
    designacionesService.updateDesignacion(id, data).catch(() => {});
    return { ...data, id };
  };

  const deleteDesignacion = (id) => {
    const current = readDesignacionesLocal();
    const updated = current.filter(d => d.id !== id);
    addDeletedId(id); // Registrar el ID eliminado para que el cloud sync no lo restaure
    saveDesignacionesLocal(updated);
    pushToCloud(updated);
    designacionesService.deleteDesignacion(id).catch(() => {});
  };

  const duplicarPartido = (id) => {
    const current = readDesignacionesLocal();
    const original = current.find(d => d.id === id);
    if (!original) return;
    const copyData = {
      ...original,
      id: Date.now() + Math.floor(Math.random() * 1000),
      categoria_torneo: `${original.categoria_torneo || original.torneo || ''} (Copia)`.trim(),
      item: current.length + 1
    };
    const updated = [...current, copyData];
    saveDesignacionesLocal(updated);
    pushToCloud(updated);
    designacionesService.createDesignacion(copyData).catch(() => {});
    return copyData;
  };

  const importarDesignaciones = (listaNuevos) => {
    if (!Array.isArray(listaNuevos) || listaNuevos.length === 0) return;
    const current = readDesignacionesLocal();
    const baseTime = Date.now();
    const creados = listaNuevos.map((item, idx) => ({
      ...item,
      id: baseTime + idx,
      fecha_iso: selectedDateIso,
      fecha_label: selectedDateLabel,
      item: current.length + idx + 1,
      estado: item.estado || 'PROGRAMADO'
    }));
    const updated = [...current, ...creados];
    saveDesignacionesLocal(updated);
    pushToCloud(updated);
    creados.forEach(d => designacionesService.createDesignacion(d).catch(() => {}));
    return creados;
  };

  const duplicarJornada = (fechaOrigenIso, fechaDestinoIso, fechaDestinoLabel) => {
    const current = readDesignacionesLocal();
    const partidosOrigen = current.filter(d => (d.fecha_iso || selectedDateIso) === fechaOrigenIso);
    if (partidosOrigen.length === 0) return 0;
    const baseTime = Date.now();
    const partidosClonados = partidosOrigen.map((p, idx) => ({
      ...p,
      id: baseTime + idx,
      fecha_iso: fechaDestinoIso,
      fecha_label: fechaDestinoLabel,
      estado: 'PROGRAMADO'
    }));
    const updated = [...current, ...partidosClonados];
    saveDesignacionesLocal(updated);
    pushToCloud(updated);
    partidosClonados.forEach(d => designacionesService.createDesignacion(d).catch(() => {}));
    return partidosClonados.length;
  };

  // ────────────────────────────────────────────────────────────────────
  // Árbitros personalizados
  // ────────────────────────────────────────────────────────────────────
  const addCustomArbitros = (namesArray) => {
    const cleanNames = namesArray.map(n => n.trim().toUpperCase()).filter(n => n.length > 0);
    const updated = Array.from(new Set([...customArbitros, ...cleanNames]));
    setCustomArbitros(updated);
    try { localStorage.setItem('coarc_custom_arbitros', JSON.stringify(updated)); } catch (e) {}

    // Bug #6 fix: siempre sincronizar árbitros a la nube sin guard de designaciones.
    // El guard anti-vaciado ya vive dentro de cloudSyncService.pushCloudData.
    cloudSyncService.pushCloudData({
      designaciones: readDesignacionesLocal(),
      customArbitros: updated,
      disponibilidades: JSON.parse(localStorage.getItem('coarc_disponibilidades') || '{}'),
      pagosState: JSON.parse(localStorage.getItem('coarc_pagos_state') || '{}')
    });
  };

  const removeCustomArbitro = (name) => {
    if (!name) return;
    const clean = name.trim().toUpperCase();
    const updated = customArbitros.filter(n => n.toUpperCase() !== clean);
    setCustomArbitros(updated);
    try { localStorage.setItem('coarc_custom_arbitros', JSON.stringify(updated)); } catch (e) {}
    // Bug #6 fix: siempre sincronizar
    cloudSyncService.pushCloudData({
      designaciones: readDesignacionesLocal(),
      customArbitros: updated,
      disponibilidades: JSON.parse(localStorage.getItem('coarc_disponibilidades') || '{}'),
      pagosState: JSON.parse(localStorage.getItem('coarc_pagos_state') || '{}')
    });
  };

  // ────────────────────────────────────────────────────────────────────
  // Pagos
  // ────────────────────────────────────────────────────────────────────
  const togglePagoArbitro = (designacionId, arbitroNombre) => {
    if (!designacionId || !arbitroNombre) return;
    const key = `${designacionId}_${arbitroNombre.trim().toUpperCase()}`;
    const updated = { ...pagosState, [key]: !pagosState[key] };
    setPagosState(updated);
    try { localStorage.setItem('coarc_pagos_state', JSON.stringify(updated)); } catch (e) {}
    // Bug #6 fix: siempre sincronizar pagos a la nube
    cloudSyncService.pushCloudData({
      designaciones: readDesignacionesLocal(),
      customArbitros: JSON.parse(localStorage.getItem('coarc_custom_arbitros') || '[]'),
      disponibilidades: JSON.parse(localStorage.getItem('coarc_disponibilidades') || '{}'),
      pagosState: updated
    });
  };

  const setPagoArbitroStatus = (designacionId, arbitroNombre, isPaid) => {
    if (!designacionId || !arbitroNombre) return;
    const key = `${designacionId}_${arbitroNombre.trim().toUpperCase()}`;
    const updated = { ...pagosState, [key]: isPaid };
    setPagosState(updated);
    try { localStorage.setItem('coarc_pagos_state', JSON.stringify(updated)); } catch (e) {}
    // Bug #6 fix: siempre sincronizar pagos a la nube
    cloudSyncService.pushCloudData({
      designaciones: readDesignacionesLocal(),
      customArbitros: JSON.parse(localStorage.getItem('coarc_custom_arbitros') || '[]'),
      disponibilidades: JSON.parse(localStorage.getItem('coarc_disponibilidades') || '{}'),
      pagosState: updated
    });
  };

  // ────────────────────────────────────────────────────────────────────
  // Disponibilidades
  // ────────────────────────────────────────────────────────────────────
  const updateDisponibilidad = (fechaIso, arbitroNombre, estado, nota = '') => {
    if (!fechaIso || !arbitroNombre) return;
    const cleanNombre = arbitroNombre.trim().toUpperCase();
    setDisponibilidades(prev => {
      const fechaObj = prev[fechaIso] || {};
      const updatedFecha = {
        ...fechaObj,
        [cleanNombre]: { estado, nota, updatedAt: new Date().toISOString() }
      };
      const newDisp = { ...prev, [fechaIso]: updatedFecha };
      try { localStorage.setItem('coarc_disponibilidades', JSON.stringify(newDisp)); } catch (e) {}
      // Bug #6 fix: siempre sincronizar disponibilidades a la nube
      cloudSyncService.pushCloudData({
        designaciones: readDesignacionesLocal(),
        customArbitros: JSON.parse(localStorage.getItem('coarc_custom_arbitros') || '[]'),
        disponibilidades: newDisp,
        pagosState: JSON.parse(localStorage.getItem('coarc_pagos_state') || '{}')
      });
      return newDisp;
    });
  };

  // Exportado para compatibilidad con componentes existentes (no hace push a nube, solo local)
  const fetchDesignaciones = async () => {
    await pullFromCloud();
    try {
      const stats = await designacionesService.getArbitrosStats(selectedDateIso);
      setArbitroStats(stats);
    } catch (e) {}
  };

  // ────────────────────────────────────────────────────────────────────
  // Estadísticas de árbitros (calculadas localmente en tiempo real)
  // ────────────────────────────────────────────────────────────────────
  const computedArbitroStats = useMemo(() => {
    const statsMap = new Map();
    const matchesForDate = (designaciones || []).filter(
      d => d && (!d.fecha_iso || d.fecha_iso === selectedDateIso)
    );

    matchesForDate.forEach(d => {
      const roles = [
        { name: d.arbitro_principal, rol: 'Principal' },
        ...(d.es_cuadra ? [
          { name: d.asistente_1, rol: 'Asistente 1' },
          { name: d.asistente_2, rol: 'Asistente 2' },
          { name: d.emergente, rol: 'Emergente' }
        ] : [])
      ];

      roles.forEach(({ name, rol }) => {
        if (!name || !name.trim()) return;
        const cleanName = name.trim().toUpperCase();
        if (!statsMap.has(cleanName)) {
          statsMap.set(cleanName, { nombre: cleanName, total_partidos: 0, detalles_partidos: [] });
        }
        const refObj = statsMap.get(cleanName);
        refObj.total_partidos += 1;
        refObj.detalles_partidos.push({
          hora: d.hora || '08:00 AM',
          cancha: d.cancha || 'CANCHA 1',
          torneo: d.categoria_torneo || d.torneo || 'TORNEO',
          categoria: d.categoria || 'LIBRE',
          rol,
          partido: d.partido || ''
        });
      });
    });

    if (Array.isArray(arbitroStats)) {
      arbitroStats.forEach(s => {
        if (s && s.nombre && !statsMap.has(s.nombre.toUpperCase())) {
          statsMap.set(s.nombre.toUpperCase(), s);
        }
      });
    }

    return Array.from(statsMap.values()).sort((a, b) => b.total_partidos - a.total_partidos);
  }, [designaciones, selectedDateIso, arbitroStats]);

  // ────────────────────────────────────────────────────────────────────
  // Provider
  // ────────────────────────────────────────────────────────────────────
  return (
    <DesignacionesContext.Provider value={{
      selectedDateIso,
      setSelectedDateIso,
      selectedDateLabel,
      setSelectedDateLabel,
      designaciones,
      arbitros,
      arbitroStats: computedArbitroStats,
      loading,
      searchQuery,
      setSearchQuery,
      selectedCancha,
      setSelectedCancha,
      selectedTorneo,
      setSelectedTorneo,
      selectedMunicipio,
      setSelectedMunicipio,
      customArbitros,
      addCustomArbitros,
      removeCustomArbitro,
      disponibilidades,
      updateDisponibilidad,
      pagosState,
      togglePagoArbitro,
      setPagoArbitroStatus,
      autoRegisterArbitro,
      fetchDesignaciones,
      addDesignacion,
      updateDesignacion,
      deleteDesignacion,
      duplicarPartido,
      importarDesignaciones,
      duplicarJornada
    }}>
      {children}
    </DesignacionesContext.Provider>
  );
};

export const useDesignaciones = () => useContext(DesignacionesContext);
