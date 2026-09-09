[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$subject = git -C $repoRoot log -1 --pretty=%s
if ($LASTEXITCODE -ne 0) { throw 'Unable to read the latest commit.' }
if ($subject -notmatch '^(feat|fix|perf|refactor|test|docs|chore|build|ci)(\([a-z0-9-]+\))?!?: .+') {
  throw "Latest commit does not follow Conventional Commits: $subject"
}
Write-Host 'Commit convention: OK'
