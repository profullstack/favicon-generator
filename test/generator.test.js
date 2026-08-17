import { expect } from 'chai';
import { promises as fs } from 'fs';
import sharp from 'sharp';
import { generateIcons, generateCustomIcons } from '../src/generator.js';
import { fileExists } from '../src/utils.js';

describe('Generator', () => {
  const testSvgPath = './test/fixtures/test-icon.svg';
  const testPngPath = './test/fixtures/test-icon.png';
  const testSmallPngPath = './test/fixtures/test-icon-small.png';
  const testWidePngPath = './test/fixtures/test-icon-wide.png';
  const testOutputDir = './test/output';

  beforeEach(async () => {
    // Clean up test output directory before each test
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
  });

  afterEach(async () => {
    // Clean up test output directory after each test
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
  });

  describe('generateIcons', () => {
    it('should generate icons with default options', async () => {
      const options = {
        svgPath: testSvgPath,
        outputDir: testOutputDir,
        iconSizes: [
          { size: 64, name: 'icon-64.png' },
          { size: 128, name: 'icon-128.png' },
        ],
        generateFavicon: false,
        verbose: false,
      };

      const results = await generateIcons(options);

      expect(results).to.have.property('icons');
      expect(results).to.have.property('faviconSizes');
      expect(results).to.have.property('outputDir');
      expect(results.icons).to.have.lengthOf(2);
      expect(results.outputDir).to.equal(testOutputDir);

      // Verify files were created
      for (const icon of results.icons) {
        const exists = await fileExists(icon.path);
        expect(exists).to.be.true;
      }
    });

    it('should generate favicon sizes when requested', async () => {
      const options = {
        svgPath: testSvgPath,
        outputDir: testOutputDir,
        iconSizes: [{ size: 64, name: 'icon-64.png' }],
        generateFavicon: true,
        faviconSizes: [16, 32],
        verbose: false,
      };

      const results = await generateIcons(options);

      expect(results.faviconSizes).to.have.lengthOf(2);

      // Verify favicon files were created
      for (const favicon of results.faviconSizes) {
        const exists = await fileExists(favicon.path);
        expect(exists).to.be.true;
      }
    });

    it('should create output directory if it does not exist', async () => {
      const options = {
        svgPath: testSvgPath,
        outputDir: testOutputDir,
        iconSizes: [{ size: 64, name: 'icon-64.png' }],
        generateFavicon: false,
        verbose: false,
      };

      await generateIcons(options);

      const dirExists = await fileExists(testOutputDir);
      expect(dirExists).to.be.true;
    });

    it('should throw error if the source file does not exist', async () => {
      const options = {
        inputPath: './non-existent.svg',
        outputDir: testOutputDir,
        iconSizes: [{ size: 64, name: 'icon-64.png' }],
        verbose: false,
      };

      try {
        await generateIcons(options);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Input file not found');
      }
    });

    it('should throw error if a missing PNG source is given', async () => {
      const options = {
        inputPath: './non-existent.png',
        outputDir: testOutputDir,
        iconSizes: [{ size: 64, name: 'icon-64.png' }],
        verbose: false,
      };

      try {
        await generateIcons(options);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Input file not found');
      }
    });

    it('should throw error with an unsupported source format', async () => {
      const options = {
        inputPath: 'test.jpg', // Neither SVG nor PNG
        outputDir: testOutputDir,
        iconSizes: [{ size: 64, name: 'icon-64.png' }],
        verbose: false,
      };

      try {
        await generateIcons(options);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('must be an SVG or PNG file');
      }
    });

    it('should generate icons with custom quality settings', async () => {
      const options = {
        svgPath: testSvgPath,
        outputDir: testOutputDir,
        iconSizes: [{ size: 64, name: 'icon-64.png' }],
        quality: 80,
        compressionLevel: 5,
        generateFavicon: false,
        verbose: false,
      };

      const results = await generateIcons(options);

      expect(results.icons).to.have.lengthOf(1);
      const exists = await fileExists(results.icons[0].path);
      expect(exists).to.be.true;
    });

    it('should handle multiple icon sizes correctly', async () => {
      const options = {
        svgPath: testSvgPath,
        outputDir: testOutputDir,
        iconSizes: [
          { size: 32, name: 'icon-32.png' },
          { size: 64, name: 'icon-64.png' },
          { size: 128, name: 'icon-128.png' },
          { size: 256, name: 'icon-256.png' },
        ],
        generateFavicon: false,
        verbose: false,
      };

      const results = await generateIcons(options);

      expect(results.icons).to.have.lengthOf(4);

      // Verify all files exist and have correct sizes
      for (const icon of results.icons) {
        const exists = await fileExists(icon.path);
        expect(exists).to.be.true;
        expect(icon.size).to.be.a('number');
        expect(icon.name).to.be.a('string');
        // Path should include the output directory (with or without ./)
        expect(icon.path).to.match(/test\/output/);
      }
    });

    it('should generate root favicon files when requested', async () => {
      const options = {
        svgPath: testSvgPath,
        outputDir: testOutputDir,
        iconSizes: [{ size: 64, name: 'icon-64.png' }],
        generateFavicon: false,
        generateRootFavicons: true,
        faviconPngSize: 32,
        verbose: false,
      };

      const results = await generateIcons(options);

      expect(results).to.have.property('rootFavicons');
      expect(results.rootFavicons).to.have.property('png');
      expect(results.rootFavicons).to.have.property('svg');
      expect(results.rootFavicons).to.have.property('ico');

      // Verify favicon.png exists
      const pngExists = await fileExists(results.rootFavicons.png);
      expect(pngExists).to.be.true;
      expect(results.rootFavicons.png).to.include('favicon.png');

      // Verify favicon.svg exists
      const svgExists = await fileExists(results.rootFavicons.svg);
      expect(svgExists).to.be.true;
      expect(results.rootFavicons.svg).to.include('favicon.svg');

      // Verify favicon.ico exists
      const icoExists = await fileExists(results.rootFavicons.ico);
      expect(icoExists).to.be.true;
      expect(results.rootFavicons.ico).to.include('favicon.ico');
    });

    it('should not generate root favicons when disabled', async () => {
      const options = {
        svgPath: testSvgPath,
        outputDir: testOutputDir,
        iconSizes: [{ size: 64, name: 'icon-64.png' }],
        generateFavicon: false,
        generateRootFavicons: false,
        verbose: false,
      };

      const results = await generateIcons(options);

      expect(results).to.not.have.property('rootFavicons');
    });

    it('should generate root favicons with custom PNG size', async () => {
      const options = {
        svgPath: testSvgPath,
        outputDir: testOutputDir,
        iconSizes: [{ size: 64, name: 'icon-64.png' }],
        generateFavicon: false,
        generateRootFavicons: true,
        faviconPngSize: 48,
        verbose: false,
      };

      const results = await generateIcons(options);

      expect(results.rootFavicons).to.have.property('png');
      const pngExists = await fileExists(results.rootFavicons.png);
      expect(pngExists).to.be.true;

      // Read the PNG file to verify it was created
      const pngBuffer = await fs.readFile(results.rootFavicons.png);
      expect(pngBuffer.length).to.be.greaterThan(0);
    });

    it('should generate valid ICO file with multiple sizes', async () => {
      const options = {
        svgPath: testSvgPath,
        outputDir: testOutputDir,
        iconSizes: [{ size: 64, name: 'icon-64.png' }],
        generateFavicon: false,
        generateRootFavicons: true,
        verbose: false,
      };

      const results = await generateIcons(options);

      // Verify ICO file exists and has content
      const icoBuffer = await fs.readFile(results.rootFavicons.ico);
      expect(icoBuffer.length).to.be.greaterThan(0);

      // Verify ICO header (first 4 bytes should be: 0, 0, 1, 0)
      expect(icoBuffer[0]).to.equal(0); // Reserved
      expect(icoBuffer[1]).to.equal(0); // Reserved
      expect(icoBuffer[2]).to.equal(1); // Type (1 = ICO)
      expect(icoBuffer[3]).to.equal(0); // Type continuation
    });
  });

  describe('PNG source input', () => {
    it('should generate icons from a PNG source', async () => {
      const results = await generateIcons({
        inputPath: testPngPath,
        outputDir: testOutputDir,
        iconSizes: [
          { size: 64, name: 'icon-64.png' },
          { size: 128, name: 'icon-128.png' },
        ],
        generateFavicon: false,
        generateRootFavicons: false,
        verbose: false,
      });

      expect(results.icons).to.have.lengthOf(2);
      expect(results.inputFormat).to.equal('png');
      expect(results.inputPath).to.equal(testPngPath);

      for (const icon of results.icons) {
        expect(await fileExists(icon.path)).to.be.true;
      }
    });

    it('should produce icons at the requested pixel dimensions', async () => {
      const results = await generateIcons({
        inputPath: testPngPath,
        outputDir: testOutputDir,
        iconSizes: [
          { size: 48, name: 'icon-48.png' },
          { size: 180, name: 'apple-touch-icon-180x180.png' },
        ],
        generateFavicon: false,
        generateRootFavicons: false,
        verbose: false,
      });

      for (const icon of results.icons) {
        const metadata = await sharp(icon.path).metadata();
        expect(metadata.format).to.equal('png');
        expect(metadata.width).to.equal(icon.size);
        expect(metadata.height).to.equal(icon.size);
      }
    });

    it('should generate favicon sizes from a PNG source', async () => {
      const results = await generateIcons({
        inputPath: testPngPath,
        outputDir: testOutputDir,
        iconSizes: [{ size: 64, name: 'icon-64.png' }],
        generateFavicon: true,
        faviconSizes: [16, 32],
        generateRootFavicons: false,
        verbose: false,
      });

      expect(results.faviconSizes).to.have.lengthOf(2);
      for (const favicon of results.faviconSizes) {
        expect(await fileExists(favicon.path)).to.be.true;
        const metadata = await sharp(favicon.path).metadata();
        expect(metadata.width).to.equal(favicon.size);
      }
    });

    it('should generate favicon.png and favicon.ico but not favicon.svg', async () => {
      const results = await generateIcons({
        inputPath: testPngPath,
        outputDir: testOutputDir,
        iconSizes: [{ size: 64, name: 'icon-64.png' }],
        generateFavicon: false,
        generateRootFavicons: true,
        faviconPngSize: 32,
        verbose: false,
      });

      expect(results.rootFavicons).to.have.property('png');
      expect(results.rootFavicons).to.have.property('ico');
      expect(results.rootFavicons).to.not.have.property('svg');

      expect(await fileExists(results.rootFavicons.png)).to.be.true;
      expect(await fileExists(results.rootFavicons.ico)).to.be.true;
      // No stray favicon.svg containing PNG bytes
      expect(await fileExists(`${testOutputDir}/favicon.svg`)).to.be.false;
    });

    it('should write a valid ICO from a PNG source', async () => {
      const results = await generateIcons({
        inputPath: testPngPath,
        outputDir: testOutputDir,
        iconSizes: [{ size: 64, name: 'icon-64.png' }],
        generateFavicon: false,
        generateRootFavicons: true,
        verbose: false,
      });

      const icoBuffer = await fs.readFile(results.rootFavicons.ico);
      expect(icoBuffer.length).to.be.greaterThan(0);
      expect(icoBuffer[0]).to.equal(0);
      expect(icoBuffer[1]).to.equal(0);
      expect(icoBuffer[2]).to.equal(1);
      expect(icoBuffer[3]).to.equal(0);
    });

    it('should reference favicon.png in the generated meta tags', async () => {
      const results = await generateIcons({
        inputPath: testPngPath,
        outputDir: testOutputDir,
        iconSizes: [{ size: 180, name: 'apple-touch-icon-180x180.png' }],
        generateFavicon: false,
        generateRootFavicons: true,
        verbose: false,
      });

      const html = await fs.readFile(results.htmlFile, 'utf-8');
      expect(html).to.include('href="/favicon.png"');
      expect(html).to.not.include('href="/favicon.svg"');
    });

    it('should still reference favicon.svg for an SVG source', async () => {
      const results = await generateIcons({
        inputPath: testSvgPath,
        outputDir: testOutputDir,
        iconSizes: [{ size: 180, name: 'apple-touch-icon-180x180.png' }],
        generateFavicon: false,
        generateRootFavicons: true,
        verbose: false,
      });

      const html = await fs.readFile(results.htmlFile, 'utf-8');
      expect(html).to.include('href="/favicon.svg"');
      expect(results.rootFavicons).to.have.property('svg');
      expect(results.inputFormat).to.equal('svg');
    });

    it('should upscale a small PNG source rather than failing', async () => {
      const results = await generateIcons({
        inputPath: testSmallPngPath,
        outputDir: testOutputDir,
        iconSizes: [{ size: 512, name: 'icon-512x512.png' }],
        generateFavicon: false,
        generateRootFavicons: false,
        verbose: false,
      });

      const metadata = await sharp(results.icons[0].path).metadata();
      expect(metadata.width).to.equal(512);
      expect(metadata.height).to.equal(512);
    });

    it('should pad a non-square PNG source to square icons', async () => {
      const results = await generateIcons({
        inputPath: testWidePngPath,
        outputDir: testOutputDir,
        iconSizes: [{ size: 128, name: 'icon-128.png' }],
        generateFavicon: false,
        generateRootFavicons: false,
        verbose: false,
      });

      const metadata = await sharp(results.icons[0].path).metadata();
      expect(metadata.width).to.equal(128);
      expect(metadata.height).to.equal(128);
    });

    it('should give large PWA icons a solid background', async () => {
      const results = await generateIcons({
        inputPath: testPngPath,
        outputDir: testOutputDir,
        iconSizes: [{ size: 192, name: 'icon-192x192.png' }],
        generateFavicon: false,
        generateRootFavicons: false,
        verbose: false,
      });

      const metadata = await sharp(results.icons[0].path).metadata();
      expect(metadata.width).to.equal(192);
      expect(metadata.format).to.equal('png');
    });

    it('should accept a PNG through the legacy svgPath option', async () => {
      const results = await generateIcons({
        svgPath: testPngPath,
        outputDir: testOutputDir,
        iconSizes: [{ size: 64, name: 'icon-64.png' }],
        generateFavicon: false,
        generateRootFavicons: false,
        verbose: false,
      });

      expect(results.inputFormat).to.equal('png');
      expect(results.inputPath).to.equal(testPngPath);
      expect(await fileExists(results.icons[0].path)).to.be.true;
    });

    it('should accept an SVG through the legacy svgPath option', async () => {
      const results = await generateIcons({
        svgPath: testSvgPath,
        outputDir: testOutputDir,
        iconSizes: [{ size: 64, name: 'icon-64.png' }],
        generateFavicon: false,
        generateRootFavicons: false,
        verbose: false,
      });

      expect(results.inputFormat).to.equal('svg');
      expect(results.inputPath).to.equal(testSvgPath);
      expect(await fileExists(results.icons[0].path)).to.be.true;
    });

    it('should prefer inputPath when both options are supplied', async () => {
      const results = await generateIcons({
        inputPath: testPngPath,
        svgPath: testSvgPath,
        outputDir: testOutputDir,
        iconSizes: [{ size: 64, name: 'icon-64.png' }],
        generateFavicon: false,
        generateRootFavicons: false,
        verbose: false,
      });

      expect(results.inputFormat).to.equal('png');
      expect(results.inputPath).to.equal(testPngPath);
    });

    it('should generate the full default icon set from a PNG source', async () => {
      const { DEFAULT_ICON_SIZES } = await import('../src/constants.js');

      const results = await generateIcons({
        inputPath: testPngPath,
        outputDir: testOutputDir,
        generateFavicon: true,
        generateRootFavicons: true,
        verbose: false,
      });

      expect(results.icons).to.have.lengthOf(DEFAULT_ICON_SIZES.length);
      for (const icon of results.icons) {
        expect(await fileExists(icon.path)).to.be.true;
      }
      expect(await fileExists(results.manifestFile)).to.be.true;
      expect(await fileExists(results.browserConfigFile)).to.be.true;
    });
  });

  describe('generateCustomIcons', () => {
    it('should generate icons with custom sizes', async () => {
      const customSizes = [
        { size: 48, name: 'custom-48.png' },
        { size: 96, name: 'custom-96.png' },
      ];

      const results = await generateCustomIcons(testSvgPath, testOutputDir, customSizes, {
        verbose: false,
      });

      expect(results.icons).to.have.lengthOf(2);
      expect(results.icons[0].name).to.equal('custom-48.png');
      expect(results.icons[1].name).to.equal('custom-96.png');

      // Verify files were created
      for (const icon of results.icons) {
        const exists = await fileExists(icon.path);
        expect(exists).to.be.true;
      }
    });

    it('should generate icons from a PNG source', async () => {
      const customSizes = [
        { size: 48, name: 'custom-48.png' },
        { size: 96, name: 'custom-96.png' },
      ];

      const results = await generateCustomIcons(testPngPath, testOutputDir, customSizes, {
        verbose: false,
      });

      expect(results.inputFormat).to.equal('png');
      expect(results.icons).to.have.lengthOf(2);
      for (const icon of results.icons) {
        expect(await fileExists(icon.path)).to.be.true;
      }
    });

    it('should accept additional options', async () => {
      const customSizes = [{ size: 64, name: 'custom-64.png' }];

      const results = await generateCustomIcons(testSvgPath, testOutputDir, customSizes, {
        quality: 90,
        compressionLevel: 7,
        verbose: false,
      });

      expect(results.icons).to.have.lengthOf(1);
      const exists = await fileExists(results.icons[0].path);
      expect(exists).to.be.true;
    });
  });
});
