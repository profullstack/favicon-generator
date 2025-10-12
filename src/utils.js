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

/**
 * Find package.json by searching up the directory tree
 * @param {string} startDir - Starting directory (default: process.cwd())
 * @returns {Promise<Object|null>} Parsed package.json or null if not found
 */
export async function readPackageJson(startDir = process.cwd()) {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  // Search up the directory tree
  while (currentDir !== root) {
    const packagePath = path.join(currentDir, 'package.json');
    const exists = await fileExists(packagePath);
    
    if (exists) {
      try {
        const content = await fs.readFile(packagePath, 'utf-8');
        const pkg = JSON.parse(content);
        
        // Skip if this is the favicon-generator's own package.json
        if (pkg.name === '@profullstack/favicon-generator') {
          currentDir = path.dirname(currentDir);
          continue;
        }
        
        return pkg;
      } catch (error) {
        // Continue searching if parse fails
        currentDir = path.dirname(currentDir);
        continue;
      }
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}


/**
 * Generate HTML meta tags for icons
 * @param {Object} results - Generation results from generateIcons
 * @param {string} baseUrl - Base URL for icon paths (default: '/icons')
 * @returns {string} HTML meta tags
 */
export function generateHtmlMetaTags(results, baseUrl = '/icons') {
  const lines = [];
  
  lines.push('<!-- Favicon -->');
  lines.push('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />');
  
  // Add favicon sizes
  if (results.faviconSizes?.length > 0) {
    for (const { size } of results.faviconSizes.sort((a, b) => b.size - a.size)) {
      lines.push(`<link rel="icon" type="image/png" sizes="${size}x${size}" href="${baseUrl}/favicon-${size}.png" />`);
    }
  }
  
  lines.push('');
  lines.push('<!-- Apple Touch Icons (iOS) -->');
  
  // Add Apple Touch Icons
  const appleIcons = results.icons
    .filter(({ name }) => name.startsWith('apple-touch-icon'))
    .sort((a, b) => b.size - a.size);
  
  for (const { size, name } of appleIcons) {
    lines.push(`<link rel="apple-touch-icon" sizes="${size}x${size}" href="${baseUrl}/${name}" />`);
  }
  
  lines.push('');
  lines.push('<!-- Web App Manifest (PWA) -->');
  lines.push('<link rel="manifest" href="/manifest.json" />');
  
  lines.push('');
  lines.push('<!-- Theme Color (for browser chrome) -->');
  lines.push('<meta name="theme-color" content="#ffffff" />');
  
  lines.push('');
  lines.push('<!-- iOS Web App -->');
  lines.push('<meta name="apple-mobile-web-app-capable" content="yes" />');
  lines.push('<meta name="apple-mobile-web-app-status-bar-style" content="default" />');
  lines.push('<meta name="apple-mobile-web-app-title" content="Your App" />');
  
  lines.push('');
  lines.push('<!-- Android -->');
  lines.push('<meta name="mobile-web-app-capable" content="yes" />');
  
  lines.push('');
  lines.push('<!-- Windows -->');
  lines.push('<meta name="msapplication-TileColor" content="#ffffff" />');
  lines.push('<meta name="msapplication-config" content="/browserconfig.xml" />');
  
  // Find 144x144 icon for Windows tile
  const tile144 = results.icons.find(({ size }) => size === 144);
  if (tile144) {
    lines.push(`<meta name="msapplication-TileImage" content="${baseUrl}/${tile144.name}" />`);
  }
  
  return lines.join('\n');
}

/**
 * Generate manifest.json content for PWA
 * @param {Object} results - Generation results from generateIcons
 * @param {Object} options - Manifest options
 * @returns {string} JSON string for manifest.json
 */
export function generateManifestJson(results, options = {}) {
  const {
    name = 'Your App Name',
    shortName = 'App',
    description = 'Your app description',
    startUrl = '/',
    display = 'standalone',
    backgroundColor = '#ffffff',
    themeColor = '#ffffff',
    orientation = 'portrait-primary',
    baseUrl = '/icons',
  } = options;
  
  // Get PWA icons (192, 256, 384, 512)
  const pwaIcons = results.icons
    .filter(({ name }) => name.startsWith('icon-') && !name.includes('apple'))
    .map(({ size, name }) => ({
      src: `${baseUrl}/${name}`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: size === 192 || size === 512 ? 'any maskable' : 'any',
    }))
    .sort((a, b) => {
      const sizeA = parseInt(a.sizes);
      const sizeB = parseInt(b.sizes);
      return sizeA - sizeB;
    });
  
  const manifest = {
    name,
    short_name: shortName,
    description,
    start_url: startUrl,
    display,
    background_color: backgroundColor,
    theme_color: themeColor,
    orientation,
    icons: pwaIcons,
  };
  
  return JSON.stringify(manifest, null, 2);
}


/**
 * Generate browserconfig.xml for Microsoft Windows tiles
 * @param {Object} results - Generation results from generateIcons
 * @param {Object} options - Browserconfig options
 * @returns {string} XML string for browserconfig.xml
 */
export function generateBrowserConfig(results, options = {}) {
  const { tileColor = '#ffffff', baseUrl = '/icons' } = options;

  // Find the 144x144 icon for the tile
  const tile144 = results.icons.find(({ size }) => size === 144);
  const tile70 = results.icons.find(({ size }) => size === 70);
  const tile150 = results.icons.find(({ size }) => size === 150);
  const tile310x150 = results.icons.find(({ size }) => size === 310 && name.includes('310x150'));
  const tile310 = results.icons.find(({ size }) => size === 310);

  const lines = [];
  lines.push('<?xml version="1.0" encoding="utf-8"?>');
  lines.push('<browserconfig>');
  lines.push('  <msapplication>');
  lines.push('    <tile>');

  if (tile70) {
    lines.push(`      <square70x70logo src="${baseUrl}/${tile70.name}"/>`);
  }
  if (tile144) {
    lines.push(`      <square150x150logo src="${baseUrl}/${tile144.name}"/>`);
  }
  if (tile150) {
    lines.push(`      <square150x150logo src="${baseUrl}/${tile150.name}"/>`);
  }
  if (tile310x150) {
    lines.push(`      <wide310x150logo src="${baseUrl}/${tile310x150.name}"/>`);
  }
  if (tile310) {
    lines.push(`      <square310x310logo src="${baseUrl}/${tile310.name}"/>`);
  }

  lines.push(`      <TileColor>${tileColor}</TileColor>`);
  lines.push('    </tile>');
  lines.push('  </msapplication>');
  lines.push('</browserconfig>');

  return lines.join('\n');
}
