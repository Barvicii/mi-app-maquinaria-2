# Sistema de Alertas - Maquinaria

## Resumen

El sistema de alertas automatizado para la aplicación de gestión de maquinaria detecta y notifica automáticamente cuando:
1. Un prestart check requiere revisión (checks fallidos)
2. Una máquina está cerca de su próximo servicio (10 horas antes)

## Arquitectura

### Componentes Principales

1. **Servicio de Alertas** (`src/lib/alertService.js`)
   - `createPrestartReviewAlert()` - Crea alertas para prestart checks que necesitan revisión
   - `createServiceReminderAlert()` - Crea alertas para servicios próximos
   - `checkServiceReminders()` - Verifica todas las máquinas por servicios próximos
   - `checkPrestartStatus()` - Evalúa si un prestart necesita revisión

2. **Servicio de Email** (`src/lib/emailService.js`)
   - `sendPrestartReviewAlert()` - Envía emails para prestart checks
   - `sendServiceReminderAlert()` - Envía emails para recordatorios de servicio

3. **Programador de Tareas** (`src/lib/scheduler.js`)
   - Ejecuta `checkServiceReminders()` cada hora
   - Ejecuta health checks diarios
   - Gestiona tareas programadas en background

4. **APIs**
   - `/api/prestart/route.js` - Integrado con verificación de alertas
   - `/api/admin/scheduler/route.js` - Control del programador
   - `/api/cron/service-reminders/route.js` - Endpoint para cron jobs externos

## Flujo de Funcionamiento

### 1. Alertas de Prestart Check

```mermaid
graph TD
    A[Usuario completa Prestart] --> B[API guarda en DB]
    B --> C[checkPrestartStatus()]
    C --> D{¿Checks fallidos?}
    D -->|Sí| E[createPrestartReviewAlert()]
    D -->|No| F[No se crea alerta]
    E --> G[Guardar en userAlerts]
    G --> H[Enviar email]
```

**Condiciones para crear alerta:**
- Estado = "Requiere atención" o "needs review"
- Cualquier check falló (checkValues[item] === false)
- Checks críticos fallaron: aceite, agua, frenos, nivelCombustible

### 2. Alertas de Servicio Próximo

```mermaid
graph TD
    A[Scheduler ejecuta cada hora] --> B[checkServiceReminders()]
    B --> C[Obtener máquinas con datos de servicio]
    C --> D{¿Servicio en ≤10 horas?}
    D -->|Sí| E[createServiceReminderAlert()]
    D -->|No| F[Continuar con siguiente máquina]
    E --> G[Verificar alerta duplicada]
    G --> H{¿Ya existe alerta?}
    H -->|No| I[Crear alerta + email]
    H -->|Sí| J[Omitir]
```

**Condiciones para crear alerta:**
- `hoursRemaining = nextService - currentHours`
- `hoursRemaining <= 10 && hoursRemaining > 0`
- No existe alerta similar en las últimas 24 horas

## Configuración

### Variables de Entorno

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-app
SMTP_FROM=alerts@tu-dominio.com

# Scheduler
ENABLE_SCHEDULER=true  # Habilita auto-inicio del scheduler
NODE_ENV=production    # Auto-inicia en producción

# Cron Security
CRON_SECRET_TOKEN=tu-token-secreto-para-cron
```

### Base de Datos

#### Colección `userAlerts`
```javascript
{
  _id: ObjectId,
  userId: String,           // ID del usuario destinatario
  type: String,            // "prestart_review" | "service_reminder"
  severity: String,        // "low" | "medium" | "high"
  title: String,           // Título de la alerta
  message: String,         // Mensaje descriptivo
  machineId: String,       // ID de la máquina
  machineName: String,     // Nombre/ID personalizado de la máquina
  prestartId: String,      // ID del prestart (solo para prestart_review)
  status: String,          // "active" | "resolved" | "dismissed"
  metadata: Object,        // Datos adicionales específicos del tipo
  createdAt: Date,
  read: Boolean           // Si el usuario ha leído la alerta
}
```

## Uso del Sistema

### 1. Inicio Manual del Scheduler

```javascript
// En el código
import scheduler from '@/lib/scheduler';
scheduler.init();
```

### 2. Control via API (Solo Admins)

```bash
# Obtener estado
GET /api/admin/scheduler

# Iniciar scheduler
POST /api/admin/scheduler
{
  "action": "start"
}

# Parar scheduler
POST /api/admin/scheduler
{
  "action": "stop"
}

# Ejecutar verificación manual
POST /api/admin/scheduler
{
  "action": "runServiceReminders"
}
```

### 3. Script PowerShell

```powershell
# Verificar estado
.\manage-alerts.ps1 -Action status

# Iniciar sistema
.\manage-alerts.ps1 -Action start

# Ejecutar todas las pruebas
.\manage-alerts.ps1 -Action test-all
```

### 4. Cron Job Externo

```bash
# Ejemplo para crontab (cada hora)
0 * * * * curl -X POST http://tu-dominio.com/api/cron/service-reminders \
  -H "Authorization: Bearer tu-token-secreto"
```

## Páginas de Administración

### 1. Panel de Scheduler (`/admin/scheduler`)
- Ver estado del programador
- Iniciar/parar tareas
- Ejecutar verificaciones manuales
- Ver tareas activas

### 2. Pruebas de Alertas (`/admin/test-alerts`)
- Probar creación de alertas de prestart
- Probar verificaciones de servicio
- Ver alertas existentes
- Verificar datos de máquinas

### 3. Visualización de Alertas (`/dashboard` - Tab Alertas)
- Ver alertas del usuario
- Marcar como leídas
- Filtrar por tipo
- Ver detalles

## Monitoreo y Troubleshooting

### Logs
- `[AlertService]` - Actividad del servicio de alertas
- `[Scheduler]` - Actividad del programador de tareas
- `[CRON]` - Actividad de endpoints cron
- `[API]` - Integración con APIs

### Verificaciones de Salud

1. **Estado del Scheduler**: `/api/admin/scheduler`
2. **Alertas en DB**: Verificar colección `userAlerts`
3. **Datos de Máquinas**: Verificar `currentHours` y `nextService`
4. **Configuración Email**: Probar envío manual

### Problemas Comunes

1. **No se crean alertas de prestart**
   - Verificar que `checkPrestartStatus()` se ejecute después de guardar
   - Revisar datos de máquina y usuario
   - Verificar condiciones de evaluación

2. **No se envían emails**
   - Verificar configuración SMTP
   - Revisar credenciales y permisos
   - Comprobar filtros de spam

3. **Scheduler no inicia automáticamente**
   - Verificar `NODE_ENV=production` o `ENABLE_SCHEDULER=true`
   - Revisar logs de inicialización
   - Usar control manual via API

4. **Alertas duplicadas**
   - Sistema incluye verificación de duplicados (24h)
   - Revisar lógica de deduplicación
   - Verificar timestamps

## Personalización

### Añadir Nuevos Tipos de Alerta

1. Crear función en `alertService.js`
2. Añadir template de email en `emailService.js`
3. Integrar verificación en API relevante
4. Actualizar scheduler si es periódico

### Modificar Criterios de Alerta

1. **Prestart**: Editar condiciones en `checkPrestartStatus()`
2. **Servicio**: Cambiar threshold en `checkServiceReminders()`
3. **Frecuencia**: Modificar intervalos en `scheduler.js`

### Personalizar Emails

1. Editar templates en `emailService.js`
2. Añadir variables dinámicas
3. Configurar branding y estilos

## Seguridad

- APIs protegidas con autenticación NextAuth
- Solo admins pueden controlar scheduler
- Endpoints cron protegidos con token secreto
- Validación de datos en todas las funciones
- Logs detallados para auditoría
