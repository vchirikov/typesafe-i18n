import * as ts from 'typescript'
import fs from 'fs'
import path, { join, resolve } from 'path'
import type { LangaugeBaseTranslation } from '../core/core'
import type { GeneratorConfig, GeneratorConfigWithDefaultValues } from './generator'
import { copyFile, createPathIfNotExits, deleteFolderRecursive, getFiles, importFile } from './file-utils'
import { generate, setDefaultConfigValuesIfMissing } from './generator'
import { logger } from './generator-util'

const getAllLanguages = async (path: string) => {
	const files = await getFiles(path, 1)
	return files.filter(({ folder, name }) => folder && name === 'index.ts').map(({ folder }) => folder)
}

const transpileTypescriptAndPrepareImportFile = async (languageFilePath: string, tempPath: string): Promise<string> => {
	const program = ts.createProgram([languageFilePath], { outDir: tempPath })
	program.emit()

	const compiledPath = resolve(tempPath, 'index.js')
	const copyPath = resolve(tempPath, `langauge-temp-${debounceCounter}.js`)

	const copySuccess = await copyFile(compiledPath, copyPath)
	if (!copySuccess) {
		logger.error('something went wrong')
		return ''
	}

	return copyPath
}

const parseLanguageFile = async (
	outputPath: string,
	locale: string,
	tempPath: string,
): Promise<LangaugeBaseTranslation | null> => {
	const originalPath = resolve(outputPath, locale, 'index.ts')

	await createPathIfNotExits(tempPath)

	const importPath = await transpileTypescriptAndPrepareImportFile(originalPath, tempPath)
	if (!importPath) {
		return null
	}

	const languageImport = await importFile<LangaugeBaseTranslation>(importPath)

	await deleteFolderRecursive(tempPath)

	if (!languageImport) {
		logger.error(`could not read default export from language file '${locale}'`)
		return null
	}

	return languageImport
}

const parseAndGenerate = async (config: GeneratorConfigWithDefaultValues) => {
	logger.info(`watcher detected changes in baseLocale file`)

	const { baseLocale, locales: localesToUse, tempPath, outputPath } = config

	const locales = (await getAllLanguages(outputPath)).filter(
		(locale) => !localesToUse.length || localesToUse.includes(locale),
	)
	const locale = locales.find((l) => l === baseLocale) || locales[0] || baseLocale

	if (!locales.length) {
		locales.push(baseLocale)
	}

	const languageFile = (locale && (await parseLanguageFile(outputPath, locale, tempPath))) || {}

	await generate(languageFile, { ...config, baseLocale: locale, locales }, logger)
}

let debounceCounter = 0

const debonce = (callback: () => void) =>
	setTimeout(
		(i) => {
			i === debounceCounter && callback()
		},
		100,
		++debounceCounter,
	)

export const startWatcher = async (config?: GeneratorConfig): Promise<void> => {
	if (!config) {
		config = (await importFile<GeneratorConfig>(path.resolve('.langauge.json'), false)) || {}
	}

	const configWithDefaultValues = setDefaultConfigValuesIfMissing(config)
	const { outputPath, tsVersion } = configWithDefaultValues

	const onChange = parseAndGenerate.bind(null, configWithDefaultValues)

	await createPathIfNotExits(outputPath)

	const baseLocalePath = join(outputPath, configWithDefaultValues.baseLocale)

	await createPathIfNotExits(baseLocalePath)

	fs.watch(baseLocalePath, { recursive: true }, () => debonce(onChange))

	logger.info(`generating files for typescript version: '${tsVersion}.x'`)
	logger.info(`watcher started in: '${baseLocalePath}'`)

	onChange()
}
