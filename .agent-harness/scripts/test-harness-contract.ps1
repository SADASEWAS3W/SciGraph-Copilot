[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
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

$profilePath = Join-Path $repoRoot '.agent-harness/task-workflow-profiles.json'
$profiles = Get-Content -LiteralPath $profilePath -Raw | ConvertFrom-Json
if ($profiles.version -ne 1) { throw 'Unsupported task workflow profile version.' }
if (-not $profiles.finalTestPolicy) { throw 'finalTestPolicy is required.' }
if (-not $profiles.profiles.'indexing-change' -or -not $profiles.profiles.'agent-feature') {
  throw 'Required indexing-change and agent-feature profiles are missing.'
}

Write-Host 'Agent Harness contract: OK'
