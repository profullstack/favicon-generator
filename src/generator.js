import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { DEFAULT_OPTIONS, BACKGROUNDS } from './constants.js';
import { fileExists, ensureDirectory, validateOptions, Logger } from './utils.js';

/**
 * Generate a single icon from SVG buffer
 * @param {Buffer} svgBuffer - SVG file buffer
 * @param {number} size - Icon size in pixels
 * @param {string} outputPath - Output file path
 * @param {Object} options - Generation options
 * @returns {Promise<void>}
 */
async function generateIcon(svgBuffer, size, outputPath, options) {
  const { quality, compressionLevel } = options;
  const needsSolidBackground = path.basename(outputPath).includes('icon-') && size >= 192;

  await sharp(svgBuffer)
    .resize(size, size, {
      fit: 'contain',
      background: needsSolidBackground ? BACKGROUNDS.white : BACKGROUNDS.transparent,
    })
    .png({
      quality,
      compressionLevel,
    })
    .toFile(outputPath);
}

/**
 * Generate favicon PNG files
 * @param {Buffer} svgBuffer - SVG file buffer
 * @param {string} outputDir - Output directory
 * @param {Array<number>} sizes - Favicon sizes to generate
 * @param {Object} options - Generation options
 * @returns {Promise<Array<string>>} Array of generated file paths
 */
async function generateFaviconSizes(svgBuffer, outputDir, sizes, options) {
  const { quality, compressionLevel } = options;
  const generatedFiles = [];

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `favicon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: BACKGROUNDS.transparent,
      })
      .png({
        quality,
        compressionLevel,
      })
      .toFile(outputPath);

    generatedFiles.push(outputPath);
  }

  return generatedFiles;
}

/**
 * Generate PNG icons from SVG
 * @param {Object} userOptions - User-provided options
 * @returns {Promise<Object>} Generation results
 */
export async function generateIcons(userOptions = {}) {
  // Merge user options with defaults
  const options = { ...DEFAULT_OPTIONS, ...userOptions };
  const logger = new Logger(options.verbose);

  try {
    // Validate options
    validateOptions(options);

    logger.info('🎨 Starting icon generation...');

    // Check if SVG file exists
    const svgExists = await fileExists(options.svgPath);
    if (!svgExists) {
      throw new Error(`SVG file not found: ${options.svgPath}`);
    }

    logger.log(`📖 Reading SVG from ${options.svgPath}`);

    // Read SVG file
    const svgBuffer = await fs.readFile(options.svgPath);

    // Create output directory
    await ensureDirectory(options.outputDir);
    logger.log(`📁 Created output directory: ${options.outputDir}`);

    const results = {
      icons: [],
      faviconSizes: [],
      outputDir: options.outputDir,
    };

    // Generate each icon size
    for (const { size, name } of options.iconSizes) {
      const outputPath = path.join(options.outputDir, name);

      await generateIcon(svgBuffer, size, outputPath, options);

      results.icons.push({
        size,
        name,
        path: outputPath,
      });

      logger.success(`Generated ${name} (${size}x${size})`);
    }

    // Generate favicon sizes if requested
    if (options.generateFavicon && options.faviconSizes?.length > 0) {
      const faviconFiles = await generateFaviconSizes(
        svgBuffer,
        options.outputDir,
        options.faviconSizes,
        options
      );

      results.faviconSizes = faviconFiles.map((filePath) => ({
        path: filePath,
        size: parseInt(path.basename(filePath).match(/\d+/)?.[0] || '0'),
      }));

      logger.success(`Generated ${faviconFiles.length} additional favicon sizes`);
    }

    logger.info(`\n🎉 Icon generation complete!`);
    logger.info(`📁 Generated ${results.icons.length} icons in ${options.outputDir}`);

    return results;
  } catch (error) {
    logger.error('❌ Error generating icons:', error.message);
    throw error;
  }
}

/**
 * Generate icons with custom sizes
 * @param {string} svgPath - Path to SVG file
 * @param {string} outputDir - Output directory
 * @param {Array<Object>} customSizes - Array of {size, name} objects
 * @param {Object} additionalOptions - Additional options
 * @returns {Promise<Object>} Generation results
 */
export async function generateCustomIcons(svgPath, outputDir, customSizes, additionalOptions = {}) {
  return generateIcons({
    svgPath,
    outputDir,
    iconSizes: customSizes,
    ...additionalOptions,
  });
}
