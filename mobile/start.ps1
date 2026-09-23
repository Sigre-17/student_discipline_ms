# =============================================================
# SDMS Mobile App Dev Server (Expo)
# =============================================================
# HOW TO RUN (from inside mobile/ folder):
#   .\start.ps1
#   -- or using npx --
#   npx expo start
# =============================================================

Write-Host ""
Write-Host "  Starting SDMS Mobile (Expo)..." -ForegroundColor Cyan
Write-Host "  Make sure your PHP backend is running (..\backend\serve.ps1)" -ForegroundColor Yellow
Write-Host ""

npx expo start
