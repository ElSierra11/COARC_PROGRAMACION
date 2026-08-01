import axios from 'axios';

const CLOUD_OBJECT_ID = 'ff8081819f7e10ae019fbf2e9da95ed8';
const CLOUD_ENDPOINT = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;

// Mutex simple: evita que dos push corran en paralelo y se pisen
let pushInProgress = false;

export const cloudSyncService = {

  /**
   * Obtiene los datos de la nube.
   * Retorna el objeto `data` o null si falla.
   */
  fetchCloudData: async () => {
    try {
      const response = await axios.get(CLOUD_ENDPOINT, { timeout: 8000 });
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.warn('[CloudSync] fetch falló:', error?.message);
      return null;
    }
  },

  /**
   * Hace push de la lista de designaciones a la nube con merge inteligente.
   * NUNCA sobreescribe la nube con un array vacío si la nube ya tiene datos.
   *
   * @param {Object} localState - { designaciones, customArbitros, disponibilidades, pagosState }
   */
  pushCloudData: async (localState) => {
    // Si ya hay un push en curso, ignorar este (evitar condición de carrera)
    if (pushInProgress) {
      console.log('[CloudSync] Push ignorado (ya hay uno en curso)');
      return null;
    }

    // PROTECCIÓN CRÍTICA: si la lista local está vacía, NO subir.
    // Un estado local vacío casi siempre es un error de carga, no una intención real de borrar todo.
    const localDesignaciones = localState?.designaciones || [];
    if (localDesignaciones.length === 0) {
      console.log('[CloudSync] Push cancelado: lista local vacía, se protege la nube.');
      return null;
    }

    pushInProgress = true;
    try {
      // 1. Leer estado actual de la nube
      let remoteData = null;
      try {
        const response = await axios.get(CLOUD_ENDPOINT, { timeout: 8000 });
        if (response.data && response.data.data) {
          remoteData = response.data.data;
        }
      } catch (e) {
        console.warn('[CloudSync] No se pudo leer nube antes de push:', e?.message);
      }

      // 2. Merge designaciones por ID
      //    Local tiene prioridad (es la acción que acaba de hacer el usuario)
      //    Remote agrega los partidos de otros dispositivos que no están en local
      const mergedMap = new Map();

      // Primero la nube (base)
      if (remoteData && Array.isArray(remoteData.designaciones)) {
        remoteData.designaciones.forEach(d => {
          if (d && d.id) mergedMap.set(String(d.id), d);
        });
      }

      // Luego el local sobreescribe/agrega (tiene prioridad)
      localDesignaciones.forEach(d => {
        if (d && d.id) mergedMap.set(String(d.id), d);
      });

      const mergedDesignaciones = Array.from(mergedMap.values());

      // 3. Merge árbitros personalizados (unión)
      const remoteArbitros = Array.isArray(remoteData?.customArbitros) ? remoteData.customArbitros : [];
      const localArbitros = Array.isArray(localState?.customArbitros) ? localState.customArbitros : [];
      const mergedArbitros = Array.from(new Set([...remoteArbitros, ...localArbitros])).filter(Boolean);

      // 4. Merge municipios personalizados (unión)
      const remoteMunicipios = Array.isArray(remoteData?.customMunicipios) ? remoteData.customMunicipios : [];
      const localMunicipios = Array.isArray(localState?.customMunicipios) ? localState.customMunicipios : [];
      const mergedMunicipios = Array.from(new Set([...remoteMunicipios, ...localMunicipios])).filter(Boolean);

      // 5. Merge disponibilidades y pagos (local tiene prioridad)
      const mergedDisponibilidades = {
        ...(remoteData?.disponibilidades || {}),
        ...(localState?.disponibilidades || {})
      };
      const mergedPagosState = {
        ...(remoteData?.pagosState || {}),
        ...(localState?.pagosState || {})
      };

      const mergedPayload = {
        designaciones: mergedDesignaciones,
        customArbitros: mergedArbitros,
        customMunicipios: mergedMunicipios,
        disponibilidades: mergedDisponibilidades,
        pagosState: mergedPagosState,
        updatedAt: new Date().toISOString()
      };

      // 6. Subir a la nube
      await axios.put(CLOUD_ENDPOINT, {
        name: 'COARC_GLOBAL_DATABASE_2026_V1',
        data: mergedPayload
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      console.log(`[CloudSync] ✅ Push exitoso: ${mergedDesignaciones.length} partidos en la nube`);
      return mergedPayload;

    } catch (error) {
      console.warn('[CloudSync] pushCloudData falló:', error?.message);
      return null;
    } finally {
      pushInProgress = false;
    }
  }
};
