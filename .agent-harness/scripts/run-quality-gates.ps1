[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Push-Location $repoRoot
try {
  $required = @(
    'AGENTS.md',
    '.agent-harness/README.md',
    '.agent-harness/task-workflow-profiles.json',
    '.agent-harness/rules/architecture-rules.md',
    '.agent-harness/rules/coding-standards.md',
    '.agent-harness/rules/ai-provider-rules.md',
    '.agent-harness/rules/graph-data-contracts.md',
    '.agent-harness/rules/visualization-performance.md',
    '.agent-harness/workflows/bugfix.md',
    '.agent-harness/workflows/feature.md',
    '.agent-harness/workflows/indexing-change.md',
    '.agent-harness/workflows/visualization-change.md',
    '.agent-harness/workflows/agent-feature.md'
  )
  $missing = @($required | Where-Object { -not (Test-Path -LiteralPath (Join-Path $repoRoot $_)) })
  if ($missing.Count -gt 0) { throw "Missing harness files: $($missing -join ', ')" }
  $profiles = Get-Content -LiteralPath (Join-Path $repoRoot '.agent-harness/task-workflow-profiles.json') -Raw | ConvertFrom-Json
  if ($profiles.version -ne 1 -or -not $profiles.finalTestPolicy) { throw 'Invalid Agent Harness profile contract.' }
  Write-Host 'Agent Harness contract: OK'

  $forbidden = @('^\.env($|\.)', '^\.graphrag/', '^\.build-jobs/', '^\.nltk_data/', '^input/', '^output/', '^logs/', '^cache/', '\.log$')
  $violations = @(git ls-files | Where-Object {
    $path = $_
    @($forbidden | Where-Object { $path -match $_ }).Count -gt 0
  })
  if ($violations.Count -gt 0) { throw "Forbidden runtime or secret paths are tracked: $($violations -join ', ')" }
  Write-Host 'Branch hygiene: OK'
  pnpm typecheck
  if ($LASTEXITCODE -ne 0) { throw 'Typecheck failed.' }
  pnpm lint
  if ($LASTEXITCODE -ne 0) { throw 'Lint failed.' }
  pnpm build
  if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
  $uvCommand = Get-Command uv -ErrorAction SilentlyContinue
  $localUv = Join-Path $repoRoot '.venv\Scripts\uv.exe'
  if ($uvCommand) {
    & $uvCommand.Source lock --check
    if ($LASTEXITCODE -ne 0) { throw 'uv lock check failed.' }
  } elseif (Test-Path -LiteralPath $localUv) {
    & $localUv lock --check
    if ($LASTEXITCODE -ne 0) { throw 'uv lock check failed.' }
  } else {
    $python = Join-Path $repoRoot '.venv\Scripts\python.exe'
    if (-not (Test-Path -LiteralPath $python)) { $python = 'python' }
    & $python -c "import pathlib,tomllib; tomllib.loads(pathlib.Path('pyproject.toml').read_text('utf-8')); tomllib.loads(pathlib.Path('uv.lock').read_text('utf-8')); print('Python manifests: valid TOML (uv unavailable; consistency is enforced in CI)')"
    if ($LASTEXITCODE -ne 0) { throw 'Python manifest validation failed.' }
  }
  Write-Host 'Full quality gate: OK'
} finally {
  Pop-Location
}
