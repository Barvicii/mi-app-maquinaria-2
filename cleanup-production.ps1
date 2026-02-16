# Script de limpieza para preparar la aplicación para producción
# Elimina archivos de desarrollo, testing y debug que no son necesarios

Write-Host "🧹 Iniciando limpieza de archivos innecesarios para producción..." -ForegroundColor Cyan

$basePath = "C:\Users\Barbas\Desktop\Coding Proyects\Judco\mi-app-maquinaria-2"
$cleanupItems = @()

# Archivos de test en la raíz
$testFiles = @(
    "$basePath\test-machine-update.js",
    "$basePath\test-machine-report.js", 
    "$basePath\debug-vehicle-data.js"
)

# Páginas de debug y test
$debugPages = @(
    "$basePath\apps\frontend\app\debug-test",
    "$basePath\apps\frontend\app\test",
    "$basePath\apps\frontend\app\test-admin"
)

# APIs de debug y test
$debugApis = @(
    "$basePath\apps\frontend\app\api\debug",
    "$basePath\apps\frontend\app\api\debug-data",
    "$basePath\apps\frontend\app\api\organizations-test",
    "$basePath\apps\frontend\app\api\alerts\test"
)

# Componentes obsoletos
$obsoleteComponents = @(
    "$basePath\apps\frontend\app\components\TabReports_RESTORED.js"
)

# Scripts de limpieza antiguos
$cleanupScripts = @(
    "$basePath\cleanup-scripts-folder.ps1",
    "$basePath\analyze-scripts-folder.ps1",
    "$basePath\cleanup-residual-files.ps1",
    "$basePath\cleanup-unnecessary-files.ps1"
)

# Documentación de desarrollo (opcional - mantener si necesitas)
$devDocs = @(
    "$basePath\docs\prestart-templates-user-testing.md"
)

# Tests unitarios (mantener si planeas usar)
$testDirs = @(
    "$basePath\apps\frontend\tests"
)

# Función para eliminar archivos/carpetas
function Remove-ItemSafely {
    param($Path, $Description)
    
    if (Test-Path $Path) {
        try {
            Remove-Item $Path -Recurse -Force
            Write-Host "✅ Eliminado: $Description" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "❌ Error eliminando: $Description - $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "⚠️  No encontrado: $Description" -ForegroundColor Yellow
        return $false
    }
}

# Eliminar archivos de test
Write-Host "`n🗂️  Eliminando archivos de test..." -ForegroundColor Yellow
foreach ($file in $testFiles) {
    Remove-ItemSafely -Path $file -Description "Test file: $(Split-Path $file -Leaf)"
}

# Eliminar páginas de debug
Write-Host "`n🚫 Eliminando páginas de debug..." -ForegroundColor Yellow
foreach ($page in $debugPages) {
    Remove-ItemSafely -Path $page -Description "Debug page: $(Split-Path $page -Leaf)"
}

# Eliminar APIs de debug
Write-Host "`n🔧 Eliminando APIs de debug..." -ForegroundColor Yellow
foreach ($api in $debugApis) {
    Remove-ItemSafely -Path $api -Description "Debug API: $(Split-Path $api -Leaf)"
}

# Eliminar componentes obsoletos
Write-Host "`n📦 Eliminando componentes obsoletos..." -ForegroundColor Yellow
foreach ($component in $obsoleteComponents) {
    Remove-ItemSafely -Path $component -Description "Obsolete component: $(Split-Path $component -Leaf)"
}

# Eliminar scripts de limpieza antiguos
Write-Host "`n🧽 Eliminando scripts de limpieza antiguos..." -ForegroundColor Yellow
foreach ($script in $cleanupScripts) {
    Remove-ItemSafely -Path $script -Description "Cleanup script: $(Split-Path $script -Leaf)"
}

# Limpiar archivos temporales de Node.js
Write-Host "`n🗑️  Limpiando archivos temporales..." -ForegroundColor Yellow

# Limpiar node_modules si existe (se puede reinstalar)
$nodeModules = "$basePath\node_modules"
if (Test-Path $nodeModules) {
    Write-Host "⚠️  ¿Eliminar node_modules? (se puede reinstalar con npm install)" -ForegroundColor Yellow
    # Remove-ItemSafely -Path $nodeModules -Description "Node modules"
}

# Limpiar .next build cache
$nextCache = "$basePath\apps\frontend\.next"
if (Test-Path $nextCache) {
    Remove-ItemSafely -Path $nextCache -Description ".next build cache"
}

# Buscar y eliminar archivos de log temporales
$logFiles = Get-ChildItem -Path $basePath -Recurse -Include "*.log", "*.tmp" -ErrorAction SilentlyContinue
foreach ($logFile in $logFiles) {
    Remove-ItemSafely -Path $logFile.FullName -Description "Log file: $($logFile.Name)"
}

Write-Host "`n✨ Limpieza completada!" -ForegroundColor Green
Write-Host "📋 Se recomienda ejecutar 'npm run build' para verificar que todo funciona correctamente." -ForegroundColor Cyan

# Opcional: Ejecutar build automáticamente
Write-Host "`n🔨 ¿Ejecutar build para verificar? (Enter para continuar, Ctrl+C para cancelar)"
Read-Host
npm run build
