# Documento de Requerimientos Funcionales (RF)
## Sistema de Gestión y Designaciones Arbitrales — COARC

**Entidad:** Corporación Arbitral de Córdoba (COARC)  
**Versión:** 1.0.0  
**Estado:** Aprobado  
**Fecha:** 4 de Agosto de 2026  

---

## 1. Introducción y Alcance
El **Sistema de Designaciones Arbitrales COARC** es una plataforma web progresiva (PWA) diseñada para optimizar, centralizar y automatizar la gestión operativa, financiera y logística de partidos de fútbol y juzgamiento arbitral en el departamento de Córdoba.

---

## 2. Requerimientos Funcionales por Módulo

### Módulo 1: Gestión de Designaciones y Programación de Partidos

- **RF-1.1 Registrar Partido / Designación:** Permitir al Coordinador Arbitral programar partidos especificando: hora (formato 12 horas AM/PM), cancha/sede, municipio, torneo, encuentro/partido, categoría, modalidad (Árbitro Individual o Terna/Cuadra Completa) y tarifas de honorarios.
- **RF-1.2 Asignación de Árbitros:** Permitir la asignación de Árbitro Principal y, en caso de terna o cuadra, Asistente 1, Asistente 2 y Árbitro Emergente, con autocompletado dinámico basado en la base de datos de árbitros registrados.
- **RF-1.3 Control de Carga Laboral de Árbitros:** Calcular y mostrar en tiempo real la cantidad de partidos asignados a cada árbitro en la jornada mediante insignias de colores (baja carga, moderada, alta/alerta) para evitar sobrecargas físicas.
- **RF-1.4 Edición y Duplicación (Clonación) de Partidos:** Permitir editar cualquier parámetro de un partido existente o clonarlo con un solo clic para acelerar la creación de partidos consecutivos en la misma cancha.
- **RF-1.5 Eliminación Individual y Limpieza de Jornada:** Permitir eliminar un partido individual con diálogo de confirmación de seguridad, o borrar todos los partidos de una fecha activa mediante la función "Limpiar Jornada".
- **RF-1.6 Control de Estados del Partido:** Permitir transicionar el estado del partido en un clic a través del ciclo de vida: `PROGRAMADO` → `CONFIRMADO` → `EN JUEGO` → `FINALIZADO`.
- **RF-1.7 Filtrado y Búsqueda en Tiempo Real:** 
  - Búsqueda multi-criterio instantánea por nombre de árbitro, cancha, partido o torneo.
  - Filtros desplegables acotados al día activo por **Cancha**, **Torneo**, **Municipio** y **Estado**.

---

### Módulo 2: Importación y Carga Masiva (Excel / CSV)

- **RF-2.1 Importar Programaciones desde Excel:** Cargar archivos `.xlsx`, `.xls` o `.csv` con detección automática de encabezados (HORA, CANCHA, TORNEO, PARTIDO, CATEGORÍA, ÁRBITRO, ASISTENTES).
- **RF-2.2 Procesamiento de Ternas e Importación de Asistentes:** Extraer e importar correctamente Árbitro Principal, Asistente 1, Asistente 2 y Emergente sin pérdida de datos.
- **RF-2.3 Tolerancia a Formatos de Hora Financieros y Estructurados:** Normalizar automáticamente horas en formato texto (ej: `"8:00 a. m."`), seriales numéricos de Excel o fechas ISO.
- **RF-2.4 Filtrado de Filas Financieras / Resúmenes:** Ignorar automáticamente filas sintéticas o de resumen contable (RECAUDO, SALDO, PAGO, GESTION, TOTALES) presentes en planillas externas para evitar contaminar la lista de partidos.
- **RF-2.5 Soporte de Cargas de Gran Volumen (+100 Partidos):** Procesar e importar lotes masivos de más de 100 partidos simultáneamente sin congelar la interfaz ni saturar el almacenamiento.

---

### Módulo 3: Tesorería, Presupuesto y Honorarios Arbitrales

- **RF-3.1 Configuración de Tarifas:** Asignar tarifas individuales diferenciadas para Árbitro Principal y Asistentes por partido o categoría.
- **RF-3.2 Cálculo de Nómina por Jornada:** Calcular el total acumulado de honorarios a pagar por fecha activa, desglosando Total Jornada, Total Pagado y Total Pendiente.
- **RF-3.3 Gestión de Pagos a Árbitros:** Permitir marcar como pagado o pendiente el honorario de cada árbitro por partido o saldar la totalidad de los partidos de un árbitro con un clic.
- **RF-3.4 Presupuesto Corporativo (Ingresos y Egresos):** Registrar ingresos (recaudos de torneos) y egresos (pagos arbitrales, viáticos, logística) con balance en tiempo real y porcentaje de ejecución.

---

### Módulo 4: Exportación y Difusión Multi-Canal

- **RF-4.1 Generación de Imagen Oficial para WhatsApp:** Exportar la planilla oficial de designaciones COARC en formato de imagen HD (`.jpg`/`.png`) para difusión en grupos corporativos.
- **RF-4.2 Paginación Automática de Imagen (+8 Partidos):** Para jornadas extensas, dividir la exportación en múltiples páginas (ej: Pág 1/2, Pág 2/2) con máximo 8 partidos por imagen para preservar la legibilidad.
- **RF-4.3 Texto Estructurado para WhatsApp:** Copiar al portapapeles el resumen en texto con formato Markdown (negritas, listas) listo para pegar en WhatsApp.
- **RF-4.4 Exportación a Archivos de Office:** Exportar la jornada a planillas Excel (`.xlsx`), documentos Word (`.docx`) y presentaciones PowerPoint (`.pptx`).
- **RF-4.5 Impresión Oficial COARC:** Generar el formato impreso corporativo en tamaño Carta/A4 al presionar Ctrl+P o seleccionar "Imprimir", omitiendo elementos interactivos de la interfaz web.

---

### Módulo 5: Autenticación y Control de Acceso basado en Roles (RBAC)

- **RF-5.1 Autenticación de Usuarios:** Permitir el ingreso con usuario y contraseña mediante modal seguro.
- **RF-5.2 Rol Árbitro / Visitante (Lectura):** Consultar la programación del día, filtrar partidos, visualizar estadísticas y consultar su citación personal.
- **RF-5.3 Rol Coordinador Arbitral (Profe):** Programar, editar, clonar, eliminar partidos, gestionar disponibilidad e importar archivos Excel.
- **RF-5.4 Rol Super Administrador:** Acceso completo al sistema, creación/gestión de usuarios corporativos, respaldo y restauración total de la base de datos.
- **RF-5.5 Protección de Acciones Sensibles:** Solicitar autenticación con credenciales si un usuario anónimo intenta realizar modificaciones en la programación.

---

### Módulo 6: Persistencia Híbrida y Sincronización en la Nube

- **RF-6.1 Persistencia Local Instantánea (Offline First):** Guardar todo cambio de manera inmediata en `localStorage` del navegador para garantizar respuesta ultra-rápida y trabajo sin conexión a internet.
- **RF-6.2 Sincronización en Segundo Plano con la Nube:** Sincronizar automáticamente los datos con el servidor central (`jsonblob.com` / API backend) mediante trabajadores asíncronos.
- **RF-6.3 Indicador Visual de Sincronización:** Mostrar un badge interactivo en la barra superior (Navbar) con los estados: `Sincronizando...`, `Nube Sincronizada` y `Sin conexión`.
- **RF-6.4 Compresión de Datos y Retención Local (Dirty Flag):** Comprimir las cargas útiles y mantener una bandera local de datos pendientes (`coarc_local_pending_at`) para prevenir que lecturas automáticas desde la nube sobreescriban cambios locales no sincronizados.

---

### Módulo 7: Administración, Respaldo y Restauración

- **RF-7.1 Respaldo Total del Sistema (JSON):** Exportar en un archivo `.json` la totalidad de las designaciones, árbitros registrados y disponibilidades.
- **RF-7.2 Restauración Completa:** Cargar un archivo de copia de seguridad previa para restaurar el estado del sistema en caso de formateo o migración de dispositivo.
