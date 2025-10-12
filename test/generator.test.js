import { expect } from 'chai';
import { promises as fs } from 'fs';
import { generateIcons, generateCustomIcons } from '../src/generator.js';
import { fileExists } from '../src/utils.js';

describe('Generator', () => {
  const testSvgPath = './test/fixtures/test-icon.svg';
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

    it('should throw error if SVG file does not exist', async () => {
      const options = {
        svgPath: './non-existent.svg',
        outputDir: testOutputDir,
        iconSizes: [{ size: 64, name: 'icon-64.png' }],
        verbose: false,
      };

      try {
        await generateIcons(options);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('SVG file not found');
      }
    });

    it('should throw error with invalid options', async () => {
      const options = {
        svgPath: 'test.png', // Not an SVG
        outputDir: testOutputDir,
        iconSizes: [{ size: 64, name: 'icon-64.png' }],
        verbose: false,
      };

      try {
        await generateIcons(options);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('must be an SVG file');
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
