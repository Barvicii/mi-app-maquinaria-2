# Análisis de la carpeta /scripts
# Determinando qué archivos son necesarios vs residuales

Write-Host "=== ANÁLISIS DE CARPETA /scripts ===" -ForegroundColor Yellow
Write-Host "Analizando cada script para determinar si es necesario o residual" -ForegroundColor Yellow
Write-Host ""

# Función para analizar scripts
function Analyze-Script {
    param(
        [string]$Path,
        [string]$Description,
        [string]$Usage,
        [string]$Recommendation,
        [string]$Risk
    )
    
    if (Test-Path $Path) {
        $size = (Get-Item $Path).Length
        Write-Host "📄 $Description" -ForegroundColor Cyan
        Write-Host "   Archivo: $Path ($size bytes)" -ForegroundColor Gray
        Write-Host "   Uso: $Usage" -ForegroundColor White
        Write-Host "   Recomendación: $Recommendation" -ForegroundColor $(if($Recommendation -match "MANTENER") {"Green"} else {"Yellow"})
        Write-Host "   Riesgo de eliminación: $Risk" -ForegroundColor $(if($Risk -eq "BAJO") {"Green"} elseif($Risk -eq "MEDIO") {"Yellow"} else {"Red"})
        Write-Host ""
        return $true
    }
    return $false
}

$scriptsToKeep = @()
$scriptsToRemove = @()

Write-Host "1. SCRIPTS DE AGREGAR MÁQUINAS" -ForegroundColor Magenta
Write-Host "═══════════════════════════════" -ForegroundColor Magenta

if (Analyze-Script "scripts\add-all-machines.js" "Script maestro para agregar todas las máquinas" "Útil para configuración inicial o reset del sistema" "MANTENER - Script funcional importante" "ALTO") {
    $scriptsToKeep += "scripts\add-all-machines.js"
}

if (Analyze-Script "scripts\add-deutzfahr-5090dv.js" "Agregar máquina Deutz-Fahr 5090DV específica" "Agregar modelo específico de tractor" "EVALUAR - ¿Se usa regularmente?" "MEDIO") {
    # Será evaluado
}

if (Analyze-Script "scripts\add-deutzfahr-5100dv.js" "Agregar máquina Deutz-Fahr 5100DV específica" "Agregar modelo específico de tractor" "EVALUAR - ¿Se usa regularmente?" "MEDIO") {
    # Será evaluado
}

if (Analyze-Script "scripts\add-johndeere-5420.js" "Agregar máquina John Deere 5420 específica" "Agregar modelo específico de tractor" "EVALUAR - ¿Se usa regularmente?" "MEDIO") {
    # Será evaluado
}

if (Analyze-Script "scripts\add-kawasaki-mule-kaf400k.js" "Agregar Kawasaki Mule KAF400K específica" "Agregar modelo específico de UTV" "EVALUAR - ¿Se usa regularmente?" "MEDIO") {
    # Será evaluado
}

if (Analyze-Script "scripts\add-munckhof-sprayer.js" "Agregar Munckhof Sprayer específica" "Agregar modelo específico de fumigadora" "EVALUAR - ¿Se usa regularmente?" "MEDIO") {
    # Será evaluado
}

Write-Host "2. SCRIPTS DE TEMPLATES" -ForegroundColor Magenta
Write-Host "══════════════════════" -ForegroundColor Magenta

if (Analyze-Script "scripts\add-kawasaki-mule-template.js" "Template para agregar Kawasaki Mule" "Template reutilizable para diferentes modelos" "MANTENER - Template útil" "MEDIO") {
    $scriptsToKeep += "scripts\add-kawasaki-mule-template.js"
}

if (Analyze-Script "scripts\add-munckhof-sprayer-template.js" "Template para agregar Munckhof Sprayer" "Template reutilizable para fumigadoras" "MANTENER - Template útil" "MEDIO") {
    $scriptsToKeep += "scripts\add-munckhof-sprayer-template.js"
}

if (Analyze-Script "scripts\add-tractor-template.js" "Template genérico para agregar tractores" "Template base para cualquier tractor" "MANTENER - Template muy útil" "ALTO") {
    $scriptsToKeep += "scripts\add-tractor-template.js"
}

if (Analyze-Script "scripts\make-templates-global.js" "Hacer templates globales" "Configurar templates para toda la organización" "MANTENER - Funcionalidad importante" "ALTO") {
    $scriptsToKeep += "scripts\make-templates-global.js"
}

Write-Host "3. SCRIPTS DE VERIFICACIÓN" -ForegroundColor Magenta
Write-Host "════════════════════════" -ForegroundColor Magenta

if (Analyze-Script "scripts\verify-all-templates.js" "Verificar todos los templates" "Validar que templates estén correctos" "MANTENER - Útil para mantenimiento" "MEDIO") {
    $scriptsToKeep += "scripts\verify-all-templates.js"
}

if (Analyze-Script "scripts\verify-kawasaki-template.js" "Verificar template Kawasaki específico" "Validar template específico" "EVALUAR - ¿Muy específico?" "BAJO") {
    # Será evaluado
}

if (Analyze-Script "scripts\verify-machines.js" "Verificar máquinas en el sistema" "Validar integridad de máquinas" "MANTENER - Útil para diagnóstico" "MEDIO") {
    $scriptsToKeep += "scripts\verify-machines.js"
}

if (Analyze-Script "scripts\verify-template-structure.js" "Verificar estructura de templates" "Validar que templates tengan estructura correcta" "MANTENER - Útil para mantenimiento" "MEDIO") {
    $scriptsToKeep += "scripts\verify-template-structure.js"
}

Write-Host "4. SCRIPTS DE MANTENIMIENTO" -ForegroundColor Magenta
Write-Host "══════════════════════════" -ForegroundColor Magenta

if (Analyze-Script "scripts\fix-kawasaki-mule-template.js" "Fix template Kawasaki Mule" "Corregir template específico (ya aplicado)" "ELIMINAR - Fix ya aplicado" "BAJO") {
    $scriptsToRemove += "scripts\fix-kawasaki-mule-template.js"
}

if (Analyze-Script "scripts\update-munckhof-template.js" "Actualizar template Munckhof" "Actualizar template específico (ya aplicado)" "ELIMINAR - Update ya aplicado" "BAJO") {
    $scriptsToRemove += "scripts\update-munckhof-template.js"
}

if (Analyze-Script "scripts\review-prestarts-alerts.js" "Revisar alertas de prestarts" "Script de análisis temporal" "ELIMINAR - Script de desarrollo" "BAJO") {
    $scriptsToRemove += "scripts\review-prestarts-alerts.js"
}

Write-Host "5. SCRIPTS DE UTILIDADES" -ForegroundColor Magenta
Write-Host "═══════════════════════" -ForegroundColor Magenta

if (Analyze-Script "scripts\list-users.js" "Listar todos los usuarios" "Herramienta de administración útil" "MANTENER - Útil para admin" "MEDIO") {
    $scriptsToKeep += "scripts\list-users.js"
}

Write-Host "6. SCRIPTS VACÍOS" -ForegroundColor Magenta
Write-Host "═══════════════" -ForegroundColor Magenta

if (Analyze-Script "scripts\create-judco-organization.js" "Crear organización Judco (VACÍO)" "Archivo completamente vacío" "ELIMINAR - Archivo vacío" "BAJO") {
    $scriptsToRemove += "scripts\create-judco-organization.js"
}

if (Analyze-Script "scripts\find-all-users.js" "Encontrar todos los usuarios (VACÍO)" "Archivo completamente vacío" "ELIMINAR - Archivo vacío" "BAJO") {
    $scriptsToRemove += "scripts\find-all-users.js"
}

if (Analyze-Script "scripts\verify-system-status.js" "Verificar estado del sistema (VACÍO)" "Archivo completamente vacío" "ELIMINAR - Archivo vacío" "BAJO") {
    $scriptsToRemove += "scripts\verify-system-status.js"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "RESUMEN DE ANÁLISIS" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "✅ SCRIPTS IMPORTANTES A MANTENER ($($scriptsToKeep.Count)):" -ForegroundColor Green
foreach ($script in $scriptsToKeep) {
    Write-Host "  ✓ $script" -ForegroundColor White
}

Write-Host ""
Write-Host "🗑️  SCRIPTS SEGUROS PARA ELIMINAR ($($scriptsToRemove.Count)):" -ForegroundColor Yellow
foreach ($script in $scriptsToRemove) {
    Write-Host "  ✗ $script" -ForegroundColor Gray
}

Write-Host ""
Write-Host "❓ SCRIPTS ESPECÍFICOS A EVALUAR:" -ForegroundColor Cyan
Write-Host "  • add-deutzfahr-*.js (modelos específicos)" -ForegroundColor White
Write-Host "  • add-johndeere-*.js (modelos específicos)" -ForegroundColor White  
Write-Host "  • add-kawasaki-mule-kaf400k.js (modelo específico)" -ForegroundColor White
Write-Host "  • add-munckhof-sprayer.js (modelo específico)" -ForegroundColor White
Write-Host "  • verify-kawasaki-template.js (verificación específica)" -ForegroundColor White
Write-Host ""
Write-Host "🎯 RECOMENDACIÓN FINAL:" -ForegroundColor Green
Write-Host "La carpeta /scripts SÍ es necesaria pero puede ser optimizada." -ForegroundColor Green
Write-Host "Mantener templates y scripts de verificación importantes." -ForegroundColor Green
Write-Host "Eliminar scripts vacíos y fixes ya aplicados." -ForegroundColor Green
