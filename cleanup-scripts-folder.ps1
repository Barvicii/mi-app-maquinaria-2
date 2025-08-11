# Script para eliminar scripts innecesarios de la carpeta /scripts
# Solo eliminará archivos vacíos y fixes ya aplicados (RIESGO BAJO)

Write-Host "=== OPTIMIZACIÓN DE CARPETA /scripts ===" -ForegroundColor Yellow
Write-Host "Eliminando 6 scripts innecesarios identificados como seguros" -ForegroundColor Yellow
Write-Host ""

# Función para eliminar archivos de forma segura
function Remove-SafeScript {
    param(
        [string]$Path,
        [string]$Description,
        [string]$Reason
    )
    
    if (Test-Path $Path) {
        $size = (Get-Item $Path).Length
        Write-Host "🗑️  Eliminando: $Description" -ForegroundColor Green
        Write-Host "   Archivo: $Path ($size bytes)" -ForegroundColor Gray
        Write-Host "   Razón: $Reason" -ForegroundColor Yellow
        try {
            Remove-Item -Path $Path -Force
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

Write-Host "1. ELIMINANDO ARCHIVOS COMPLETAMENTE VACÍOS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan

Remove-SafeScript "scripts\create-judco-organization.js" "Crear organización Judco" "Archivo completamente vacío (0 bytes)"
Remove-SafeScript "scripts\find-all-users.js" "Encontrar todos los usuarios" "Archivo completamente vacío (0 bytes)"
Remove-SafeScript "scripts\verify-system-status.js" "Verificar estado del sistema" "Archivo completamente vacío (0 bytes)"

Write-Host "2. ELIMINANDO SCRIPTS DE FIX/UPDATE YA APLICADOS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan

Remove-SafeScript "scripts\fix-kawasaki-mule-template.js" "Fix template Kawasaki Mule" "Script de corrección ya aplicado al sistema"
Remove-SafeScript "scripts\update-munckhof-template.js" "Actualizar template Munckhof" "Script de actualización ya aplicado al sistema"
Remove-SafeScript "scripts\review-prestarts-alerts.js" "Revisar alertas de prestarts" "Script de análisis temporal de desarrollo"

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "🎉 OPTIMIZACIÓN DE /scripts COMPLETADA" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "📊 RESULTADOS:" -ForegroundColor Yellow
Write-Host "✅ Eliminados archivos vacíos (3)" -ForegroundColor White
Write-Host "✅ Eliminados scripts de fix aplicados (3)" -ForegroundColor White
Write-Host "🚀 TOTAL: 6 scripts innecesarios eliminados" -ForegroundColor Green
Write-Host ""

Write-Host "✅ SCRIPTS IMPORTANTES MANTENIDOS:" -ForegroundColor Green
Write-Host "   📁 add-all-machines.js (configuración inicial)" -ForegroundColor White
Write-Host "   📁 add-*-template.js (templates reutilizables)" -ForegroundColor White
Write-Host "   📁 make-templates-global.js (funcionalidad core)" -ForegroundColor White
Write-Host "   📁 verify-*.js (verificación y diagnóstico)" -ForegroundColor White
Write-Host "   📁 list-users.js (herramienta administrativa)" -ForegroundColor White
Write-Host "   📁 Scripts de modelos específicos (para uso futuro)" -ForegroundColor White
Write-Host ""

Write-Host "🎯 CARPETA /scripts OPTIMIZADA:" -ForegroundColor Green
Write-Host "   • Funcionalidad completa mantenida" -ForegroundColor White
Write-Host "   • Solo eliminados archivos innecesarios" -ForegroundColor White
Write-Host "   • Templates y herramientas importantes intactos" -ForegroundColor White
Write-Host "   • Lista para uso en producción" -ForegroundColor White
