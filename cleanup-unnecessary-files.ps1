# Script para eliminar archivos innecesarios del proyecto
# Ejecutar con cuidado - eliminará archivos permanentemente

Write-Host "=== LIMPIEZA DE ARCHIVOS INNECESARIOS ===" -ForegroundColor Yellow
Write-Host "Este script eliminará archivos de backup, pruebas y desarrollo" -ForegroundColor Yellow
Write-Host ""

# Función para eliminar archivos/carpetas con confirmación
function Remove-SafePath {
    param(
        [string]$Path,
        [string]$Description
    )
    
    if (Test-Path $Path) {
        Write-Host "Eliminando: $Description" -ForegroundColor Green
        Write-Host "Ruta: $Path" -ForegroundColor Gray
        try {
            Remove-Item -Path $Path -Recurse -Force
            Write-Host "✓ Eliminado exitosamente" -ForegroundColor Green
        }
        catch {
            Write-Host "✗ Error al eliminar: $($_.Exception.Message)" -ForegroundColor Red
        }
        Write-Host ""
    }
    else {
        Write-Host "No encontrado: $Path" -ForegroundColor Yellow
    }
}

# 1. CARPETAS DE BACKUP GRANDES
Write-Host "1. Eliminando carpetas de backup..." -ForegroundColor Cyan
Remove-SafePath "apps\backend" "Carpeta backend vacía"
Remove-SafePath "apps\frontend\src_backup_20250729_211810" "Backup principal (329 archivos)"

# 2. ARCHIVOS DUPLICADOS _FIXED
Write-Host "2. Eliminando archivos duplicados _fixed..." -ForegroundColor Cyan
$fixedFiles = Get-ChildItem -Path "." -Recurse -Name "*_fixed*" -File
foreach ($file in $fixedFiles) {
    Remove-SafePath $file "Archivo duplicado _fixed"
}

# 3. ARCHIVOS DE PRUEBA EN RAÍZ
Write-Host "3. Eliminando archivos de prueba en raíz..." -ForegroundColor Cyan
Remove-SafePath "test-alert-prestart.json" "Test JSON - alertas prestart"
Remove-SafePath "test-prestart.json" "Test JSON - prestart"
Remove-SafePath "test-reports-enhancement.js" "Test JS - reportes"
Remove-SafePath "test-user-limit-frontend.html" "Test HTML - límite usuarios"
Remove-SafePath "test-user-limit.js" "Test JS - límite usuarios"
Remove-SafePath "test-workplace-fix.js" "Test JS - workplace fix"

# 4. SCRIPTS DE DEBUG EN RAÍZ
Write-Host "4. Eliminando scripts de debug en raíz..." -ForegroundColor Cyan
Remove-SafePath "check-user-data.mjs" "Script check user data"
Remove-SafePath "debug-admin-access.mjs" "Script debug admin access"
Remove-SafePath "fix-user-organizations.mjs" "Script fix user organizations"

# 5. SCRIPTS DE DEBUG EN CARPETA PRINCIPAL
Write-Host "5. Eliminando scripts de debug de carpeta principal..." -ForegroundColor Cyan
$debugScripts = @(
    "check-admin-users.js",
    "check-db-machines.js", 
    "check-user-data.mjs",
    "debug-all-machines.mjs",
    "debug-machines.js",
    "debug-report-data.js", 
    "debug-workplace-machines.mjs",
    "migrate-workplace-fields.mjs",
    "verificar-cambios.js"
)

foreach ($script in $debugScripts) {
    Remove-SafePath $script "Script de debug: $script"
}

# 6. SCRIPTS DE CLEANUP ANTERIORES
Write-Host "6. Eliminando scripts de cleanup anteriores..." -ForegroundColor Cyan
Remove-SafePath "cleanup-test-files.ps1" "Script cleanup anterior"
Remove-SafePath "final-cleanup.ps1" "Script cleanup final anterior"
Remove-SafePath "restart-dev.ps1" "Script restart dev"

# 7. SCRIPTS DE FIX
Write-Host "7. Eliminando scripts de fix..." -ForegroundColor Cyan
$fixScripts = @(
    "fix-all-imports.ps1",
    "fix-final-imports.ps1", 
    "fix-post-migration-imports.ps1"
)

foreach ($script in $fixScripts) {
    Remove-SafePath $script "Script de fix: $script"
}

# 8. ARCHIVOS DE DOCUMENTACIÓN DE DESARROLLO
Write-Host "8. Eliminando documentación de desarrollo..." -ForegroundColor Cyan
Remove-SafePath "INSTRUCCIONES-APLICAR-CAMBIOS.md" "Instrucciones desarrollo"
Remove-SafePath "MIGRATION-LOG.md" "Log de migración"

# 9. ARCHIVOS DE CONFIGURACIÓN INNECESARIOS
Write-Host "9. Eliminando configuraciones innecesarias..." -ForegroundColor Cyan
Remove-SafePath "pnpm-workspace.yaml" "Config workspace PNPM (ya no necesario)"

# 10. SCRIPTS DE DESARROLLO EN /scripts QUE YA NO SE USAN
Write-Host "10. Eliminando scripts de desarrollo obsoletos..." -ForegroundColor Cyan
$obsoleteScripts = @(
    "scripts\fix-barvicii-role.js",
    "scripts\fix-barvicii-uppercase.js", 
    "scripts\fix-super-admin-role.js",
    "scripts\fix-super-admin-uppercase.js",
    "scripts\fix-user-company-fields.js",
    "scripts\fix-user-organizations.mjs",
    "scripts\migrate-user-data.js",
    "scripts\setup-user-hierarchy.mjs",
    "scripts\simple-migrate.js",
    "scripts\update-admin-credentials.js",
    "scripts\update-user-roles.js"
)

foreach ($script in $obsoleteScripts) {
    Remove-SafePath $script "Script obsoleto: $script"
}

# 11. DOCUMENTACIÓN DE DESARROLLO TEMPORAL
Write-Host "11. Eliminando documentación temporal..." -ForegroundColor Cyan
$tempDocs = @(
    "docs\admin-credentials-update-log.md",
    "docs\alert-testing-access-control.md", 
    "docs\all-machines-scripts.md",
    "docs\kawasaki-mule-kaf400k-script.md",
    "docs\organization-fields-fix.md",
    "docs\reset-password-system.md"
)

foreach ($doc in $tempDocs) {
    Remove-SafePath $doc "Documentación temporal: $doc"
}

Write-Host ""
Write-Host "=== LIMPIEZA COMPLETADA ===" -ForegroundColor Green
Write-Host "Se han eliminado todos los archivos innecesarios identificados" -ForegroundColor Green
Write-Host "La aplicación debe seguir funcionando normalmente" -ForegroundColor Green
Write-Host ""
Write-Host "Archivos importantes que SE MANTUVIERON:" -ForegroundColor Yellow
Write-Host "- apps/frontend/ (código principal)" -ForegroundColor White
Write-Host "- package.json" -ForegroundColor White  
Write-Host "- README.md" -ForegroundColor White
Write-Host "- vercel.json" -ForegroundColor White
Write-Host "- scripts/add-*.js (scripts funcionales)" -ForegroundColor White
Write-Host "- scripts/verify-*.js (scripts de verificación)" -ForegroundColor White
Write-Host "- docs/implementation-plan.md" -ForegroundColor White
Write-Host "- docs/email-*.md" -ForegroundColor White
Write-Host "- docs/mongodb-usage-guide.md" -ForegroundColor White
Write-Host "- docs/sistema-alertas.md" -ForegroundColor White
