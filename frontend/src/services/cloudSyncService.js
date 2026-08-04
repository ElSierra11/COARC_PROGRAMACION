import axios from 'axios';

// Endpoint oficial en la nube para sincronización en tiempo real entre dispositivos (PC, Celular, etc.)
const CLOUD_ENDPOINT = 'https://jsonblob.com/api/jsonBlob/019fcaa2-7a8e-727c-afdc-3516914faaa6';

// Mutex simple: evita que dos push corran en paralelo
let pushInProgress = false;

// Timestamp del último push exitoso a la nube
let lastSuccessfulPushAt = 0;

// Timestamp del último pull exitoso de la nube
let lastCloudUpdatedAt = 0;

/**
 * Comprime un objeto de designación eliminando campos de UI temporales
 * para reducir el tamaño del payload antes de enviarlo a la nube.
 * Esto permite soportar 100+ partidos sin sobrepasar el límite de jsonblob.
 */
const compressDesignacion = (d) => ({
  id: d.id,
  hora: d.hora,
  cancha: d.cancha,
  torneo: d.torneo,
  categoria: d.categoria,
  categoria_torneo: d.categoria_torneo,
  partido: d.partido,
  municipio: d.municipio,
  es_cuadra: d.es_cuadra,
  arbitro_principal: d.arbitro_principal,
  asistente_1: d.asistente_1 || '',
  asistente_2: d.asistente_2 || '',
  emergente: d.emergente || '',
  estado: d.estado || 'PROGRAMADO',
  fecha: d.fecha,
  fecha_iso: d.fecha_iso,
  fecha_label: d.fecha_label,
  item: d.item,
  observaciones: d.observaciones || '',
  updatedAt: d.updatedAt
});

export const cloudSyncService = {

  /**
   * Obtiene los datos de la nube.
   * Solo acepta datos de la nube si son MÁS RECIENTES que los datos locales pendientes.
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

      const cloudData = response.data?.data;
      if (!cloudData) return null;

      const cloudUpdatedAt = response.data?.updatedAt
        ? new Date(response.data.updatedAt).getTime()
        : 0;

      // Si tenemos datos locales más recientes que no se han sincronizado a la nube, NO sobreescribir
      // Esto evita que el polling destruya una importación grande que aún no pudo subir a la nube
      const localPendingAt = parseInt(localStorage.getItem('coarc_local_pending_at') || '0', 10);
      if (localPendingAt > cloudUpdatedAt && localPendingAt > lastSuccessfulPushAt) {
        console.log('[CloudSync] Datos locales pendientes más recientes que la nube, omitiendo pull.');
        return null;
      }

      lastCloudUpdatedAt = cloudUpdatedAt;
      return cloudData;
    } catch (error) {
      console.warn('[CloudSync] fetch falló:', error?.message);
      return null;
    }
  },

  /**
   * Hace push del estado completo a la nube para sincronizar instantáneamente con otros dispositivos.
   * Comprime los datos para soportar 100+ partidos dentro del límite de jsonblob.com (~500KB).
   *
   * @param {Object} localState - { designaciones, customArbitros, disponibilidades, pagosState }
   */
  pushCloudData: async (localState) => {
    if (pushInProgress) {
      console.log('[CloudSync] Push omitido (ya hay uno en curso)');
      return null;
    }

    pushInProgress = true;

    // Marcar que hay datos locales pendientes de subir (timestamp actual)
    const pendingAt = Date.now();
    try { localStorage.setItem('coarc_local_pending_at', String(pendingAt)); } catch (e) {}

    // Notificar UI: sync pendiente
    try { window.dispatchEvent(new CustomEvent('coarc-sync', { detail: { status: 'pending' } })); } catch (e) {}

    try {
      const rawDesignaciones = Array.isArray(localState?.designaciones) ? localState.designaciones : [];
      const customArbitros = Array.isArray(localState?.customArbitros) ? localState.customArbitros : [];
      const customMunicipios = Array.isArray(localState?.customMunicipios) ? localState.customMunicipios : [];
      const disponibilidades = localState?.disponibilidades || {};
      const pagosState = localState?.pagosState || {};

      // Comprimir designaciones: eliminar campos de UI redundantes para reducir tamaño del payload
      const designaciones = rawDesignaciones.map(compressDesignacion);

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

      // Verificar tamaño estimado del payload antes de enviarlo
      const payloadStr = JSON.stringify(payload);
      const payloadSizeKB = payloadStr.length / 1024;
      console.log(`[CloudSync] Payload size: ${payloadSizeKB.toFixed(1)} KB (${designaciones.length} partidos)`);

      if (payloadSizeKB > 480) {
        // Payload demasiado grande incluso comprimido — solo guardar localmente
        console.warn(`[CloudSync] Payload demasiado grande (${payloadSizeKB.toFixed(1)} KB), guardando solo localmente`);
        // El dato ya está en localStorage, no se pierde
        return null;
      }

      // Subir a la nube mediante PUT atómico
      await axios.put(CLOUD_ENDPOINT, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      // Push exitoso: limpiar el marcador de pendiente
      lastSuccessfulPushAt = Date.now();
      try { localStorage.removeItem('coarc_local_pending_at'); } catch (e) {}

      // Notificar UI: sync exitoso
      try { window.dispatchEvent(new CustomEvent('coarc-sync', { detail: { status: 'success' } })); } catch (e) {}

      console.log(`[CloudSync] Push exitoso: ${designaciones.length} partidos sincronizados (${payloadSizeKB.toFixed(1)} KB)`);
      return payload.data;

    } catch (error) {
      console.warn('[CloudSync] pushCloudData falló:', error?.message);
      // Notificar UI: sync error
      try { window.dispatchEvent(new CustomEvent('coarc-sync', { detail: { status: 'error' } })); } catch (e) {}
      return null;
    } finally {
      pushInProgress = false;
    }
  }
};
