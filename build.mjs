/**
 * Build both halves of dsh-oauth-github.
 *
 * Host half: TypeScript bundled to ESM (`lib/index.js`), Node builtins external.
 * Client half: TypeScript/TSX bundled to CommonJS and wrapped in the harness
 * client-module registration (`window.__ModuleLoader__.load`).
 *
 * Usage: `npm run build`
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(await readFile(join(here, 'package.json'), 'utf8'))

await mkdir(join(here, 'lib'), { recursive: true })

await build({
  entryPoints: [join(here, 'src/index.ts')],
  outfile: join(here, 'lib/index.js'),
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node24',
  packages: 'external',
  legalComments: 'none',
  logLevel: 'warning',
  charset: 'utf8',
})

/** Modules the harness shell already shares with every client bundle. */
const PLATFORM_MODULES = ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client']

const client = await build({
  entryPoints: [join(here, 'src/client/index.tsx')],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  external: PLATFORM_MODULES,
  legalComments: 'none',
  logLevel: 'warning',
  charset: 'utf8',
})

const body = client.outputFiles[0].text
const indented = body.split('\n').map((line) => (line === '' ? '' : `\t\t${line}`)).join('\n')
const artifact = `window.__ModuleLoader__.load({\n\tid: ${JSON.stringify(pkg.name)},\n\tfactory: (require) => {\n\t\tvar module = { exports: {} };\n\t\tvar exports = module.exports;\n\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });\n${indented}\n\t\treturn module.exports;\n\t}\n});\n`

await writeFile(join(here, 'lib/client.js'), artifact)
console.log(`built lib/index.js and lib/client.js (${artifact.length} bytes) for ${pkg.name}`)
