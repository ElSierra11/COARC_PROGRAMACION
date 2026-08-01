import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { designacionesService, arbitrosService } from '../services/api';

const DesignacionesContext = createContext();

export const DesignacionesProvider = ({ children }) => {
  const [selectedDateIso, setSelectedDateIso] = useState('2026-08-01');
  const [selectedDateLabel, setSelectedDateLabel] = useState('SABADO 01 AGOSTO');
  const [designaciones, setDesignaciones] = useState(() => {
    try {
      const saved = localStorage.getItem('coarc_saved_designaciones');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Error al leer localstorage:", e);
      return [];
    }
  });
  const [customArbitros, setCustomArbitros] = useState(() => {
    try {
      const saved = localStorage.getItem('coarc_custom_arbitros');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const addCustomArbitros = (namesArray) => {
    const cleanNames = namesArray
      .map(n => n.trim().toUpperCase())
      .filter(n => n.length > 0);

    const updated = Array.from(new Set([...customArbitros, ...cleanNames]));
    setCustomArbitros(updated);
    try {
      localStorage.setItem('coarc_custom_arbitros', JSON.stringify(updated));
    } catch (e) {}
  };

  const removeCustomArbitro = (name) => {
    if (!name) return;
    const clean = name.trim().toUpperCase();
    const updated = customArbitros.filter(n => n.toUpperCase() !== clean);
    setCustomArbitros(updated);
    try {
      localStorage.setItem('coarc_custom_arbitros', JSON.stringify(updated));
    } catch (e) {}
  };

  // Estado de liquidaciones y pagos de honorarios por partido y por árbitro
  const [pagosState, setPagosState] = useState(() => {
    try {
      const saved = localStorage.getItem('coarc_pagos_state');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const togglePagoArbitro = (designacionId, arbitroNombre) => {
    if (!designacionId || !arbitroNombre) return;
    const key = `${designacionId}_${arbitroNombre.trim().toUpperCase()}`;
    const updated = {
      ...pagosState,
      [key]: !pagosState[key]
    };
    setPagosState(updated);
    try {
      localStorage.setItem('coarc_pagos_state', JSON.stringify(updated));
    } catch (e) {}
  };

  const setPagoArbitroStatus = (designacionId, arbitroNombre, isPaid) => {
    if (!designacionId || !arbitroNombre) return;
    const key = `${designacionId}_${arbitroNombre.trim().toUpperCase()}`;
    const updated = {
      ...pagosState,
      [key]: isPaid
    };
    setPagosState(updated);
    try {
      localStorage.setItem('coarc_pagos_state', JSON.stringify(updated));
    } catch (e) {}
  };

  const [arbitros, setArbitros] = useState([]);
  const [arbitroStats, setArbitroStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCancha, setSelectedCancha] = useState('');
  const [selectedTorneo, setSelectedTorneo] = useState('');
  const [selectedMunicipio, setSelectedMunicipio] = useState('');

  const saveToLocal = (newDesignaciones) => {
    setDesignaciones(newDesignaciones);
    try {
      localStorage.setItem('coarc_saved_designaciones', JSON.stringify(newDesignaciones));
    } catch (e) {
      console.error("Error al guardar en localstorage:", e);
    }
  };

  const fetchArbitros = async () => {
    try {
      const data = await arbitrosService.getArbitros();
      setArbitros(data);
    } catch (err) {
      console.error("Error al cargar árbitros:", err);
    }
  };

  // Auto-registra (upsert) el árbitro en el sistema al ser asignado en una designación.
  // Si ya existe, lo sobreescribe/actualiza; si es nuevo, lo crea.
  // NO llama fetchArbitros internamente — el llamador lo hace una sola vez al terminar.
  const autoRegisterArbitro = async (nombre) => {
    if (!nombre) return;
    const clean = nombre.trim().toUpperCase();
    if (!clean) return;
    try {
      await arbitrosService.registerArbitro({ nombre: clean, is_active: true });
    } catch (err) {
      console.warn('No se pudo registrar el árbitro:', clean, err);
    }
  };

  const fetchDesignaciones = async () => {
    setLoading(true);
    try {
      const params = { fecha_iso: selectedDateIso };
      if (selectedCancha) params.cancha = selectedCancha;
      if (selectedTorneo) params.torneo = selectedTorneo;
      if (searchQuery) params.arbitro = searchQuery;

      const data = await designacionesService.getDesignaciones(params);
      if (data && data.length > 0) {
        // Merge server data with local user additions if any
        let localItems = [];
        try {
          const localSaved = localStorage.getItem('coarc_saved_designaciones');
          localItems = localSaved ? JSON.parse(localSaved) : [];
        } catch (e) {
          localItems = [];
        }
        
        const mergedMap = new Map();
        data.forEach(d => mergedMap.set(d.id, d));
        localItems.forEach(d => {
          if (d && d.id && !mergedMap.has(d.id)) mergedMap.set(d.id, d);
        });

        const mergedList = Array.from(mergedMap.values());
        saveToLocal(mergedList);
      } else {
        try {
          const localSaved = localStorage.getItem('coarc_saved_designaciones');
          if (!localSaved) {
            saveToLocal([]);
          }
        } catch (e) {}
      }

      const stats = await designacionesService.getArbitrosStats(selectedDateIso);
      setArbitroStats(stats);
    } catch (err) {
      console.warn("Backend API offline/restarting, usando datos guardados localmente:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArbitros();
  }, []);

  useEffect(() => {
    fetchDesignaciones();
  }, [selectedDateIso, selectedCancha, selectedTorneo, searchQuery]);

  // Guarda localmente de forma INSTANTÁNEA y sincroniza con el backend en segundo plano
  const addDesignacion = (data) => {
    const newDes = { ...data, id: Date.now(), item: designaciones.length + 1 };
    const updated = [...designaciones, newDes];
    saveToLocal(updated);
    // Sync con backend en background — no bloquea la UI
    designacionesService.createDesignacion(data).catch(err =>
      console.warn("Guardado localmente. Se sincronizará con el backend al reconectar.", err)
    );
    return newDes;
  };

  // Actualiza localmente de forma INSTANTÁNEA y sincroniza con el backend en segundo plano
  const updateDesignacion = (id, data) => {
    const updated = designaciones.map(d => d.id === id ? { ...d, ...data } : d);
    saveToLocal(updated);
    // Sync con backend en background — no bloquea la UI
    designacionesService.updateDesignacion(id, data).catch(err =>
      console.warn("Actualizado localmente.", err)
    );
    return { ...data, id };
  };

  // Elimina localmente de forma INSTANTÁNEA y sincroniza con el backend en segundo plano
  const deleteDesignacion = (id) => {
    const updated = designaciones.filter(d => d.id !== id);
    saveToLocal(updated);
    // Sync con backend en background — no bloquea la UI
    designacionesService.deleteDesignacion(id).catch(err =>
      console.warn("Eliminado localmente.", err)
    );
  };

  // Estado de disponibilidad de árbitros por fecha
  const [disponibilidades, setDisponibilidades] = useState(() => {
    try {
      const saved = localStorage.getItem('coarc_disponibilidades');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

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
      try {
        localStorage.setItem('coarc_disponibilidades', JSON.stringify(newDisp));
      } catch (e) {}
      return newDisp;
    });
  };

  // Duplicar un partido individualmente
  const duplicarPartido = (id) => {
    const original = designaciones.find(d => d.id === id);
    if (!original) return;
    const copyData = {
      ...original,
      id: Date.now() + Math.floor(Math.random() * 1000),
      categoria_torneo: `${original.categoria_torneo || original.torneo || ''} (Copia)`.trim(),
      item: designaciones.length + 1
    };
    const updated = [...designaciones, copyData];
    saveToLocal(updated);
    designacionesService.createDesignacion(copyData).catch(e => console.warn("Guardado duplicado local:", e));
    return copyData;
  };

  // Importar lote de designaciones
  const importarDesignaciones = (listaNuevos) => {
    if (!Array.isArray(listaNuevos) || listaNuevos.length === 0) return;
    const baseTime = Date.now();
    const creados = listaNuevos.map((item, idx) => ({
      ...item,
      id: baseTime + idx,
      fecha_iso: selectedDateIso,
      fecha_label: selectedDateLabel,
      item: designaciones.length + idx + 1,
      estado: item.estado || 'PROGRAMADO'
    }));

    const updated = [...designaciones, ...creados];
    saveToLocal(updated);

    // Sync con backend
    creados.forEach(d => {
      designacionesService.createDesignacion(d).catch(e => console.warn("Import local:", e));
    });
    return creados;
  };

  // Duplicar jornada completa a otra fecha
  const duplicarJornada = (fechaOrigenIso, fechaDestinoIso, fechaDestinoLabel) => {
    const partidosOrigen = designaciones.filter(d => (d.fecha_iso || selectedDateIso) === fechaOrigenIso);
    if (partidosOrigen.length === 0) return 0;

    const baseTime = Date.now();
    const partidosClonados = partidosOrigen.map((p, idx) => ({
      ...p,
      id: baseTime + idx,
      fecha_iso: fechaDestinoIso,
      fecha_label: fechaDestinoLabel,
      estado: 'PROGRAMADO'
    }));

    const updated = [...designaciones, ...partidosClonados];
    saveToLocal(updated);

    partidosClonados.forEach(d => {
      designacionesService.createDesignacion(d).catch(e => console.warn("Sync duplicado jornada:", e));
    });

    return partidosClonados.length;
  };

  // Cálculo dinámico instantáneo de la estadística de carga de árbitros (local + servidor)
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
          statsMap.set(cleanName, {
            nombre: cleanName,
            total_partidos: 0,
            detalles_partidos: []
          });
        }

        const refObj = statsMap.get(cleanName);
        refObj.total_partidos += 1;
        refObj.detalles_partidos.push({
          hora: d.hora || '08:00 AM',
          cancha: d.cancha || 'CANCHA 1',
          torneo: d.categoria_torneo || d.torneo || 'TORNEO',
          categoria: d.categoria || 'LIBRE',
          rol: rol,
          partido: d.partido || ''
        });
      });
    });

    // Incluir también datos que vengan del backend si hay algún árbitro adicional
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
