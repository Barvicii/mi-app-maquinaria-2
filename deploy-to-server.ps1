param(
    [Parameter(Mandatory=$true)]
    [string]$ServerUser,
    
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [string]$RemotePath = "~/maquinaria-app",
    [string]$AppPort = "3010",
    [string]$MongoPort = "27020"
)

# SSH key-based auth recommended. No passwords stored in scripts.

# Asegurar que estamos en el directorio del script y sincronizar entorno .NET
if ($PSScriptRoot) {
    Set-Location $PSScriptRoot
    [Environment]::CurrentDirectory = $PSScriptRoot
}
Write-Host "Directorio de trabajo: $PWD"

Write-Host "=================================================="
Write-Host "Iniciando despliegue a $ServerUser@$ServerIP"
Write-Host "Puertos a usar: App=$AppPort, Mongo=$MongoPort"
Write-Host "Asegurate de tener SSH key configurada o te pedira la contrasena."
Write-Host "=================================================="

# 0. Verificar puertos (Intento básico)
Write-Host "Verificando disponibilidad de puertos en el servidor..."
Write-Host "(Te pedirá la contraseña ahora para verificar)"
$CheckCommand = "ss -tuln | grep -E ':$AppPort|:$MongoPort'"
ssh $ServerUser@$ServerIP $CheckCommand

if ($LASTEXITCODE -eq 0) {
    Write-Warning "¡CUIDADO! Parece que los puertos $AppPort o $MongoPort ya están en uso."
    Write-Warning "Revisa la salida anterior. Si ves algo, cancela con Ctrl+C y cambia los puertos en .env.docker"
    Start-Sleep -Seconds 5
} else {
    Write-Host "Puertos parecen libres (o netstat falló/no encontró nada). Continuando..."
}

# 1. Crear directorio remoto
Write-Host "Creando directorio remoto..."
ssh $ServerUser@$ServerIP "mkdir -p $RemotePath"

# Función para reintentar comandos
function Retry-Command {
    param (
        [string]$Command,
        [int]$MaxRetries = 10,
        [int]$Delay = 10
    )
    
    for ($i = 0; $i -lt $MaxRetries; $i++) {
        try {
            Invoke-Expression $Command
            if ($LASTEXITCODE -eq 0) { return }
            throw "Command failed with exit code $LASTEXITCODE"
        }
        catch {
            Write-Warning "Intento $($i+1)/$MaxRetries fallido. Reintentando en $Delay segundos..."
            Start-Sleep -Seconds $Delay
        }
    }
    Write-Error "El comando falló después de $MaxRetries intentos."
    exit 1
}

# 2. Copiar archivos de configuración
Write-Host "Copiando configuraciones..."
if (-not (Test-Path ".env.docker")) {
    Write-Error "No se encontro .env.docker. Copia .env.docker.example a .env.docker y completa los valores."
    exit 1
}
Retry-Command "scp docker-compose.yml .env.docker `"$ServerUser@${ServerIP}:$RemotePath/`""

# 3. Empaquetar aplicación (excluyendo node_modules y .next para velocidad)
Write-Host "Empaquetando aplicación..."
if (Test-Path "app-bundle.tar.gz") { Remove-Item "app-bundle.tar.gz" }

# Usar ruta relativa explícita para tar
tar -czf app-bundle.tar.gz apps/frontend --exclude="apps/frontend/node_modules" --exclude="apps/frontend/.next" --exclude="apps/frontend/.env.local"

if (-not (Test-Path "app-bundle.tar.gz")) {
    Write-Error "Fallo al crear app-bundle.tar.gz. Verifique que 'tar' está instalado y las rutas son correctas."
    exit 1
}

# Función para dividir archivo
function Split-File {
    param(
        [string]$FilePath,
        [int]$ChunkSizeMB = 2
    )
    Write-Host "Dividiendo $FilePath en partes de ${ChunkSizeMB}MB..."
    $bufferSize = $ChunkSizeMB * 1024 * 1024
    $buffer = New-Object byte[] $bufferSize
    $reader = [System.IO.File]::OpenRead($FilePath)
    $count = 0
    $chunkNum = 0
    $chunks = @()
    
    while (($count = $reader.Read($buffer, 0, $bufferSize)) -gt 0) {
        $chunkName = "$FilePath.$($chunkNum.ToString('000'))"
        $writer = [System.IO.File]::Create($chunkName)
        $writer.Write($buffer, 0, $count)
        $writer.Close()
        $chunks += $chunkName
        $chunkNum++
    }
    $reader.Close()
    return $chunks
}

# 4. Subir paquete (por partes)
Write-Host "Subiendo código fuente por partes..."
$AbsPath = (Resolve-Path "app-bundle.tar.gz").Path
$Chunks = Split-File $AbsPath
$TotalChunks = $Chunks.Count

foreach ($Chunk in $Chunks) {
    $Index = $Chunks.IndexOf($Chunk) + 1
    Write-Host "Subiendo parte $Index de $TotalChunks : $Chunk ..."
    Retry-Command "scp $Chunk `"$ServerUser@${ServerIP}:$RemotePath/`""
}

# 5. Extraer y Preparar
Write-Host "Reensamblando y extrayendo en el servidor..."
# Usamos 'ls' para verificar si existen partes antes de intentar concatenar, para evitar errores en reintentos
# IMPORTANTE: Borramos .env.local DESPUÉS de extraer para asegurar que no quede, incluso si el tar lo trajo
$AssembleCommand = "cd $RemotePath && (ls app-bundle.tar.gz.* >/dev/null 2>&1 && cat app-bundle.tar.gz.* > app-bundle.tar.gz && rm app-bundle.tar.gz.* || true) && tar -xzf app-bundle.tar.gz && rm -f apps/frontend/.env.local && mv .env.docker .env"
Retry-Command "ssh $ServerUser@$ServerIP `"$AssembleCommand`""

# 6. Ejecutar Docker
Write-Host "Iniciando contenedores Docker..."
$DockerCommand = "cd $RemotePath && docker-compose down && docker-compose up -d --build"
Retry-Command "ssh $ServerUser@$ServerIP `"$DockerCommand`""

# 6. Limpieza local
Remove-Item app-bundle.tar.gz
Remove-Item app-bundle.tar.gz.*

Write-Host "¡Despliegue Completado!"
Write-Host "La aplicación debería estar accesible en: http://${ServerIP}:${AppPort}"
