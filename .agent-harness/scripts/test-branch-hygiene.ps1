[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Push-Location $repoRoot
try {
  $forbidden = @(
    '^\.env($|\.)',
    '^\.graphrag/',
    '^\.build-jobs/',
    '^\.nltk_data/',
    '^input/',
    '^output/',
    '^logs/',
    '^cache/',
    '\.log$'
  )
  $tracked = @(git ls-files)
  $violations = @($tracked | Where-Object {
    $path = $_
    @($forbidden | Where-Object { $path -match $_ }).Count -gt 0
  })
  if ($violations.Count -gt 0) { throw "Forbidden runtime or secret paths are tracked: $($violations -join ', ')" }
  Write-Host 'Branch hygiene: OK'
} finally {
  Pop-Location
}
