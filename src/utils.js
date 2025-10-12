import { promises as fs } from 'fs';
import path from 'path';

/**
 * Validate if a file exists
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} True if file exists
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate if a path is an SVG file
 * @param {string} filePath - Path to check
 * @returns {boolean} True if path ends with .svg
 */
export function isSvgFile(filePath) {
  return path.extname(filePath).toLowerCase() === '.svg';
}

/**
 * Create directory if it doesn't exist
 * @param {string} dirPath - Directory path to create
 * @returns {Promise<void>}
 */
export async function ensureDirectory(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Logger utility with optional verbose mode
 */
export class Logger {
  constructor(verbose = true) {
    this.verbose = verbose;
  }

  log(message, ...args) {
    if (this.verbose) {
      console.log(message, ...args);
    }
  }

  error(message, ...args) {
    console.error(message, ...args);
  }

  success(message, ...args) {
    if (this.verbose) {
      console.log(`✅ ${message}`, ...args);
    }
  }

  info(message, ...args) {
    if (this.verbose) {
      console.log(`ℹ️  ${message}`, ...args);
    }
  }

  warn(message, ...args) {
    if (this.verbose) {
      console.warn(`⚠️  ${message}`, ...args);
    }
  }
}

/**
 * Validate options object
 * @param {Object} options - Options to validate
 * @throws {Error} If options are invalid
 */
export function validateOptions(options) {
  if (!options.svgPath) {
    throw new Error('svgPath is required');
  }

  if (!isSvgFile(options.svgPath)) {
    throw new Error('svgPath must be an SVG file');
  }

  if (!options.outputDir) {
    throw new Error('outputDir is required');
  }

  if (!Array.isArray(options.iconSizes) || options.iconSizes.length === 0) {
    throw new Error('iconSizes must be a non-empty array');
  }

  for (const icon of options.iconSizes) {
    if (!icon.size || typeof icon.size !== 'number' || icon.size <= 0) {
      throw new Error('Each icon must have a valid positive size');
    }
    if (!icon.name || typeof icon.name !== 'string') {
      throw new Error('Each icon must have a valid name');
    }
  }

  if (typeof options.quality !== 'number' || options.quality < 1 || options.quality > 100) {
    throw new Error('quality must be a number between 1 and 100');
  }

  if (
    typeof options.compressionLevel !== 'number' ||
    options.compressionLevel < 0 ||
    options.compressionLevel > 9
  ) {
    throw new Error('compressionLevel must be a number between 0 and 9');
  }
}
