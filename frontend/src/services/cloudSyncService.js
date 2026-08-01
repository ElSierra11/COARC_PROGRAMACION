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
   * Fusiona de forma inteligente los datos locales con la nube y los guarda.
   * Evita sobrescribir o perder partidos creados en otros dispositivos.
   */
  pushCloudData: async (localState) => {
    try {
      // 1. Obtener estado actual en la nube antes de guardar
      const remoteData = await cloudSyncService.fetchCloudData();

      // 2. Fusionar partidos (designaciones) por ID
      const mergedMap = new Map();

      if (remoteData && Array.isArray(remoteData.designaciones)) {
        remoteData.designaciones.forEach(d => {
          if (d && d.id) mergedMap.set(d.id, d);
        });
      }

      if (localState && Array.isArray(localState.designaciones)) {
        localState.designaciones.forEach(d => {
          if (d && d.id) {
            // El estado local sobreescribe/agrega sus propias versiones de partidos
            mergedMap.set(d.id, d);
          }
        });
      }

      const mergedDesignaciones = Array.from(mergedMap.values());

      // 3. Fusionar Árbitros Personalizados (Unión de nombres únicos)
      const remoteArbitros = remoteData && Array.isArray(remoteData.customArbitros) ? remoteData.customArbitros : [];
      const localArbitros = localState && Array.isArray(localState.customArbitros) ? localState.customArbitros : [];
      const mergedArbitros = Array.from(new Set([...remoteArbitros, ...localArbitros])).filter(Boolean);

      // 4. Fusionar Municipios Personalizados (Unión de nombres únicos)
      const remoteMunicipios = remoteData && Array.isArray(remoteData.customMunicipios) ? remoteData.customMunicipios : [];
      const localMunicipios = localState && Array.isArray(localState.customMunicipios) ? localState.customMunicipios : [];
      const mergedMunicipios = Array.from(new Set([...remoteMunicipios, ...localMunicipios])).filter(Boolean);

      // 5. Fusionar Disponibilidades y Estados de Pagos
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

      const payload = {
        name: 'COARC_GLOBAL_DATABASE_2026_V1',
        data: mergedPayload
      };

      await axios.put(CLOUD_ENDPOINT, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 8000
      });

      return mergedPayload;
    } catch (error) {
      console.warn("Cloud sync push falló:", error?.message || error);
      return null;
    }
  }
};
