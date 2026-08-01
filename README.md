# COARC - Sistema de Designaciones Arbitrales (PWA + Microservicios)

Sistema integral responsivo e instalable (PWA) para la **Corporación Arbitral de Córdoba (COARC)**, diseñado para automatizar la programación de partidos, controlar la carga de partidos por árbitro, detectar solapamientos de horarios y exportar la jornada para WhatsApp o impresión oficial.

---

## 🎨 Características Destacadas
- **Frontend PWA:** React + Vite + Tailwind CSS + Lucide Icons (Cero Emojis).
- **Temas:** Switch instantáneo entre **Modo Oscuro** y **Modo Claro (Blanco con Azul Suave)** inspirado en el escudo oficial de COARC.
- **Backend Microservicios:** 3 Servicios independientes en **Python (FastAPI)** con autenticación segura OAuth2 + JWT (Bcrypt).
- **PostgreSQL 15 & Nginx API Gateway:** Orquestación completa en **Docker Compose**.
- **Herramientas para "El Profe":**
  - Conteo automático de partidos asignados por árbitro (evita fatiga y desbalance).
  - Alerta de cruces o conflictos de horario/cancha.
  - Exportación con 1-clic formateada para WhatsApp.
  - Impresión de la planilla gráfica oficial idéntica al formato físico de COARC.

---

## 🚀 Cómo Ejecutar el Proyecto

### Opción 1: Con Docker Compose (Recomendado)
Levanta todos los microservicios, la base de datos PostgreSQL, el API Gateway y el Frontend con un solo comando:

```bash
docker compose up --build
```

#### Puertos y Acceso:
- **App Web PWA (Frontend):** `http://localhost:3000` (o `http://localhost:8080`)
- **API Gateway (Nginx):** `http://localhost:8080`
- **Documentación Swagger / OpenAPI (FastAPI):**
  - **Auth Service:** `http://localhost:8001/docs`
  - **Arbitros Service:** `http://localhost:8002/docs`
  - **Designaciones Service:** `http://localhost:8003/docs`

---

### Opción 2: Ejecución Manual en Desarrollo (Sin Docker)

#### 1. Frontend (React + Vite + Tailwind)
```bash
cd frontend
npm install
npm run dev
```

#### 2. Microservicios Backend (Python FastAPI)

##### Auth Service:
```bash
cd services/auth-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

##### Arbitros Service:
```bash
cd services/arbitros-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```

##### Designaciones Service:
```bash
cd services/designaciones-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8003
```

---

## 🔑 Credenciales Predeterminadas ("El Profe")
- **Usuario:** `admin`
- **Contraseña:** `coarc2026`
