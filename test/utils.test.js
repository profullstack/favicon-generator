import { expect } from 'chai';
import { promises as fs } from 'fs';
import path from 'path';
import { fileExists, isSvgFile, ensureDirectory, Logger, validateOptions } from '../src/utils.js';
import { DEFAULT_OPTIONS } from '../src/constants.js';

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

    it('should throw error if svgPath is missing', () => {
      const options = { ...DEFAULT_OPTIONS, svgPath: '' };
      expect(() => validateOptions(options)).to.throw('svgPath is required');
    });

    it('should throw error if svgPath is not an SVG file', () => {
      const options = { ...DEFAULT_OPTIONS, svgPath: 'test.png' };
      expect(() => validateOptions(options)).to.throw('svgPath must be an SVG file');
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
});
