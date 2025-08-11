# � Mi App Maquinaria - Sistema de Gestión de Maquinaria Agrícola

Sistema completo de gestión para maquinaria agrícola con funcionalidades de pre-arranque, seguimiento de servicios, gestión de operadores y administración multi-organizacional.

## �🚀 Características Principales

### ✨ Funcionalidades Core
- **Pre-arranque Digital**: Checklists digitales personalizables para cada máquina
- **Gestión de Máquinas**: Registro completo con códigos QR para identificación
- **Control de Operadores**: Gestión de operadores internos y externos
- **Servicios y Mantenimiento**: Tracking completo de servicios preventivos y correctivos
- **Sistema de Alertas**: Notificaciones automáticas para mantenimientos
- **Gestión de Diesel**: Control de tanques y recargas con códigos QR

### 🏢 Multi-Organización
- **Super Admin**: Control total del sistema
- **Admin de Organización**: Gestión completa de su organización
- **Usuarios**: Acceso controlado según permisos
- **Gestión de Límites**: Control de usuarios por organización

## 🏗️ Arquitectura - Monorepo

```
mi-app-maquinaria-2/
├── apps/
│   ├── frontend/          # Next.js frontend application
│   └── backend/           # API backend services
├── packages/
│   ├── shared/           # Shared utilities, types, constants
│   └── config/           # Configuration packages
├── docs/                 # Documentation
└── scripts/              # Build and deployment scripts
```

## 🛠️ Desarrollo

### Prerequisitos
- Node.js 18+
- pnpm 8+

### Instalación
```bash
pnpm install
```

### Comandos de Desarrollo

```bash
# Ejecutar todo en desarrollo
pnpm dev

# Ejecutar solo frontend
pnpm dev:frontend

# Ejecutar solo backend
pnpm dev:backend

# Build todo
pnpm build

# Build específico
pnpm build:frontend
pnpm build:backend

# Linting
pnpm lint

# Tests
pnpm test

# E2E tests
pnpm test:e2e
```

## 🚀 Deploy a Vercel

### Frontend Deploy
1. Ve a Vercel dashboard
2. Import el repositorio
3. Set root directory to `apps/frontend`
4. Deploy

### Backend Deploy (Si se separa)
1. Crear nuevo proyecto en Vercel
2. Set root directory to `apps/backend`
3. Configure como Serverless Functions

### Variables de Entorno Requeridas

```env
# Database
MONGODB_URI=mongodb+srv://...

# Authentication
NEXTAUTH_URL=https://tu-app.vercel.app
NEXTAUTH_SECRET=tu-secret-super-seguro

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=tu-sendgrid-api-key
FROM_EMAIL=noreply@tudominio.com
FROM_NAME=Sistema de Gestión

# Scheduler
ENABLE_SCHEDULER=true
```

## 📦 Packages

### `shared`
Utilidades, tipos y constantes compartidas entre frontend y backend.

### `config`
Configuraciones centralizadas para base de datos, email y autenticación.

## 🔧 Desarrollo Local

1. Clone el repositorio
2. `pnpm install`
3. Copia `.env.example` a `.env.local`
4. Configura variables de entorno
5. `pnpm dev`

## 📚 Documentación

- [Email Services Guide](./docs/email-services-guide.md)
- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
