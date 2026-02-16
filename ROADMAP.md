# 🚀 Orchard Services — Roadmap de Mejoras

> **Proyecto:** Orchard Services - Machinery Management Platform  
> **Inicio:** Febrero 2026  
> **Última actualización:** 17/02/2026  
> **Estado general:** 🟠 Fase 1 en progreso

---

## 📋 Índice

1. [Fase 0 — Fixes Críticos de Seguridad](#fase-0--fixes-críticos-de-seguridad)
2. [Fase 1 — Completar Features Existentes](#fase-1--completar-features-existentes)
3. [Fase 2 — Features Nuevas de Alto Impacto](#fase-2--features-nuevas-de-alto-impacto)
4. [Fase 3 — Features Diferenciadores](#fase-3--features-diferenciadores)
5. [Fase 4 — Escala y Crecimiento](#fase-4--escala-y-crecimiento)
6. [Deuda Técnica](#deuda-técnica)

---

## Fase 0 — Fixes Críticos de Seguridad
> **Prioridad:** 🔴 URGENTE | **Estimación:** 1-2 días  
> **Objetivo:** Asegurar la aplicación antes de agregar features nuevas

### CRIT-01: Rotar credenciales de MongoDB
- [ ] Cambiar password en MongoDB Atlas (hacer manualmente)
- [x] Eliminar credenciales hardcodeadas de `mongodb-smart.js`
- [x] Verificar que SOLO se use `process.env.MONGODB_URI`
- [x] Verificar `.env` está en `.gitignore`
- [x] Eliminar credenciales hardcodeadas de todos los scripts (19 archivos limpiados)
- **Archivos:** `app/lib/mongodb-smart.js`, `.env`, `.gitignore`, `scripts/*`

### CRIT-02: Asegurar endpoint público de Machines API
> **Nota:** El acceso público es INTENCIONAL. Cualquiera puede escanear el QR de una máquina
> y ver su información (marca, modelo, aceites, filtros, historial de servicios).
> El problema no es que sea público, sino que NO filtra qué campos devuelve.

- [x] Crear endpoint dedicado `/api/public/machines/[id]` que devuelva SOLO campos públicos:
  - ✅ Públicos: marca, modelo, serie, año, aceites, filtros, neumáticos, historial de servicios
  - ❌ Privados: userId, organizationId, workplace, datos internos
- [x] Mover la lógica pública fuera de `/api/machines` principal
- [ ] Agregar rate limiting al endpoint público (evitar scraping masivo)
- [ ] Testear que QR scanner siga funcionando correctamente
- **Archivos:** `app/api/machines/route.js`, `app/api/public/machines/[id]/route.js` (nuevo)

### CRIT-03: Fix DELETE de máquinas
- [x] Agregar verificación de autenticación con `getServerSession`
- [x] Corregir variable undefined (usar nombre correcto de variable)
- [x] Agregar verificación de ownership (usuario solo borra sus máquinas)
- [x] Renombrar archivo a convención App Router si es necesario
> **Nota:** El `[id]/route.js` (App Router) ya tenía auth+ownership correctos.
> Se eliminó el archivo legacy `[id].js` (Pages Router) que tenía los bugs.
- **Archivos:** `app/api/machines/[id]/route.js`

### CRIT-04: Unificar authOptions
- [x] Definir un solo `authOptions` canónico en `app/lib/auth.js`
- [x] Re-exportar desde `app/api/auth/[...nextauth]/route.js`
- [x] Actualizar TODOS los imports en API routes para usar la misma fuente
> **Nota:** Se movió la implementación completa a `app/lib/auth.js` (con suspension check,
> company lookup, remember me, campos unificados). La route re-exporta `authOptions`
> para que los 60+ imports existentes sigan funcionando sin cambios.
- [x] Verificar que la sesión tenga campos consistentes en toda la app
- **Archivos:** `app/lib/auth.js`, `app/api/auth/[...nextauth]/route.js`

### CRIT-05: Tokens criptográficamente seguros
- [x] Reemplazar `Math.random()` por `crypto.randomBytes()` en `generateResetToken`
- [x] Reemplazar `Math.random()` por `crypto.randomInt()` en `generateTemporaryPassword`
- [x] Implementar Fisher-Yates shuffle para password
- [x] Reemplazar `Math.random()` por `crypto.randomBytes()` en `generateVerificationCode`
- **Archivos:** `app/lib/emailUtils.js`

### CRIT-06: Eliminar logs sensibles
- [x] Buscar todos los `console.log` que contengan passwords, tokens, emails
- [x] Eliminar o reemplazar con logger con niveles (info/warn/error)
- [x] Verificar que en producción no se logueen datos sensibles
> **Nota:** Eliminados de `emailUtils.js` (contraseñas temporales, reset URLs, emails).
> Eliminados de `auth.js` (emails de usuarios, detalles de sesión, estado de suspensión).
- **Archivos:** `app/lib/emailUtils.js`, `app/lib/auth.js`, `app/api/auth/[...nextauth]/route.js`

---

## Fase 1 — Completar Features Existentes
> **Prioridad:** 🟠 Alta | **Estimación:** 2-3 semanas  
> **Objetivo:** Terminar lo que ya está empezado y consolidar código duplicado

### FEAT-01: Pre-Start Dinámico con Templates
> **Estado:** ✅ Completado | **Esfuerzo:** Bajo-Medio  
> Ya existen templates y el sistema de asignación. Falta conectarlos al form.
> **Implementado:** Modelo `PrestartTemplate.js` con campo `critical`, modelo `PreStart.js` actualizado
> con `checkValues`, `templateId`, `hasCriticalFailure`. `PreStartCheckForm.js` detecta items críticos
> (fondo rojo, badge CRITICAL, bloquea estado OK). `PreStartTemplateModal.js` permite marcar items como críticos.

- [x] Modificar `PreStartCheckForm.js` para cargar template asignado a la máquina
- [x] Si la máquina no tiene template, usar checklist default
- [x] Renderizar check items dinámicamente desde el template
- [x] Respetar campo `required` de cada item del template
- [x] Items marcados como "críticos" → falla = máquina no puede operar
- [x] Guardar en el PreStart record qué template se usó
- [ ] Testear con máquinas que tienen y no tienen template
- **Archivos:** `app/components/PreStartCheckForm.js`, `app/api/prestart/route.js`, `app/models/PreStart.js`

### FEAT-01b: Perfil Público de Máquina con Historial de Servicios
> **Estado:** ✅ Completado | **Esfuerzo:** Bajo-Medio  
> Cuando alguien escanea el QR de una máquina, ve una página pública con toda la info
> relevante + el historial completo de servicios realizados.
> **Implementado:** Página `/public-machine/[id]` con todas las secciones. APIs públicas
> para servicios, prestart y invoices. QR actualizado en 5 componentes.

#### Vista pública de máquina
- [x] Crear página `/public/machine/[id]` (sin auth requerido)
- [x] Mostrar datos generales: marca, modelo, número de serie, año, ID de máquina
- [x] Mostrar horas actuales / kilómetros
- [x] Mostrar info de aceites: motor, hidráulico, transmisión (tipo, capacidad, marca)
- [x] Mostrar info de filtros: motor, transmisión, combustible, aire, carbón
- [x] Mostrar info de neumáticos: delanteros y traseros (medida, presión, marca)
- [x] Diseño limpio tipo "ficha técnica" con branding de Orchard Services
- [x] Responsive / mobile-first (se escanea desde el celular)

#### Historial de servicios público
- [x] Sección "Historial de Servicios" debajo de los datos de la máquina
- [x] Lista cronológica (más reciente primero) de todos los servicios
- [x] Por cada servicio mostrar: fecha, tipo (Preventivo/Correctivo/Emergencia), trabajo realizado, horas/km al momento del servicio, técnico
- [x] NO mostrar: costos, notas internas, userId
- [x] Paginación o "cargar más" si hay muchos servicios
- [x] Indicador visual del estado de mantenimiento (al día ✅ / próximo ⚠️ / atrasado 🔴)

#### Último Pre-Start público
- [x] Mostrar resumen del último pre-start: fecha, estado general (OK / Requiere atención)
- [x] NO mostrar detalles internos ni observaciones privadas

#### API pública
- [x] Endpoint `GET /api/public/machines/[id]` — datos de máquina (campos filtrados)
- [x] Endpoint `GET /api/public/machines/[id]/services` — historial de servicios (campos filtrados)
- [x] Endpoint `GET /api/public/machines/[id]/last-prestart` — último pre-start resumido
- [ ] Rate limiting en todos los endpoints públicos
- [x] No exponer IDs internos de MongoDB en la respuesta

#### QR actualizado
- [x] Actualizar QR para que apunte a `/public/machine/[id]`
- [x] La página pública tiene botones para "Hacer Pre-Start" y "Registrar Servicio" (van al form público existente)

- **Archivos:** `app/public/machine/[id]/page.js` (nuevo), `app/api/public/machines/[id]/route.js` (nuevo), `app/api/public/machines/[id]/services/route.js` (nuevo), `app/components/QRCodeGenerator.js`

---

### FEAT-02: Módulo de Operadores Completo
> **Estado:** ⬜ No iniciado | **Esfuerzo:** Medio  
> Los modelos existen vacíos. Hay que implementar todo.

#### 2a. Modelo y API de Operadores
- [ ] Completar modelo `Operator.js` (licencias, certificaciones, fechas vencimiento)
- [ ] Completar modelo `OperatorCompetency.js` (qué máquinas puede operar)
- [ ] Crear API CRUD `/api/operators` (GET, POST, PUT, DELETE)
- [ ] Validación de datos con `validation.js`
- [ ] Filtros por organización, workplace, estado

#### 2b. UI de Operadores
- [ ] Reemplazar placeholder "Coming Soon" en `TabOperator.js`
- [ ] Lista de operadores con búsqueda y filtros
- [ ] Modal de crear/editar operador
- [ ] Vista de detalle con historial
- [ ] Indicadores visuales de licencias por vencer (verde/amarillo/rojo)

#### 2c. Competency Matrix
- [ ] Completar modelo `OperatorCompetency.js`
- [ ] UI tipo matriz: operadores × máquinas
- [ ] Marcar competencias (habilitado/en training/no habilitado)
- [ ] Validar en pre-start que el operador esté habilitado para esa máquina

#### 2d. Inducciones y SOPs
- [ ] Completar modelo `Induction.js` (fecha, tipo, instructor, resultado)
- [ ] Completar modelo `SOP.js` (título, contenido/PDF, versión, fecha)
- [ ] API CRUD para ambos
- [ ] UI para registrar inducciones completadas
- [ ] UI para subir y gestionar SOPs
- [ ] Confirmación de lectura de SOP por operador

#### 2e. Alertas de Operadores
- [ ] Alerta cuando una licencia está por vencer (30/14/7 días)
- [ ] Alerta cuando una certificación venció
- [ ] Integrar en el sistema de alertas existente (`alertService.js`)
- [ ] Email automático al admin

- **Archivos:** `app/models/Operator.js`, `app/models/OperatorCompetency.js`, `app/models/Induction.js`, `app/models/SOP.js`, `app/components/TabOperator.js`, `app/api/operators/`, `app/lib/alertService.js`

### FEAT-03: Audit Trail UI
> **Estado:** ⬜ No iniciado | **Esfuerzo:** Bajo  
> Ya existe `/api/audit`. Solo falta la UI.

- [ ] Crear componente `TabAuditLog.js`
- [ ] Agregar tab "Audit Log" en el panel de admin
- [ ] Lista de eventos con: usuario, acción, fecha, detalles
- [ ] Filtros por usuario, tipo de acción, rango de fecha
- [ ] Paginación
- [ ] Solo visible para ADMIN y SUPER_ADMIN
- **Archivos:** `app/components/TabAuditLog.js`, `app/components/Sidebar.js`

---

## Fase 2 — Features Nuevas de Alto Impacto
> **Prioridad:** 🟡 Media-Alta | **Estimación:** 4-6 semanas  
> **Objetivo:** Features que transforman la app y agregan valor real

### FEAT-04: PWA + Modo Offline
> **Estado:** ⬜ No iniciado | **Esfuerzo:** Medio

- [ ] Instalar y configurar `next-pwa`
- [ ] Crear `manifest.json` con iconos, colores, nombre
- [ ] Implementar Service Worker para cache de assets
- [ ] Cache de datos críticos (lista de máquinas, templates)
- [ ] Cola offline para pre-starts: guardar en IndexedDB → sincronizar al volver online
- [ ] Cola offline para servicios: mismo patrón
- [ ] Indicador visual de estado online/offline
- [ ] Banner de sincronización pendiente ("3 pre-starts pendientes de sincronizar")
- [ ] Push notifications (solicitar permiso, enviar desde servidor)
- [ ] Testear en móvil: Android Chrome, iOS Safari
- **Archivos:** `next.config.js`, `public/manifest.json`, `app/lib/offlineSync.js` (nuevo), `app/components/OfflineIndicator.js` (nuevo)

### FEAT-05: Fotos y Evidencia
> **Estado:** ⬜ No iniciado | **Esfuerzo:** Medio

- [ ] Configurar storage (Cloudinary o AWS S3)
- [ ] Crear endpoint `/api/upload` con validación de tipo/tamaño
- [ ] Componente `ImageUpload.js` reutilizable (drag & drop + cámara móvil)
- [ ] Integrar en `PreStartCheckForm`: foto opcional por cada item que falla
- [ ] Integrar en `ServiceForm`: fotos de antes/después
- [ ] Integrar en perfil de máquina: galería de fotos
- [ ] Compresión de imagen en cliente antes de subir (reducir datos móviles)
- [ ] Thumbnails en listas, full-size en modal
- [ ] Incluir fotos en reportes PDF
- **Archivos:** `app/api/upload/route.js` (nuevo), `app/components/ImageUpload.js` (nuevo), `PreStartCheckForm.js`, `ServiceForm.js`

### FEAT-06: Dashboard Analytics Avanzado
> **Estado:** ⬜ No iniciado | **Esfuerzo:** Medio

- [ ] **Costo total de mantenimiento** por período (gráfico de barras mensual)
- [ ] **Disponibilidad de flota**: % de máquinas operativas vs en reparación
- [ ] **Top 5 máquinas más costosas** de mantener (gráfico)
- [ ] **Consumo de diesel por máquina** (litros/hora) con tendencias
- [ ] **Horas trabajadas por máquina** comparativo
- [ ] **Tasa de falla en pre-starts** por máquina (qué máquina falla más)
- [ ] **KPIs de operadores** (pre-starts completados, fallas reportadas)
- [ ] Selector de período (semana/mes/trimestre/año)
- [ ] Exportar dashboard a PDF para gerencia
- [ ] Widget cards configurables (drag & drop opcional)
- **Archivos:** `app/components/Dashboard.js`, `app/components/dashboard/` (nuevos widgets), `app/api/dashboard/analytics/route.js` (nuevo)

### FEAT-07: Mantenimiento Preventivo Inteligente
> **Estado:** ⬜ No iniciado | **Esfuerzo:** Alto

- [ ] Crear modelo `MaintenancePlan.js` (por tipo de máquina)
- [ ] Definir intervalos: cada X horas → qué servicio corresponde
- [ ] Vista calendario mensual/semanal con servicios programados
- [ ] Predicción de próximo servicio basada en promedio de horas/día
- [ ] Costo acumulado por máquina con gráfico de tendencia
- [ ] Umbral de "reemplazar vs reparar" configurable por admin
- [ ] Generar órdenes de trabajo automáticas
- [ ] Integrar con alertas existentes
- **Archivos:** `app/models/MaintenancePlan.js` (nuevo), `app/components/MaintenanceCalendar.js` (nuevo), `app/api/maintenance-plans/` (nuevo)

### FEAT-07b: Sistema de Invoices por Máquina (con OCR/AI)
> **Estado:** 🟡 Foundation completada | **Esfuerzo:** Alto  
> Cada máquina tiene un registro de invoices/facturas de todo lo que se le compró
> o hizo. El sistema usa AI/OCR para leer las facturas escaneadas y extraer
> automáticamente los costos, vinculándolos a la máquina correspondiente.
> **Implementado:** Modelo Invoice.js, CRUD API completo, API de resumen con aggregation,
> API pública de invoices por máquina, TabInvoices con filtros/paginación/review modal,
> integrado en NavBar y MachinesRegistry, resumen en perfil público de máquina.
> **Pendiente:** OCR/AI scan, recepción por email, reportes avanzados de costos.

#### Modelo y API de Invoices
- [x] Crear modelo `Invoice.js`:
  - `invoiceId` — ID único autogenerado (ej: INV-2026-0001)
  - `machineId` — referencia a la máquina (configurable al cargar)
  - `date` — fecha de la factura
  - `vendor` — proveedor/taller
  - `description` — descripción del trabajo o compra
  - `category` — tipo: Repuesto, Servicio, Aceite, Filtro, Neumático, Otro
  - `items[]` — lista de items: { nombre, cantidad, precioUnitario, total }
  - `subtotal`, `tax`, `totalAmount` — montos
  - `currency` — moneda (NZD, AUD, USD)
  - `imageUrl` — foto/scan de la factura original
  - `ocrData` — datos extraídos por AI (raw)
  - `ocrConfidence` — nivel de confianza del OCR (%)
  - `status` — Pending Review, Confirmed, Rejected
  - `confirmedBy` — usuario que confirmó los datos
  - `organizationId`, `createdBy`, `timestamps`
- [x] API CRUD `/api/invoices` (GET, POST, PUT, DELETE)
- [x] `GET /api/invoices?machineId=XXX` — todas las facturas de una máquina
- [x] `GET /api/machines/[id]/invoices` — historial de facturas por máquina
- [x] `GET /api/invoices/summary?machineId=XXX` — resumen de costos totales
- [ ] Validación de datos con `validation.js`
- [x] Solo ADMIN y SUPER_ADMIN pueden confirmar/rechazar invoices

#### OCR / AI para lectura automática de facturas
- [ ] Integrar servicio de OCR (opciones):
  - **Google Cloud Vision API** (alta precisión)
  - **Tesseract.js** (gratuito, local)
  - **OpenAI Vision API** (GPT-4o para extraer datos estructurados)
- [ ] Endpoint `/api/invoices/scan` — recibe imagen, devuelve datos extraídos
- [ ] Extraer automáticamente: vendor, fecha, items, cantidades, precios, total
- [ ] El usuario sube la foto → AI extrae datos → se muestran para revisión
- [ ] El usuario confirma/corrige los datos extraídos → se guarda el invoice
- [ ] Entrenar/configurar prompts para reconocer formatos comunes de facturas de:
  - Talleres mecánicos
  - Proveedores de repuestos
  - Estaciones de servicio
  - Tiendas de aceites/filtros
- [ ] Guardar `ocrConfidence` para tracking de precisión
- [ ] Fallback manual: si el OCR falla, el usuario carga los datos a mano

#### Recepción de Invoices por Email
> Las facturas también se pueden recibir por email. El sistema monitorea
> un buzón dedicado y procesa automáticamente los adjuntos.

- [ ] Configurar email dedicado para recepción (ej: `invoices@orchardservices.com`)
- [ ] Implementar polling/webhook del buzón de email:
  - **Opción A:** SendGrid Inbound Parse (recibe emails como webhook POST)
  - **Opción B:** IMAP polling cada X minutos con `imapflow`
  - **Opción C:** Microsoft Graph API / Gmail API si usan Outlook/Gmail
- [ ] Endpoint `/api/invoices/inbound-email` — recibe el email parseado
- [ ] Extraer adjuntos del email (PDF, JPG, PNG)
- [ ] Pasar cada adjunto por el pipeline de OCR/AI (mismo que el manual)
- [ ] Detectar machineId en el asunto o cuerpo del email:
  - Formato esperado: asunto contiene el machineId (ej: "Factura - MAC-001")
  - Si no se detecta machineId → invoice queda en estado `Unassigned` para asignar manual
- [ ] Crear invoice con estado `Pending Review` (nunca se confirma automáticamente)
- [ ] Notificar al admin que llegó un invoice nuevo por email
- [ ] Guardar metadata del email: remitente, asunto, fecha de recepción
- [ ] Dashboard de invoices recibidos por email con estado de procesamiento
- [ ] Reglas anti-spam: whitelist de remitentes autorizados (configurable por org)
- [ ] Manejo de errores: si el adjunto no es legible, notificar al admin con el email original
- **Archivos:** `app/api/invoices/inbound-email/route.js` (nuevo), `app/lib/emailInvoiceProcessor.js` (nuevo)

#### UI de Invoices
- [x] Nuevo tab "Invoices" o "Costos" en el Sidebar
- [x] Vista principal: lista de invoices con filtros (por máquina, fecha, categoría, estado)
- [ ] Botón "Subir Factura" → abre cámara o file picker
- [ ] Pantalla de revisión post-OCR:
  - Imagen de la factura a la izquierda
  - Datos extraídos a la derecha (editables)
  - Selector de máquina destino (machineId)
  - Botón "Confirmar" / "Corregir" / "Rechazar"
- [x] Vista de detalle de invoice: imagen + datos + quién lo confirmó
- [ ] En la ficha de cada máquina: sección "Costos / Invoices" con:
  - Lista de todas las facturas vinculadas
  - Total acumulado de costos
  - Gráfico de costos por mes
  - Costos por categoría (pie chart)
- [ ] Badge en la máquina mostrando costo total acumulado

#### Reportes de costos
- [ ] Reporte de costos por máquina (período configurable)
- [ ] Reporte de costos por categoría (qué se gasta más: repuestos vs servicios)
- [ ] Top 5 máquinas más costosas
- [ ] Costo promedio por hora de operación (costo total ÷ horas trabajadas)
- [ ] Comparativa de costos entre máquinas similares
- [ ] Alerta: cuando el costo acumulado supera un umbral configurable por admin
- [ ] Integrar datos de invoices en Dashboard Analytics (FEAT-06)

#### Invoice público (vista QR)
- [x] En el perfil público de la máquina (FEAT-01b), mostrar resumen de costos:
  - Cantidad total de servicios facturados
  - Último servicio facturado (fecha + descripción)
  - NO mostrar montos ni datos del proveedor (privado)

- **Archivos:** `app/models/Invoice.js` (nuevo), `app/api/invoices/` (nuevo), `app/api/invoices/scan/route.js` (nuevo), `app/api/invoices/inbound-email/route.js` (nuevo), `app/components/TabInvoices.js` (nuevo), `app/components/InvoiceScanner.js` (nuevo), `app/components/InvoiceReview.js` (nuevo), `app/lib/ocrService.js` (nuevo), `app/lib/emailInvoiceProcessor.js` (nuevo)

---

### FEAT-08: Reportes PDF Profesionales
> **Estado:** ⬜ No iniciado | **Esfuerzo:** Medio

- [ ] Instalar `@react-pdf/renderer` o configurar `puppeteer`
- [ ] Template PDF con branding (logo de organización, colores)
- [ ] Reporte de Pre-Start en PDF (para mostrar a inspectores)
- [ ] Reporte de Servicios mensual en PDF
- [ ] Reporte de flota completo en PDF
- [ ] Certificado de pre-start individual (firmable digitalmente)
- [ ] Email automático: reporte mensual al admin el 1ro de cada mes
- [ ] Botón "Descargar PDF" en cada sección de reportes
- **Archivos:** `app/lib/pdfGenerator.js` (nuevo), `app/api/reports/pdf/route.js` (nuevo), `app/components/reports/PDFPreview.js` (nuevo)

---

## Fase 3 — Features Diferenciadores
> **Prioridad:** 🔵 Media | **Estimación:** 4-6 semanas  
> **Objetivo:** Features que diferencian la app de la competencia

### FEAT-09: Billing con Stripe
> **Estado:** ⬜ No iniciado | **Esfuerzo:** Alto

- [ ] Integrar Stripe Checkout / Stripe Billing
- [ ] Definir planes con features específicas:
  - **Basic** ($29/mes): hasta 10 máquinas, 5 usuarios, reportes básicos
  - **Professional** ($79/mes): hasta 50 máquinas, 20 usuarios, analytics, PDF
  - **Enterprise** ($199/mes): ilimitado, API access, soporte prioritario
- [ ] Trial gratuito de 14 días
- [ ] Feature gating real: verificar plan antes de cada acción limitada
- [ ] Portal de billing para admin (facturas, cambiar plan, cancelar)
- [ ] Webhooks de Stripe para manejar pagos/fallas/cancelaciones
- [ ] Página de pricing pública
- [ ] Emails de trial por vencer, pago fallido, etc.
- **Archivos:** `app/api/billing/` (nuevo), `app/components/BillingDashboard.js` (nuevo), `app/lib/stripe.js` (nuevo), `app/models/Plan.js`

### FEAT-10: Inventario de Repuestos
> **Estado:** ⬜ No iniciado | **Esfuerzo:** Alto

- [ ] Crear modelo `Part.js` (nombre, código, categoría, stock actual, stock mínimo, proveedor, costo)
- [ ] API CRUD `/api/parts`
- [ ] UI de inventario con búsqueda, filtros por categoría
- [ ] Vincular repuestos usados en cada servicio → descuento automático del stock
- [ ] Alertas de stock bajo (cuando stock < mínimo)
- [ ] Historial de movimientos (entrada/salida)
- [ ] Reporte de consumo de repuestos por período
- [ ] Orden de compra sugerida automática
- **Archivos:** `app/models/Part.js` (nuevo), `app/api/parts/` (nuevo), `app/components/TabInventory.js` (nuevo)

### FEAT-11: Multi-idioma (i18n)
> **Estado:** ⬜ No iniciado | **Esfuerzo:** Medio

- [ ] Instalar y configurar `next-intl`
- [ ] Extraer TODOS los strings hardcodeados a archivos de traducción
- [ ] Archivo `en.json` (inglés - default)
- [ ] Archivo `es.json` (español)
- [ ] Selector de idioma en perfil de usuario
- [ ] Guardar preferencia de idioma en BD
- [ ] Traducir emails también
- [ ] Fechas y números según locale
- **Archivos:** `messages/en.json` (nuevo), `messages/es.json` (nuevo), `app/lib/i18n.js` (nuevo), todos los componentes

### FEAT-12: Portal de Cliente (Read-Only)
> **Estado:** ⬜ No iniciado | **Esfuerzo:** Bajo-Medio

- [ ] Crear rol `CLIENT` en el sistema de roles
- [ ] Dashboard de solo lectura: estado de máquinas, servicios recientes
- [ ] Historial de pre-starts y servicios (sin editar)
- [ ] Acceso con link + código de acceso (sin cuenta completa)
- [ ] Branding personalizable por organización
- [ ] Reporte mensual automático por email al cliente
- **Archivos:** `app/client-portal/` (nuevo), `app/api/client-portal/` (nuevo)

### FEAT-13: Notificaciones en Tiempo Real + WhatsApp
> **Estado:** ⬜ No iniciado | **Esfuerzo:** Medio-Alto

- [ ] Implementar Server-Sent Events (SSE) o WebSocket para alertas instantáneas
- [ ] Push notifications del browser (Web Push API)
- [ ] Integración WhatsApp Business API para alertas críticas
- [ ] Configuración por usuario: qué notificaciones recibir y por qué canal
- [ ] Centro de notificaciones en la app (ya existe base en `NotificationBell.jsx`)
- **Archivos:** `app/api/notifications/stream/route.js` (nuevo), `app/lib/whatsapp.js` (nuevo), `app/lib/pushNotification.js` (nuevo)

---

## Fase 4 — Escala y Crecimiento
> **Prioridad:** ⬜ Futuro | **Estimación:** Según demanda  
> **Objetivo:** Features para escalar el negocio

### FEAT-14: GPS y Telemetría IoT
- [ ] Mapa en vivo con ubicación de máquinas (Google Maps / Mapbox)
- [ ] Geofencing: alertas si máquina sale del área
- [ ] Integración OBD-II para horas de motor automáticas
- [ ] Feature exclusiva del plan Enterprise

### FEAT-15: API Pública para Integraciones
- [ ] API REST documentada con Swagger/OpenAPI
- [ ] API Keys por organización
- [ ] Rate limiting por API key
- [ ] Webhooks configurables (eventos → URL del cliente)
- [ ] SDK básico en JavaScript

### FEAT-16: Multi-tenancy Avanzado
- [ ] Subdominio por organización (empresa.orchardservices.com)
- [ ] Branding personalizable (logo, colores, favicon)
- [ ] Configuración de campos custom por organización

---

## Deuda Técnica
> Tareas de refactoring para mantener el código saludable

### TECH-01: Consolidar módulos de BD
> **Completado:** Eliminados `mongodb-smart.js`, `db.js`, `utils/connectDB.js` (0 imports).
> `mongodb.js` es la única fuente de conexión. Eliminados endpoints inseguros
> `simple-admin` y `quick-admin` (passwords hardcodeados). Securizados `create-admin`
> y `fix-admin-role` con `ADMIN_SETUP_SECRET` env var.
- [x] Unificar `mongodb.js`, `mongodb-smart.js`, `db.js` en uno solo
- [x] Decidir: Mongoose vs MongoDB driver nativo (no ambos)
- [x] Implementar connection pooling adecuado para serverless

### TECH-02: Consolidar servicios de email
> **Completado:** Eliminado `email-service.js` (561 líneas, 0 imports, CommonJS muerto).
> `emailService.js` refactorizado para usar `sendEmail` de `@/lib/email` (SendGrid REST).
> Arquitectura actual: `email.js` (SendGrid REST) → `emailUtils.js` + `alertService.js` + `emailService.js`.
- [x] Unificar 5 archivos de email en 3 máximo
- [x] Un solo provider (SendGrid O Nodemailer, no ambos)
- [x] Convertir todo a ESM (eliminar `require()`)

### TECH-03: Consolidar sistema de permisos
- [ ] Un solo `roles.js` para constantes
- [ ] Un solo `permissions.js` para middleware
- [ ] Eliminar duplicados en `permissionsMiddleware.js`
- [ ] Actualizar imports en todas las rutas
- **Archivos:** `app/lib/roles.js`, `app/lib/permissions.js`, `app/middleware/permissionsMiddleware.js`

### TECH-04: Rate Limiter para serverless
- [ ] Reemplazar `Map` en memoria por Redis/Upstash
- [ ] Configurar Upstash Redis (tiene free tier)
- [ ] Actualizar `rateLimiter.js` y `security.js`
- **Archivos:** `app/lib/rateLimiter.js`, `app/lib/security.js`

### TECH-05: Validación en API routes
- [ ] Importar y usar `validation.js` en TODAS las API routes
- [ ] Implementar allowlist de campos en cada POST/PUT
- [ ] Sanitizar inputs contra NoSQL injection
- **Archivos:** `app/lib/validation.js`, todas las API routes

### TECH-06: Limpieza general de código
- [ ] Eliminar código muerto en `Layout.js`
- [ ] Eliminar `console.log` de debug en `page.js` y componentes
- [ ] Eliminar `DieselConfig_final.js`, `DieselConfig_new.js` (archivos duplicados)
- [ ] Eliminar `OrganizationManagement_clean.js` (duplicado)
- [ ] Eliminar `TabReports_NEW.js` (duplicado)
- [ ] Estandarizar idioma en código (todo inglés)
- [ ] Limpiar CSS duplicado en `globals.css`
- [ ] Simplificar `tailwind.config.mjs` (paths redundantes)

### TECH-07: Testing
- [ ] Agregar tests unitarios para funciones de `lib/`
- [ ] Agregar tests de API routes (al menos las críticas)
- [ ] Completar tests de Cypress para flujos principales
- [ ] CI/CD: correr tests en cada push

---

## 📊 Progreso General

| Fase | Items | Completados | Progreso |
|------|-------|-------------|----------|
| Fase 0 - Seguridad | 6 | 6 | ✅✅✅✅✅✅ 100% |
| Fase 1 - Completar | 3 | 0 | ⬜⬜⬜ 0% |
| Fase 2 - Alto Impacto | 5 | 0 | ⬜⬜⬜⬜⬜ 0% |
| Fase 3 - Diferenciadores | 5 | 0 | ⬜⬜⬜⬜⬜ 0% |
| Fase 4 - Escala | 3 | 0 | ⬜⬜⬜ 0% |
| Deuda Técnica | 7 | 0 | ⬜⬜⬜⬜⬜⬜⬜ 0% |

---

## 🗓️ Timeline Sugerido

```
Semana 1-2:     Fase 0 (Seguridad) + TECH-01/02/03 (consolidar código)
Semana 3-4:     FEAT-01 (Pre-Start dinámico) + FEAT-03 (Audit Trail)
Semana 5-7:     FEAT-02 (Operadores completo)
Semana 8-9:     FEAT-04 (PWA + Offline)
Semana 10-11:   FEAT-05 (Fotos) + FEAT-06 (Dashboard Analytics)
Semana 12-14:   FEAT-07 (Mantenimiento Preventivo) + FEAT-08 (PDF)
Semana 15-18:   FEAT-09 (Stripe) + FEAT-10 (Inventario)
Semana 19-20:   FEAT-11 (i18n) + FEAT-12 (Portal Cliente)
Semana 21+:     FEAT-13 (Real-time) + Fase 4
```

---

## 📝 Notas

- Actualizar este archivo después de cada sesión de trabajo
- Marcar checkboxes `[x]` a medida que se completa cada tarea
- Si surge un bug o cambio de prioridad, documentar acá
- Cada FEAT debe tener su branch: `feat/01-dynamic-prestart`, `feat/02-operators`, etc.

---

## ⚠️ Reglas de Implementación (MUY IMPORTANTE)

> Estas reglas se deben seguir SIEMPRE al ejecutar cualquier tarea del roadmap.
> El objetivo es que la app NUNCA se rompa durante el desarrollo.

### Antes de modificar cualquier archivo:
1. **Leer el archivo completo** y entender qué hace antes de tocar una línea
2. **Buscar TODOS los imports** del archivo en el resto del proyecto (`grep` / `list_code_usages`)
3. **Identificar dependencias**: qué otros archivos dependen de lo que voy a cambiar
4. **Verificar que los tests pasen** antes de empezar (si existen)

### Durante la implementación:
5. **Cambios incrementales**: hacer cambios chicos, verificar que funciona, seguir
6. **Nunca borrar código sin entender** para qué se usa — puede haber otra parte de la app que lo necesita
7. **Mantener backward compatibility**: si cambio una función, que la firma anterior siga funcionando
8. **No cambiar nombres de exports** sin actualizar TODOS los imports que lo usan
9. **No modificar modelos de BD** sin verificar que los datos existentes sigan siendo compatibles
10. **Agregar, no reemplazar**: preferir agregar funcionalidad nueva sin romper la existente

### Después de cada cambio:
11. **Verificar errores** en el archivo modificado y en los que lo importan
12. **Testear el flujo completo** que involucra el cambio (no solo el archivo)
13. **Build check**: verificar que `next build` no falle
14. **Actualizar el ROADMAP.md** marcando checkboxes completados
