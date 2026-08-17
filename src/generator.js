import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { DEFAULT_OPTIONS, BACKGROUNDS } from './constants.js';
import {
  fileExists,
  ensureDirectory,
  validateOptions,
  Logger,
  generateHtmlMetaTags,
  generateManifestJson,
  generateBrowserConfig,
  readPackageJson,
  getInputFormat,
  resolveInputPath,
} from './utils.js';

/**
 * Generate a single icon from a source image buffer
 * @param {Buffer} sourceBuffer - Source image buffer (SVG or PNG)
 * @param {number} size - Icon size in pixels
 * @param {string} outputPath - Output file path
 * @param {Object} options - Generation options
 * @returns {Promise<void>}
 */
async function generateIcon(sourceBuffer, size, outputPath, options) {
  const { quality, compressionLevel } = options;
  const needsSolidBackground = path.basename(outputPath).includes('icon-') && size >= 192;

  await sharp(sourceBuffer)
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
 * @param {Buffer} sourceBuffer - Source image buffer (SVG or PNG)
 * @param {string} outputDir - Output directory
 * @param {Array<number>} sizes - Favicon sizes to generate
 * @param {Object} options - Generation options
 * @returns {Promise<Array<string>>} Array of generated file paths
 */
async function generateFaviconSizes(sourceBuffer, outputDir, sizes, options) {
  const { quality, compressionLevel } = options;
  const generatedFiles = [];

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `favicon-${size}.png`);
    await sharp(sourceBuffer)
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
 * Generate root favicon files (favicon.png, favicon.ico, and favicon.svg for SVG sources)
 * @param {Buffer} sourceBuffer - Source image buffer (SVG or PNG)
 * @param {string} outputDir - Output directory
 * @param {Object} options - Generation options
 * @param {'svg'|'png'} inputFormat - Format of the source buffer
 * @returns {Promise<Object>} Object with paths to generated files
 */
async function generateRootFavicons(sourceBuffer, outputDir, options, inputFormat = 'svg') {
  const { quality, compressionLevel, faviconPngSize } = options;
  const generatedFiles = {};

  // Generate favicon.png
  const pngPath = path.join(outputDir, 'favicon.png');
  await sharp(sourceBuffer)
    .resize(faviconPngSize, faviconPngSize, {
      fit: 'contain',
      background: BACKGROUNDS.transparent,
    })
    .png({
      quality,
      compressionLevel,
    })
    .toFile(pngPath);
  generatedFiles.png = pngPath;

  // Copy the source SVG as favicon.svg. A PNG source has no vector equivalent,
  // so favicon.png above is the scalable-slot replacement.
  if (inputFormat === 'svg') {
    const svgPath = path.join(outputDir, 'favicon.svg');
    await fs.writeFile(svgPath, sourceBuffer);
    generatedFiles.svg = svgPath;
  }

  // Generate favicon.ico (multi-size ICO with 16x16 and 32x32)
  const icoPath = path.join(outputDir, 'favicon.ico');
  const sizes = [16, 32];
  const pngBuffers = await Promise.all(
    sizes.map((size) =>
      sharp(sourceBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: BACKGROUNDS.transparent,
        })
        .png({
          quality,
          compressionLevel,
        })
        .toBuffer()
    )
  );

  // Create ICO file manually (simple ICO format)
  const icoBuffer = createIcoBuffer(pngBuffers, sizes);
  await fs.writeFile(icoPath, icoBuffer);
  generatedFiles.ico = icoPath;

  return generatedFiles;
}

/**
 * Create ICO buffer from PNG buffers
 * @param {Array<Buffer>} pngBuffers - Array of PNG buffers
 * @param {Array<number>} sizes - Array of sizes corresponding to PNG buffers
 * @returns {Buffer} ICO file buffer
 */
function createIcoBuffer(pngBuffers, sizes) {
  // ICO header: 6 bytes
  const iconCount = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = headerSize + dirEntrySize * iconCount;

  // Calculate total size
  let totalSize = dirSize;
  const imageOffsets = [];
  for (const buffer of pngBuffers) {
    imageOffsets.push(totalSize);
    totalSize += buffer.length;
  }

  const icoBuffer = Buffer.alloc(totalSize);
  let offset = 0;

  // Write ICO header
  icoBuffer.writeUInt16LE(0, offset); // Reserved (must be 0)
  offset += 2;
  icoBuffer.writeUInt16LE(1, offset); // Type (1 = ICO)
  offset += 2;
  icoBuffer.writeUInt16LE(iconCount, offset); // Number of images
  offset += 2;

  // Write directory entries
  for (let i = 0; i < iconCount; i++) {
    const size = sizes[i];
    const imageSize = pngBuffers[i].length;
    const imageOffset = imageOffsets[i];

    icoBuffer.writeUInt8(size === 256 ? 0 : size, offset); // Width (0 means 256)
    offset += 1;
    icoBuffer.writeUInt8(size === 256 ? 0 : size, offset); // Height (0 means 256)
    offset += 1;
    icoBuffer.writeUInt8(0, offset); // Color palette (0 = no palette)
    offset += 1;
    icoBuffer.writeUInt8(0, offset); // Reserved (must be 0)
    offset += 1;
    icoBuffer.writeUInt16LE(1, offset); // Color planes (1)
    offset += 2;
    icoBuffer.writeUInt16LE(32, offset); // Bits per pixel (32 for PNG)
    offset += 2;
    icoBuffer.writeUInt32LE(imageSize, offset); // Image size in bytes
    offset += 4;
    icoBuffer.writeUInt32LE(imageOffset, offset); // Image offset
    offset += 4;
  }

  // Write image data
  for (const buffer of pngBuffers) {
    buffer.copy(icoBuffer, offset);
    offset += buffer.length;
  }

  return icoBuffer;
}

/**
 * Warn when a raster source is smaller than the largest icon being generated
 * @param {Buffer} sourceBuffer - Source PNG buffer
 * @param {Object} options - Generation options
 * @param {Logger} logger - Logger instance
 * @returns {Promise<void>}
 */
async function warnIfUpscaling(sourceBuffer, options, logger) {
  let metadata;
  try {
    metadata = await sharp(sourceBuffer).metadata();
  } catch {
    // Metadata is advisory only; sharp will surface real decode errors later.
    return;
  }

  const sourceEdge = Math.min(metadata.width ?? 0, metadata.height ?? 0);
  if (!sourceEdge) return;

  const largest = Math.max(...options.iconSizes.map(({ size }) => size));
  if (sourceEdge < largest) {
    logger.warn(
      `Source PNG is ${metadata.width}x${metadata.height}; icons up to ${largest}x${largest} ` +
        `will be upscaled and may look soft. Supply a source of at least ${largest}x${largest}.`
    );
  }

  if (metadata.width !== metadata.height) {
    logger.warn(
      `Source PNG is not square (${metadata.width}x${metadata.height}); icons will be padded to fit.`
    );
  }
}

/**
 * Generate PNG icons from an SVG or PNG source
 * @param {Object} userOptions - User-provided options
 * @returns {Promise<Object>} Generation results
 */
export async function generateIcons(userOptions = {}) {
  // Merge user options with defaults. A caller-supplied path — under either the
  // canonical `inputPath` or the legacy `svgPath` alias — must beat the default
  // `inputPath`, which would otherwise shadow an explicit `svgPath`.
  const options = { ...DEFAULT_OPTIONS, ...userOptions };
  const suppliedPath = resolveInputPath(userOptions);
  if (suppliedPath) {
    options.inputPath = suppliedPath;
  }

  const logger = new Logger(options.verbose);

  try {
    // Validate options
    validateOptions(options);

    logger.info('🎨 Starting icon generation...');

    const inputPath = resolveInputPath(options);
    const inputFormat = getInputFormat(inputPath);

    // Check if the source file exists
    const inputExists = await fileExists(inputPath);
    if (!inputExists) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    logger.log(`📖 Reading ${inputFormat.toUpperCase()} from ${inputPath}`);

    // Read source file
    const sourceBuffer = await fs.readFile(inputPath);

    // A raster source can only be upscaled with quality loss — warn rather than
    // silently emitting blurry large icons.
    if (inputFormat === 'png') {
      await warnIfUpscaling(sourceBuffer, options, logger);
    }

    // Create output directory
    await ensureDirectory(options.outputDir);
    logger.log(`📁 Created output directory: ${options.outputDir}`);

    const results = {
      icons: [],
      faviconSizes: [],
      outputDir: options.outputDir,
      inputPath,
      inputFormat,
    };

    // Generate each icon size
    for (const { size, name } of options.iconSizes) {
      const outputPath = path.join(options.outputDir, name);

      await generateIcon(sourceBuffer, size, outputPath, options);

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
        sourceBuffer,
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

    // Generate root favicon files if requested
    if (options.generateRootFavicons) {
      const rootFavicons = await generateRootFavicons(
        sourceBuffer,
        options.outputDir,
        options,
        inputFormat
      );

      results.rootFavicons = rootFavicons;

      logger.success(
        `Generated ${Object.keys(rootFavicons)
          .map((key) => `favicon.${key}`)
          .join(', ')}`
      );
    }

    // Read package.json for app metadata
    const packageJson = await readPackageJson();
    const appName = packageJson?.name || 'Your App Name';
    const appDescription = packageJson?.description || 'Your app description';

    if (packageJson) {
      logger.log(`📦 Using package.json: ${appName}`);
    } else {
      logger.log('📦 No package.json found, using default values');
    }

    // Generate and write HTML meta tags file
    const htmlMetaTags = generateHtmlMetaTags(results, '/icons');
    const htmlFilePath = path.join(options.outputDir, 'meta-tags.html');
    await fs.writeFile(htmlFilePath, htmlMetaTags, 'utf-8');
    results.htmlFile = htmlFilePath;
    logger.success('Generated meta-tags.html');

    // Generate and write manifest.json file
    const manifestJson = generateManifestJson(results, {
      name: appName,
      description: appDescription,
      baseUrl: '/icons',
    });
    const manifestFilePath = path.join(options.outputDir, 'manifest.json');
    await fs.writeFile(manifestFilePath, manifestJson, 'utf-8');
    results.manifestFile = manifestFilePath;
    logger.success('Generated manifest.json');

    // Generate and write browserconfig.xml file
    const browserConfig = generateBrowserConfig(results, {
      tileColor: '#ffffff',
      baseUrl: '/icons',
    });
    const browserConfigPath = path.join(options.outputDir, 'browserconfig.xml');
    await fs.writeFile(browserConfigPath, browserConfig, 'utf-8');
    results.browserConfigFile = browserConfigPath;
    logger.success('Generated browserconfig.xml');

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
 * @param {string} inputPath - Path to the source SVG or PNG file
 * @param {string} outputDir - Output directory
 * @param {Array<Object>} customSizes - Array of {size, name} objects
 * @param {Object} additionalOptions - Additional options
 * @returns {Promise<Object>} Generation results
 */
export async function generateCustomIcons(
  inputPath,
  outputDir,
  customSizes,
  additionalOptions = {}
) {
  return generateIcons({
    inputPath,
    outputDir,
    iconSizes: customSizes,
    ...additionalOptions,
  });
}
