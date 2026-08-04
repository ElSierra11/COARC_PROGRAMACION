import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { designacionesService, arbitrosService } from '../services/api';
import { cloudSyncService } from '../services/cloudSyncService';

const DesignacionesContext = createContext();

export const DesignacionesProvider = ({ children }) => {
  const [selectedDateIso, setSelectedDateIso] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedDateLabel, setSelectedDateLabel] = useState(() => {
    const d = new Date();
    const DIAS = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    return `${DIAS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]}`;
  });

  // ────────────────────────────────────────────────────────────────────
  // Estado inicial desde localStorage (Cache rápida temporal)
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
      return Array.from(new Set(parsed.map(n => n?.trim().toUpperCase()).filter(Boolean)));
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
  // PUSH A LA NUBE (Sincronización instantánea)
  // ────────────────────────────────────────────────────────────────────
  const pushToCloud = (updatedDesignaciones) => {
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

    cloudSyncService.pushCloudData({
      designaciones: updatedDesignaciones,
      customArbitros: freshCustomArbitros,
      disponibilidades: freshDisponibilidades,
      pagosState: freshPagosState
    });
  };

  // ────────────────────────────────────────────────────────────────────
  // FETCH Y SINCRONIZACIÓN DESDE LA NUBE (La Nube es la Fuente de la Verdad)
  // ────────────────────────────────────────────────────────────────────
  const pullFromCloud = async () => {
    const cloudData = await cloudSyncService.fetchCloudData();
    if (!cloudData) return;

    if (Array.isArray(cloudData.designaciones)) {
      saveDesignacionesLocal(cloudData.designaciones);
    }

    if (Array.isArray(cloudData.customArbitros)) {
      setCustomArbitros(cloudData.customArbitros);
      try { localStorage.setItem('coarc_custom_arbitros', JSON.stringify(cloudData.customArbitros)); } catch (e) {}
    }

    if (cloudData.disponibilidades && typeof cloudData.disponibilidades === 'object') {
      setDisponibilidades(cloudData.disponibilidades);
      try { localStorage.setItem('coarc_disponibilidades', JSON.stringify(cloudData.disponibilidades)); } catch (e) {}
    }

    if (cloudData.pagosState && typeof cloudData.pagosState === 'object') {
      setPagosState(cloudData.pagosState);
      try { localStorage.setItem('coarc_pagos_state', JSON.stringify(cloudData.pagosState)); } catch (e) {}
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
  // Carga inicial inmediata, polling (cada 4s) y sync al enfocar ventana
  // ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchArbitros();

    // Carga de inmediato los datos más recientes de la nube al refrescar la página
    pullFromCloud();

    // Polling constante cada 4 segundos
    const intervalId = setInterval(pullFromCloud, 4000);

    // Sincronizar inmediatamente al enfocar o hacer visible la app
    const handleFocus = () => pullFromCloud();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') pullFromCloud();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

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
  // CRUD de Designaciones (Actualiza local e interactúa en vivo con la Nube)
  // ────────────────────────────────────────────────────────────────────
  const addDesignacion = (data) => {
    const current = readDesignacionesLocal();
    const newDes = { ...data, id: Date.now(), item: current.length + 1, updatedAt: Date.now() };
    const updated = [...current, newDes];
    saveDesignacionesLocal(updated);
    pushToCloud(updated);
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
      item: current.length + 1,
      updatedAt: Date.now()
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
      estado: item.estado || 'PROGRAMADO',
      updatedAt: baseTime
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
      estado: 'PROGRAMADO',
      updatedAt: baseTime
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
      cloudSyncService.pushCloudData({
        designaciones: readDesignacionesLocal(),
        customArbitros: JSON.parse(localStorage.getItem('coarc_custom_arbitros') || '[]'),
        disponibilidades: newDisp,
        pagosState: JSON.parse(localStorage.getItem('coarc_pagos_state') || '{}')
      });
      return newDisp;
    });
  };

  const fetchDesignaciones = async () => {
    await pullFromCloud();
    try {
      const stats = await designacionesService.getArbitrosStats(selectedDateIso);
      setArbitroStats(stats);
    } catch (e) {}
  };

  // ────────────────────────────────────────────────────────────────────
  // Estadísticas de árbitros
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
