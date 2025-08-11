# 📧 Guía de Servicios de Email para Notificaciones

## ¿Por qué necesitas un servicio de email profesional?

Para enviar notificaciones automáticas de manera confiable, necesitas un servicio de email profesional. Los proveedores de email gratuitos (como Gmail personal) tienen limitaciones que pueden afectar la entrega de tus alertas.

## 🏆 Servicios de Email Recomendados

### 1. **SendGrid** (Recomendado para empresas)
- **Costo**: Gratis hasta 100 emails/día, luego desde $15/mes
- **Características**: 
  - Alta tasa de entrega
  - APIs robustas
  - Análisis detallados
  - Soporte 24/7
- **Configuración**:
  ```
  SMTP Host: smtp.sendgrid.net
  SMTP Port: 587
  Security: STARTTLS
  Username: apikey
  Password: [Tu API Key de SendGrid]
  ```

### 2. **Mailgun** (Ideal para desarrolladores)
- **Costo**: Gratis hasta 5,000 emails/mes, luego desde $35/mes
- **Características**:
  - API muy potente
  - Validación de emails
  - Logs detallados
  - Webhooks
- **Configuración**:
  ```
  SMTP Host: smtp.mailgun.org
  SMTP Port: 587
  Security: STARTTLS
  Username: [Tu dominio Mailgun]
  Password: [Tu API Key]
  ```

### 3. **Amazon SES** (Económico y escalable)
- **Costo**: $0.10 por cada 1,000 emails
- **Características**:
  - Muy económico
  - Integración con AWS
  - Alta escalabilidad
  - Requiere verificación de dominio
- **Configuración**:
  ```
  SMTP Host: email-smtp.[región].amazonaws.com
  SMTP Port: 587
  Security: STARTTLS
  Username: [SMTP Username de AWS]
  Password: [SMTP Password de AWS]
  ```

### 4. **Outlook 365 Business** (Para oficinas)
- **Costo**: Desde $6/usuario/mes
- **Características**:
  - Integración con Office
  - Buzón completo
  - Soporte empresarial
- **Configuración**:
  ```
  SMTP Host: smtp.office365.com
  SMTP Port: 587
  Security: STARTTLS
  Username: [tu-email@tudominio.com]
  Password: [tu contraseña]
  ```

## 🛠️ Pasos para Configurar un Servicio de Email

### Opción A: SendGrid (Recomendado)

1. **Crear cuenta**:
   - Ve a https://sendgrid.com
   - Registra una cuenta gratuita
   - Verifica tu email

2. **Obtener API Key**:
   - En el dashboard, ve a "Settings" > "API Keys"
   - Clic en "Create API Key"
   - Elige "Restricted Access"
   - Dale permisos de "Mail Send"
   - Copia la API Key generada

3. **Configurar en tu sistema**:
   - Ve a Admin Panel > Settings > Email Server
   - Usa esta configuración:
     ```
     SMTP Host: smtp.sendgrid.net
     SMTP Port: 587
     Security: No (STARTTLS)
     Username: apikey
     Password: [Tu API Key]
     From Email: noreply@tudominio.com
     From Name: Sistema de Gestión de Maquinaria
     ```

4. **Verificar dominio** (Opcional pero recomendado):
   - En SendGrid, ve a "Settings" > "Sender Authentication"
   - Configura "Domain Authentication"
   - Sigue las instrucciones para agregar registros DNS

### Opción B: Gmail Business (Más simple)

1. **Obtener Gmail Business**:
   - Ve a https://workspace.google.com
   - Crea una cuenta para tu dominio
   - Costo: ~$6/usuario/mes

2. **Habilitar App Passwords**:
   - Ve a tu cuenta Google
   - Seguridad > Autenticación en 2 pasos
   - Generar contraseña de aplicación

3. **Configurar**:
   ```
   SMTP Host: smtp.gmail.com
   SMTP Port: 587
   Security: No (STARTTLS)
   Username: alertas@tuempresa.com
   Password: [App Password generada]
   From Email: alertas@tuempresa.com
   From Name: Sistema de Alertas
   ```

## ⚡ Configuración Rápida en el Sistema

1. **Acceder a configuración**:
   - Inicia sesión como Super Admin
   - Ve a Admin Panel > Settings
   - Selecciona "Email Server"

2. **Configurar servidor**:
   - Completa todos los campos según tu proveedor
   - Usa los datos de configuración de arriba

3. **Probar conexión**:
   - Haz clic en "Test Connection"
   - Revisa tu email para confirmar que llegó el mensaje de prueba

4. **Guardar configuración**:
   - Haz clic en "Save Email Settings"
   - El sistema ahora usará esta configuración para todas las alertas

## 🔧 Configuración de Base de Datos

### MongoDB Atlas (Recomendado)

1. **Crear cluster gratuito**:
   - Ve a https://mongodb.com/atlas
   - Registra una cuenta
   - Crea un cluster gratuito (M0)

2. **Configurar acceso**:
   - Crea un usuario de base de datos
   - Configura Network Access (whitelist tu IP)
   - Obtén la connection string

3. **Configurar en tu sistema**:
   - Ve a Admin Panel > Settings > Database
   - Los cambios de connection string requieren reiniciar la aplicación
   - Se recomienda configurar como variable de entorno

## 🚨 Resolución de Problemas

### Email no llega:
1. Verifica configuración SMTP
2. Revisa carpeta de spam
3. Confirma que el dominio esté verificado
4. Revisa límites de envío del proveedor

### Error de autenticación:
1. Verifica username y password
2. Para Gmail, usa App Password, no la contraseña normal
3. Confirma que 2FA esté habilitado si es requerido

### Límites de envío:
1. SendGrid Free: 100 emails/día
2. Gmail: 500 emails/día por cuenta
3. Mailgun Free: 5,000 emails/mes

## 💰 Costos Estimados

Para una empresa pequeña (< 1000 alertas/mes):
- **SendGrid**: $0 (plan gratuito)
- **Mailgun**: $0 (plan gratuito)
- **Amazon SES**: ~$0.10/mes
- **Gmail Business**: $6/mes por usuario

Para una empresa mediana (< 10,000 alertas/mes):
- **SendGrid**: $15/mes
- **Mailgun**: $35/mes
- **Amazon SES**: ~$1/mes
- **Gmail Business**: $6/mes por usuario

## 🎯 Recomendación Final

**Para la mayoría de empresas**: Empezar con **SendGrid** en el plan gratuito y escalar según necesidad.

**Para empresas que ya usan Google Workspace**: Usar **Gmail Business**.

**Para empresas con alto volumen**: **Amazon SES** por su costo por uso.

---

*Configuración actualizada: Diciembre 2024*
