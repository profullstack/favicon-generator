/**
 * @profullstack/favicon-generator
 * Generate PNG icons from SVG for iOS and PWA compatibility
 */

export { generateIcons, generateCustomIcons } from './generator.js';
export { DEFAULT_ICON_SIZES, DEFAULT_OPTIONS, BACKGROUNDS } from './constants.js';
export { fileExists, isSvgFile, ensureDirectory, Logger, validateOptions } from './utils.js';
