// This file was auto-generated by 'typesafe-i18n'. Any manual changes will be overwritten.
// @ts-check
/* eslint-disable */

/**
 * @typedef { import('./types.actual.js').Locales } Locales
 * @typedef { import('./types.actual.js').Translations } Translations
 */

import { initFormatters } from './formatters-template.actual'

import { loadedFormatters, loadedLocales, locales } from './util.actual'

const localeTranslationLoaders = {
	en: () => import('./en/index.js'),
}

/**
 * @param { Locales } locale
 * @param { Partial<Translations> } dictionary
 * @return { Translations }
 */
const updateDictionary = (locale, dictionary) =>
	loadedLocales[locale] = { ...loadedLocales[locale], ...dictionary }

/**
 * @param { Locales } locale
 * @return { Promise<void> }
 */
export const loadLocaleAsync = async (locale) => {
	updateDictionary(
		locale,
		/** @type { Translations } */ (/** @type { unknown } */ ((await localeTranslationLoaders[locale]()).default))
	)
	loadFormatters(locale)
}

export const loadAllLocalesAsync = () => Promise.all(locales.map(loadLocaleAsync))

/**
 * @param { Locales } locale
 * @return { void }
 */
export const loadFormatters = (locale) =>
	void (loadedFormatters[locale] = initFormatters(locale))
