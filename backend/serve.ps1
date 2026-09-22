# =============================================================
# SDMS Backend Dev Server
# =============================================================
# Full command this script replaces:
#   C:\xampp\php\php.exe -S 127.0.0.1:8000 -t G:\assignment\student_discipline_ms\backend\public
#
# HOW TO RUN (from anywhere in the project):
#   .\backend\serve.ps1
#   -- or from inside the backend\ folder --
#   .\serve.ps1
# =============================================================

$php    = "C:\xampp\php\php.exe"
$host_  = "127.0.0.1:8000"
$root   = "$PSScriptRoot\public"

Write-Host ""
Write-Host "  SDMS Backend" -ForegroundColor Cyan
Write-Host "  Listening on http://$host_" -ForegroundColor Green
Write-Host "  Document root: $root" -ForegroundColor Gray
Write-Host "  Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host ""

& $php -S $host_ -t $root
