/**
 * @profullstack/favicon-generator
 * Generate PNG icons from SVG or PNG for iOS and PWA compatibility
 */

export { generateIcons, generateCustomIcons } from './generator.js';
export {
  DEFAULT_ICON_SIZES,
  DEFAULT_OPTIONS,
  BACKGROUNDS,
  SUPPORTED_INPUT_EXTENSIONS,
  DEFAULT_INPUT_CANDIDATES,
} from './constants.js';
export {
  fileExists,
  isSvgFile,
  isPngFile,
  isSupportedInputFile,
  getInputFormat,
  resolveInputPath,
  ensureDirectory,
  Logger,
  validateOptions,
  generateHtmlMetaTags,
  generateManifestJson,
  generateBrowserConfig,
  readPackageJson,
} from './utils.js';
