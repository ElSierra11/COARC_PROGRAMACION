import { toJpeg, toPng } from 'html-to-image';

/**
 * Exporta un elemento HTML como imagen JPG de alta resolución y descarga el archivo
 * @param {HTMLElement | string} elementOrId - Elemento DOM o ID del contenedor a capturar
 * @param {string} fileName - Nombre del archivo de salida (sin extensión)
 */
export const exportElementToJpg = async (elementOrId, fileName = 'Programacion_COARC') => {
  try {
    const node = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!node) {
      throw new Error(`Elemento no encontrado para exportar a imagen.`);
    }

    // Configuración de renderizado de alta calidad para WhatsApp
    const dataUrl = await toJpeg(node, {
      quality: 0.95,
      backgroundColor: '#ffffff',
      cacheBust: true,
      pixelRatio: 2 // Renderizado nítido 2x para pantallas de smartphone
    });

    const link = document.createElement('a');
    link.download = `${fileName}.jpg`;
    link.href = dataUrl;
    link.click();
    return true;
  } catch (error) {
    console.error('Error al exportar a imagen JPG:', error);
    throw error;
  }
};

/**
 * Copia la imagen renderizada directamente al portapapeles para pegar en WhatsApp Web
 * @param {HTMLElement | string} elementOrId - Elemento DOM o ID
 */
export const copyElementImageToClipboard = async (elementOrId) => {
  try {
    const node = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!node) {
      throw new Error(`Elemento no encontrado.`);
    }

    const dataUrl = await toPng(node, {
      backgroundColor: '#ffffff',
      pixelRatio: 2
    });

    // Convertir Data URL a Blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      return true;
    } else {
      throw new Error('El navegador no soporta copiar imágenes al portapapeles directamente.');
    }
  } catch (error) {
    console.error('Error al copiar imagen al portapapeles:', error);
    throw error;
  }
};
