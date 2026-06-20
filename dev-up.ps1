# dev-up.ps1 - Launch Victus Deck dev environment with necessary Administrator elevation

Set-Location $PSScriptRoot

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin) {
    Write-Host "Running with Administrator privileges. Launching dev environment..." -ForegroundColor Green
    npm run tauri dev
} else {
    Write-Host "Elevation required. Launching elevated PowerShell session..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot'; npm run tauri dev" -Verb RunAs
}
