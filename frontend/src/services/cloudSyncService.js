import axios from 'axios';

// Endpoint oficial en la nube para sincronización en tiempo real entre dispositivos (PC, Celular, etc.)
const CLOUD_ENDPOINT = 'https://jsonblob.com/api/jsonBlob/019fcaa2-7a8e-727c-afdc-3516914faaa6';

// Mutex simple: evita que dos push corran en paralelo
let pushInProgress = false;

export const cloudSyncService = {

  /**
   * Obtiene los datos de la nube.
   * Retorna el objeto `data` o null si falla la conexión.
   */
  fetchCloudData: async () => {
    try {
      const response = await axios.get(CLOUD_ENDPOINT, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        timeout: 8000
      });
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
   * Hace push del estado completo a la nube para sincronizar instantáneamente con otros dispositivos.
   *
   * @param {Object} localState - { designaciones, customArbitros, disponibilidades, pagosState }
   */
  pushCloudData: async (localState) => {
    if (pushInProgress) {
      console.log('[CloudSync] Push omitido (ya hay uno en curso)');
      return null;
    }

    pushInProgress = true;
    try {
      const designaciones = Array.isArray(localState?.designaciones) ? localState.designaciones : [];
      const customArbitros = Array.isArray(localState?.customArbitros) ? localState.customArbitros : [];
      const customMunicipios = Array.isArray(localState?.customMunicipios) ? localState.customMunicipios : [];
      const disponibilidades = localState?.disponibilidades || {};
      const pagosState = localState?.pagosState || {};

      const payload = {
        name: 'COARC_GLOBAL_DATABASE_2026',
        data: {
          designaciones,
          customArbitros,
          customMunicipios,
          disponibilidades,
          pagosState
        },
        updatedAt: new Date().toISOString()
      };

      // Subir a la nube mediante PUT atómico
      await axios.put(CLOUD_ENDPOINT, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log(`[CloudSync] ✅ Push exitoso: ${designaciones.length} partidos sincronizados a la nube`);
      return payload.data;

    } catch (error) {
      console.warn('[CloudSync] pushCloudData falló:', error?.message);
      return null;
    } finally {
      pushInProgress = false;
    }
  }
};
