$ErrorActionPreference = "Stop"

Write-Host "Starting Legacy v1 Restoration..."

# 1. Protect Logic
if (!(Test-Path "_legacy_v1")) {
    Write-Error "_legacy_v1 folder not found!"
    exit 1
}

# 2. Rename legacy to safe naming to avoid deletion
Write-Host "Preserving _legacy_v1..."
Move-Item -Path "_legacy_v1" -Destination "_Restoring_Legacy" -Force

# 3. Delete everything else
Write-Host "Deleting current project files..."
Get-ChildItem -Path . -Exclude "_Restoring_Legacy",".git",".gitignore","restore_legacy.ps1" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# 4. Move legacy contents to root
Write-Host "Restoring files..."
Get-ChildItem -Path "_Restoring_Legacy/*" | Move-Item -Destination . -Force

# 5. Cleanup
Remove-Item "_Restoring_Legacy" -Force

Write-Host "Restoration Complete. You are now using the Legacy V1 project."
