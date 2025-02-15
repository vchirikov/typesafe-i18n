import { build } from 'esbuild'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const watch = process.argv.includes('--watch')

//@ts-ignore
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const getPath = (file: string) => resolve(__dirname, file)

const formats = ['esm', 'cjs'] as const

formats.forEach((format) =>
	[false, true].forEach((minify) =>
		build({
			entryPoints: ['./src/index.mts'],
			bundle: true,
			outfile: getPath(`../../angular/index${minify ? '.min' : ''}.${format === 'esm' ? 'm' : 'c'}js`),
			platform: 'browser',
			format,
			sourcemap: watch,
			minify,
			watch,
			tsconfig: './tsconfig.json',
		}).catch(() => process.exit(1)),
	),
)
