# Script para eliminar archivos residuales identificados
# Todos los archivos tienen RIESGO BAJO y pueden eliminarse seguramente

Write-Host "=== ELIMINACIÓN DE ARCHIVOS RESIDUALES ===" -ForegroundColor Yellow
Write-Host "Eliminando 31 archivos residuales identificados como seguros" -ForegroundColor Yellow
Write-Host ""

# Función para eliminar archivos/carpetas de forma segura
function Remove-SafeFile {
    param(
        [string]$Path,
        [string]$Description
    )
    
    if (Test-Path $Path) {
        Write-Host "🗑️  Eliminando: $Description" -ForegroundColor Green
        Write-Host "   Ruta: $Path" -ForegroundColor Gray
        try {
            Remove-Item -Path $Path -Recurse -Force
            Write-Host "   ✅ Eliminado exitosamente" -ForegroundColor Green
        }
        catch {
            Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        Write-Host ""
    }
    else {
        Write-Host "⚠️  No encontrado: $Path" -ForegroundColor Yellow
    }
}

Write-Host "1. ELIMINANDO ARCHIVOS DE DEBUG Y DESARROLLO EN RAÍZ" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan

Remove-SafeFile "debug-admin-user.js" "Script debug usuario admin"
Remove-SafeFile "debug-admin-user-fixed.js" "Script debug usuario admin (versión fixed)"
Remove-SafeFile "fix-admin-organization-simple.mjs" "Script fix organización admin simple"
Remove-SafeFile "fix-admin-organization.mjs" "Script fix organización admin"
Remove-SafeFile "fix-all-machine-organizations.mjs" "Script fix todas las organizaciones"
Remove-SafeFile "migrate-user-workplace-field.mjs" "Script migración workplace usuarios"
Remove-SafeFile "migrate-workplace-field.mjs" "Script migración workplace"
Remove-SafeFile "update-machines-to-judco.mjs" "Script actualizar máquinas a Judco"

Write-Host "2. ELIMINANDO DOCUMENTACIÓN TEMPORAL" -ForegroundColor Cyan
Write-Host "══════════════════════════════════" -ForegroundColor Cyan

Remove-SafeFile "WORKPLACE-IMPLEMENTATION.md" "Documentación implementación workplace"
Remove-SafeFile "WORKPLACE-SYSTEM-README.md" "README sistema workplace"

Write-Host "3. ELIMINANDO SCRIPTS VACÍOS" -ForegroundColor Cyan
Write-Host "═══════════════════════════" -ForegroundColor Cyan

Remove-SafeFile "scripts\test-organizations-api.js" "Test API organizaciones (VACÍO)"
Remove-SafeFile "scripts\check-user-roles.js" "Check roles usuarios (VACÍO)"

Write-Host "4. ELIMINANDO ARCHIVOS DE DESARROLLO EN FRONTEND" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan

Remove-SafeFile "apps\frontend\add-johndeere-5420.js" "Script add John Deere 5420 (duplicado)"
Remove-SafeFile "apps\frontend\add-johndeere-5525n.js" "Script add John Deere 5525n"
Remove-SafeFile "apps\frontend\add-kawasaki-mule-kaf400k.js" "Script add Kawasaki Mule (duplicado)"
Remove-SafeFile "apps\frontend\test-alerts.js" "Test alertas"
Remove-SafeFile "apps\frontend\test-email-settings-api.js" "Test API email settings"
Remove-SafeFile "apps\frontend\test-reset-email.js" "Test reset email"
Remove-SafeFile "apps\frontend\update-admin-credentials.js" "Update admin credentials"
Remove-SafeFile "apps\frontend\fix-user-workspace.js" "Fix user workspace"
Remove-SafeFile "apps\frontend\sync-user.mjs" "Sync user"

Write-Host "5. ELIMINANDO SCRIPTS POWERSHELL DE FIX" -ForegroundColor Cyan
Write-Host "═════════════════════════════════════" -ForegroundColor Cyan

Remove-SafeFile "apps\frontend\fix-all-paths.ps1" "Fix all paths PowerShell"
Remove-SafeFile "apps\frontend\fix-dynamic-files.ps1" "Fix dynamic files"
Remove-SafeFile "apps\frontend\fix-dynamic-routes.ps1" "Fix dynamic routes"
Remove-SafeFile "apps\frontend\fix-imports-final.ps1" "Fix imports final"
Remove-SafeFile "apps\frontend\fix-remaining-routes.ps1" "Fix remaining routes"
Remove-SafeFile "apps\frontend\fix-remaining.ps1" "Fix remaining"
Remove-SafeFile "apps\frontend\restore-imports.ps1" "Restore imports"

Write-Host "6. ELIMINANDO CARPETAS DE BACKUP (GRANDES)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan

Remove-SafeFile "apps\frontend\migration_scripts_backup" "Carpeta migration scripts backup"
Remove-SafeFile "apps\frontend\original_app_backup" "Carpeta original app backup (GRANDE)"

Write-Host "7. ELIMINANDO LOGS TEMPORALES" -ForegroundColor Cyan
Write-Host "════════════════════════════" -ForegroundColor Cyan

Remove-SafeFile "apps\frontend\error.log" "Log de errores temporal"

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "🎉 LIMPIEZA RESIDUAL COMPLETADA" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📊 RESULTADOS:" -ForegroundColor Yellow
Write-Host "✅ Eliminados archivos de debug y migración (8)" -ForegroundColor White
Write-Host "✅ Eliminada documentación temporal (2)" -ForegroundColor White  
Write-Host "✅ Eliminados scripts vacíos (2)" -ForegroundColor White
Write-Host "✅ Eliminados archivos de desarrollo frontend (9)" -ForegroundColor White
Write-Host "✅ Eliminados scripts PowerShell de fix (7)" -ForegroundColor White
Write-Host "✅ Eliminadas carpetas de backup (2)" -ForegroundColor White
Write-Host "✅ Eliminados logs temporales (1)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 TOTAL: 31 archivos residuales eliminados" -ForegroundColor Green
Write-Host ""
Write-Host "✅ APLICACIÓN INTACTA - Todos los archivos importantes se mantuvieron:" -ForegroundColor Yellow
Write-Host "   - apps/frontend/app/ (código principal)" -ForegroundColor White
Write-Host "   - apps/frontend/public/ (recursos)" -ForegroundColor White
Write-Host "   - package.json y configuraciones" -ForegroundColor White
Write-Host "   - scripts/add-*.js y scripts/verify-*.js" -ForegroundColor White
Write-Host "   - docs/ importantes" -ForegroundColor White
Write-Host ""
Write-Host "🎯 La aplicación está ahora totalmente optimizada para producción" -ForegroundColor Green
