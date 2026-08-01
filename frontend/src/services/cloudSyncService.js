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

    const localDesignaciones = localState?.designaciones || [];
    if (localDesignaciones.length === 0) {
      console.log('[CloudSync] Push cancelado: lista local vacía, se protege la nube.');
      return null;
    }

    pushInProgress = true;
    try {
      const mergedPayload = {
        designaciones: localDesignaciones,
        customArbitros: localState?.customArbitros || [],
        customMunicipios: localState?.customMunicipios || [],
        disponibilidades: localState?.disponibilidades || {},
        pagosState: localState?.pagosState || {},
        updatedAt: new Date().toISOString()
      };

      // Subir a la nube directamente (Reemplazo atómico limpio)
      await axios.put(CLOUD_ENDPOINT, {
        name: 'COARC_GLOBAL_DATABASE_2026_V1',
        data: mergedPayload
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      console.log(`[CloudSync] ✅ Push exitoso: ${localDesignaciones.length} partidos en la nube`);
      return mergedPayload;

    } catch (error) {
      console.warn('[CloudSync] pushCloudData falló:', error?.message);
      return null;
    } finally {
      pushInProgress = false;
    }
  }
};
