# =============================================================
# SDMS Backend Dev Server (Network & Local Accessible)
# =============================================================
# Full command this script replaces:
#   C:\xampp\php\php.exe -S 0.0.0.0:8000 -t G:\assignment\student_discipline_ms\backend\public
#
# HOW TO RUN (from anywhere in the project):
#   .\backend\serve.ps1
#   -- or from inside the backend\ folder --
#   .\serve.ps1
# =============================================================

$php    = "C:\xampp\php\php.exe"
$host_  = "0.0.0.0:8000"
$root   = "$PSScriptRoot\public"

# Get Local IP Address for Expo Mobile Testing
$localIp = (Get-NetIPAddress -AddressFamily IPv4 -Type Unicast | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "  SDMS Backend API" -ForegroundColor Cyan
Write-Host "  Local URL:   http://127.0.0.1:8000/api" -ForegroundColor Green
if ($localIp) {
    Write-Host "  Network URL: http://${localIp}:8000/api (Use this IP for Expo Go on mobile)" -ForegroundColor Yellow
}
Write-Host "  Document root: $root" -ForegroundColor Gray
Write-Host "  Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

& $php -S $host_ -t $root
