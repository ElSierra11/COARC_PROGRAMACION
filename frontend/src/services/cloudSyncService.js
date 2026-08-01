import axios from 'axios';

// ID único del almacén global en la nube para COARC 2026
const CLOUD_OBJECT_ID = 'ff8081819f7e10ae019fbf2e9da95ed8';
const CLOUD_ENDPOINT = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;

export const cloudSyncService = {
  /**
   * Obtiene la base de datos global desde la nube.
   */
  fetchCloudData: async () => {
    try {
      const response = await axios.get(CLOUD_ENDPOINT, { timeout: 6000 });
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.warn("Cloud sync fetch falló, manteniendo caché local:", error?.message || error);
      return null;
    }
  },

  /**
   * Actualiza el objeto global en la nube con los datos locales más recientes.
   */
  pushCloudData: async (fullState) => {
    try {
      const payload = {
        name: 'COARC_GLOBAL_DATABASE_2026_V1',
        data: {
          designaciones: Array.isArray(fullState.designaciones) ? fullState.designaciones : [],
          customArbitros: Array.isArray(fullState.customArbitros) ? fullState.customArbitros : [],
          customMunicipios: Array.isArray(fullState.customMunicipios) ? fullState.customMunicipios : [],
          disponibilidades: fullState.disponibilidades || {},
          pagosState: fullState.pagosState || {},
          updatedAt: new Date().toISOString()
        }
      };

      await axios.put(CLOUD_ENDPOINT, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 8000
      });
      return true;
    } catch (error) {
      console.warn("Cloud sync push falló:", error?.message || error);
      return false;
    }
  }
};
