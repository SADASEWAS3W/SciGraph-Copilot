import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.platform !== 'win32') process.exit(0)

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const venvRoot = path.join(repositoryRoot, '.venv')
const configPath = path.join(venvRoot, 'pyvenv.cfg')
const localPythonHome = path.join(venvRoot, '.base-python')
const localPython = path.join(localPythonHome, 'python.exe')

function isInside(parent, candidate) {
  const relative = path.relative(parent, candidate)
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
}

async function exists(candidate) {
  try {
    await fs.access(candidate)
    return true
  } catch {
    return false
  }
}

let config
try {
  config = await fs.readFile(configPath, 'utf8')
} catch {
  throw new Error('Project Python environment is missing. Run "uv sync --frozen", then retry.')
}

const homeMatch = config.match(/^home\s*=\s*(.+)$/m)
if (!homeMatch) {
  throw new Error('Project Python environment has no base runtime path. Run "uv sync --frozen", then retry.')
}

const configuredHome = path.resolve(homeMatch[1].trim())
if (configuredHome.toLowerCase() === localPythonHome.toLowerCase() && await exists(localPython)) {
  process.exit(0)
}

const sourcePython = path.join(configuredHome, 'python.exe')
if (!await exists(sourcePython)) {
  throw new Error(`Base Python is unavailable at "${configuredHome}". Run "uv sync --frozen" from an unrestricted terminal, then retry.`)
}

if (!isInside(venvRoot, localPythonHome)) {
  throw new Error('Refusing to localize Python outside the project virtual environment.')
}

await fs.rm(localPythonHome, { recursive: true, force: true })
try {
  await fs.cp(configuredHome, localPythonHome, { recursive: true, force: true })
  const localizedConfig = config.replace(/^home\s*=\s*.+$/m, `home = ${localPythonHome}`)
  await fs.writeFile(configPath, localizedConfig, 'utf8')
  console.log(`Localized Python runtime to ${localPythonHome}`)
} catch (error) {
  await fs.rm(localPythonHome, { recursive: true, force: true }).catch(() => {})
  throw error
}
