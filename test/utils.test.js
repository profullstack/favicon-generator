import { expect } from 'chai';
import { promises as fs } from 'fs';
import path from 'path';
import {
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
} from '../src/utils.js';
import { DEFAULT_OPTIONS, SUPPORTED_INPUT_EXTENSIONS } from '../src/constants.js';

describe('Utils', () => {
  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const result = await fileExists('./package.json');
      expect(result).to.be.true;
    });

    it('should return false for non-existing file', async () => {
      const result = await fileExists('./non-existent-file.txt');
      expect(result).to.be.false;
    });
  });

  describe('isSvgFile', () => {
    it('should return true for .svg files', () => {
      expect(isSvgFile('favicon.svg')).to.be.true;
      expect(isSvgFile('/path/to/icon.svg')).to.be.true;
      expect(isSvgFile('./test.SVG')).to.be.true;
    });

    it('should return false for non-svg files', () => {
      expect(isSvgFile('favicon.png')).to.be.false;
      expect(isSvgFile('test.jpg')).to.be.false;
      expect(isSvgFile('file.txt')).to.be.false;
    });
  });

  describe('isPngFile', () => {
    it('should return true for .png files', () => {
      expect(isPngFile('favicon.png')).to.be.true;
      expect(isPngFile('/path/to/logo.png')).to.be.true;
      expect(isPngFile('./test.PNG')).to.be.true;
    });

    it('should return false for non-png files', () => {
      expect(isPngFile('favicon.svg')).to.be.false;
      expect(isPngFile('test.jpg')).to.be.false;
      expect(isPngFile('file.txt')).to.be.false;
    });
  });

  describe('isSupportedInputFile', () => {
    it('should accept svg and png sources', () => {
      expect(isSupportedInputFile('logo.svg')).to.be.true;
      expect(isSupportedInputFile('logo.png')).to.be.true;
      expect(isSupportedInputFile('./nested/dir/LOGO.PNG')).to.be.true;
    });

    it('should reject other formats', () => {
      expect(isSupportedInputFile('logo.jpg')).to.be.false;
      expect(isSupportedInputFile('logo.webp')).to.be.false;
      expect(isSupportedInputFile('logo')).to.be.false;
    });

    it('should stay in sync with SUPPORTED_INPUT_EXTENSIONS', () => {
      expect(SUPPORTED_INPUT_EXTENSIONS).to.deep.equal(['.svg', '.png']);
      for (const ext of SUPPORTED_INPUT_EXTENSIONS) {
        expect(isSupportedInputFile(`logo${ext}`)).to.be.true;
      }
    });
  });

  describe('getInputFormat', () => {
    it('should identify svg sources', () => {
      expect(getInputFormat('logo.svg')).to.equal('svg');
      expect(getInputFormat('LOGO.SVG')).to.equal('svg');
    });

    it('should identify png sources', () => {
      expect(getInputFormat('logo.png')).to.equal('png');
      expect(getInputFormat('LOGO.PNG')).to.equal('png');
    });

    it('should return null for unsupported or missing paths', () => {
      expect(getInputFormat('logo.jpg')).to.be.null;
      expect(getInputFormat('')).to.be.null;
      expect(getInputFormat(undefined)).to.be.null;
    });
  });

  describe('resolveInputPath', () => {
    it('should prefer inputPath', () => {
      expect(resolveInputPath({ inputPath: 'a.png', svgPath: 'b.svg' })).to.equal('a.png');
    });

    it('should fall back to the legacy svgPath alias', () => {
      expect(resolveInputPath({ svgPath: 'b.svg' })).to.equal('b.svg');
    });

    it('should return undefined when neither is set', () => {
      expect(resolveInputPath({})).to.be.undefined;
      expect(resolveInputPath()).to.be.undefined;
    });
  });

  describe('ensureDirectory', () => {
    const testDir = './test-temp-dir';

    afterEach(async () => {
      try {
        await fs.rm(testDir, { recursive: true, force: true });
      } catch {
        // Ignore errors
      }
    });

    it('should create directory if it does not exist', async () => {
      await ensureDirectory(testDir);
      const exists = await fileExists(testDir);
      expect(exists).to.be.true;
    });

    it('should not throw error if directory already exists', async () => {
      await ensureDirectory(testDir);
      await ensureDirectory(testDir);
      const exists = await fileExists(testDir);
      expect(exists).to.be.true;
    });

    it('should create nested directories', async () => {
      const nestedDir = path.join(testDir, 'nested', 'deep');
      await ensureDirectory(nestedDir);
      const exists = await fileExists(nestedDir);
      expect(exists).to.be.true;
    });
  });

  describe('Logger', () => {
    it('should create logger with verbose mode', () => {
      const logger = new Logger(true);
      expect(logger.verbose).to.be.true;
    });

    it('should create logger with silent mode', () => {
      const logger = new Logger(false);
      expect(logger.verbose).to.be.false;
    });

    it('should have all logging methods', () => {
      const logger = new Logger();
      expect(logger.log).to.be.a('function');
      expect(logger.error).to.be.a('function');
      expect(logger.success).to.be.a('function');
      expect(logger.info).to.be.a('function');
      expect(logger.warn).to.be.a('function');
    });
  });

  describe('validateOptions', () => {
    it('should validate valid options', () => {
      expect(() => validateOptions(DEFAULT_OPTIONS)).to.not.throw();
    });

    it('should accept a PNG source', () => {
      const options = { ...DEFAULT_OPTIONS, inputPath: 'logo.png' };
      expect(() => validateOptions(options)).to.not.throw();
    });

    it('should accept the legacy svgPath alias', () => {
      const options = { ...DEFAULT_OPTIONS, inputPath: undefined, svgPath: 'logo.svg' };
      expect(() => validateOptions(options)).to.not.throw();
    });

    it('should accept a PNG passed through the legacy svgPath alias', () => {
      const options = { ...DEFAULT_OPTIONS, inputPath: undefined, svgPath: 'logo.png' };
      expect(() => validateOptions(options)).to.not.throw();
    });

    it('should throw error if inputPath is missing', () => {
      const options = { ...DEFAULT_OPTIONS, inputPath: '', svgPath: '' };
      expect(() => validateOptions(options)).to.throw('inputPath is required');
    });

    it('should throw error if inputPath is an unsupported format', () => {
      const options = { ...DEFAULT_OPTIONS, inputPath: 'test.jpg' };
      expect(() => validateOptions(options)).to.throw('inputPath must be an SVG or PNG file');
    });

    it('should name the offending extension in the error', () => {
      const options = { ...DEFAULT_OPTIONS, inputPath: 'test.webp' };
      expect(() => validateOptions(options)).to.throw('.webp');
    });

    it('should throw error if outputDir is missing', () => {
      const options = { ...DEFAULT_OPTIONS, outputDir: '' };
      expect(() => validateOptions(options)).to.throw('outputDir is required');
    });

    it('should throw error if iconSizes is not an array', () => {
      const options = { ...DEFAULT_OPTIONS, iconSizes: null };
      expect(() => validateOptions(options)).to.throw('iconSizes must be a non-empty array');
    });

    it('should throw error if iconSizes is empty', () => {
      const options = { ...DEFAULT_OPTIONS, iconSizes: [] };
      expect(() => validateOptions(options)).to.throw('iconSizes must be a non-empty array');
    });

    it('should throw error if icon size is invalid', () => {
      const options = {
        ...DEFAULT_OPTIONS,
        iconSizes: [{ size: -1, name: 'test.png' }],
      };
      expect(() => validateOptions(options)).to.throw('Each icon must have a valid positive size');
    });

    it('should throw error if icon name is missing', () => {
      const options = {
        ...DEFAULT_OPTIONS,
        iconSizes: [{ size: 100 }],
      };
      expect(() => validateOptions(options)).to.throw('Each icon must have a valid name');
    });

    it('should throw error if quality is out of range', () => {
      const options = { ...DEFAULT_OPTIONS, quality: 101 };
      expect(() => validateOptions(options)).to.throw('quality must be a number between 1 and 100');
    });

    it('should throw error if compressionLevel is out of range', () => {
      const options = { ...DEFAULT_OPTIONS, compressionLevel: 10 };
      expect(() => validateOptions(options)).to.throw(
        'compressionLevel must be a number between 0 and 9'
      );
    });
  });

  describe('generateHtmlMetaTags', () => {
    const baseResults = {
      icons: [{ size: 180, name: 'apple-touch-icon-180x180.png' }],
      faviconSizes: [{ size: 32 }],
    };

    it('should reference favicon.svg for an SVG source', () => {
      const html = generateHtmlMetaTags({ ...baseResults, inputFormat: 'svg' });
      expect(html).to.include('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />');
      expect(html).to.not.include('href="/favicon.png"');
    });

    it('should reference favicon.png for a PNG source', () => {
      const html = generateHtmlMetaTags({ ...baseResults, inputFormat: 'png' });
      expect(html).to.include('<link rel="icon" type="image/png" href="/favicon.png" />');
      expect(html).to.not.include('image/svg+xml');
      expect(html).to.not.include('href="/favicon.svg"');
    });

    it('should default to the SVG link when no format is given', () => {
      const html = generateHtmlMetaTags(baseResults);
      expect(html).to.include('href="/favicon.svg"');
    });

    it('should still emit shared tags for a PNG source', () => {
      const html = generateHtmlMetaTags({ ...baseResults, inputFormat: 'png' });
      expect(html).to.include('rel="apple-touch-icon"');
      expect(html).to.include('rel="manifest"');
      expect(html).to.include('sizes="32x32"');
    });
  });
});
