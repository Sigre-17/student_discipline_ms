# =============================================================
# SDMS Mobile App Dev Server (Expo)
# =============================================================
# Auto-detects local Wi-Fi IP and starts Metro in offline LAN mode
# =============================================================

Write-Host ""
Write-Host "  Starting SDMS Mobile (Expo)..." -ForegroundColor Cyan

# Detect active Wi-Fi / Local IPv4
$localIp = (Get-NetIPAddress -AddressFamily IPv4 -Type Unicast | Where-Object { 
    $_.InterfaceAlias -notmatch 'Loopback|vEthernet|WSL' -and 
    $_.IPAddress -notlike '127.*' -and 
    $_.IPAddress -notlike '169.254.*' 
} | Select-Object -First 1).IPAddress

if ($localIp) {
    Write-Host "  Detected Local IP:  $localIp" -ForegroundColor Green
    $env:REACT_NATIVE_PACKAGER_HOSTNAME = $localIp
    $env:EXPO_PUBLIC_API_URL = "http://${localIp}:8000/api"
    "EXPO_PUBLIC_API_URL=http://${localIp}:8000/api" | Set-Content -Path "$PSScriptRoot\.env"
} else {
    Write-Host "  Could not detect local IP, falling back to localhost" -ForegroundColor Yellow
}

Write-Host "  Backend API URL:    $env:EXPO_PUBLIC_API_URL" -ForegroundColor Gray
Write-Host "  Make sure your phone and PC are on the same Wi-Fi!" -ForegroundColor Yellow
Write-Host "  Make sure your PHP backend is running (..\backend\serve.ps1)" -ForegroundColor Yellow
Write-Host "  Tip: Press 'w' in terminal to preview directly in Web Browser." -ForegroundColor DarkGray
Write-Host ""

npx expo start -c
