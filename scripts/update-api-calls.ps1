## Script to update all frontend files to use apiUrl() from lib/apiClient.js
## Run: powershell -ExecutionPolicy Bypass -File scripts/update-api-calls.ps1

$root = "c:\Users\mayan\Documents\GitHub\SanjivniAI"
$files = @(
  "$root\app\page.js",
  "$root\app\dashboard\doctor\page.js",
  "$root\app\dashboard\hospital\page.js",
  "$root\app\dashboard\ambulance\page.js",
  "$root\components\RideBookingModal.jsx",
  "$root\components\ReferredDoctors.jsx",
  "$root\components\NearbyFacilities.jsx",
  "$root\components\DriverRideManager.jsx"
)

foreach ($file in $files) {
  $content = Get-Content $file -Raw

  # Replace fetch('/api/...') with fetch(apiUrl('/api/...'))
  $content = $content -replace "fetch\('/api/", "fetch(apiUrl('/api/"
  # Replace fetch(`/api/...`) with fetch(apiUrl(`/api/...`))
  $content = $content -replace 'fetch\(`/api/', 'fetch(apiUrl(`/api/'

  # Only add import if the file doesn't already have it
  if ($content -notmatch "from '@/lib/apiClient'") {
    # Insert after the first 'use client'; line or first import
    $content = $content -replace "('use client';)", "`$1`nimport { apiUrl } from '@/lib/apiClient';"
    # If no 'use client', insert after the first import line
    if ($content -notmatch "from '@/lib/apiClient'") {
      $content = "import { apiUrl } from '@/lib/apiClient';`n" + $content
    }
  }

  Set-Content $file $content -NoNewline
  Write-Host "Updated: $file"
}

Write-Host "Done!"
