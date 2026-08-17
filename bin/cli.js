#!/usr/bin/env node

import inquirer from 'inquirer';
import { generateIcons } from '../src/index.js';
import { DEFAULT_OPTIONS, DEFAULT_INPUT_CANDIDATES } from '../src/constants.js';
import { fileExists, isSupportedInputFile } from '../src/utils.js';
import path from 'path';

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '-i':
      case '--input':
        options.inputPath = args[++i];
        break;
      case '-o':
      case '--output':
        options.outputDir = args[++i];
        break;
      case '-q':
      case '--quality':
        options.quality = parseInt(args[++i], 10);
        break;
      case '-c':
      case '--compression':
        options.compressionLevel = parseInt(args[++i], 10);
        break;
      case '--no-favicon':
        options.generateFavicon = false;
        break;
      case '--silent':
        options.verbose = false;
        break;
      case '-h':
      case '--help':
        showHelp();
        process.exit(0);
        break;
      case '-v':
      case '--version':
        showVersion();
        process.exit(0);
        break;
    }
  }

  return options;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
🎨 Favicon Generator - Generate PNG icons from an SVG or PNG source

Usage:
  fav [options]

Options:
  -i, --input <path>        Path to source SVG or PNG (default: ./favicon.svg)
  -o, --output <path>       Output directory (default: ./icons)
  -q, --quality <number>    PNG quality 1-100 (default: 95)
  -c, --compression <num>   Compression level 0-9 (default: 9)
  --no-favicon              Skip generating additional favicon sizes
  --silent                  Suppress output messages
  -h, --help                Show this help message
  -v, --version             Show version number

Examples:
  fav
  fav -i logo.svg -o ./public/icons
  fav -i logo.png -o ./public/icons
  fav --input favicon.png --output dist/icons --quality 90
  fav --silent --no-favicon

Notes:
  A PNG source should be square and at least 512x512, since raster art cannot be
  upscaled without softening. SVG sources scale losslessly.

Interactive Mode:
  Run 'fav' without arguments to use interactive mode
`);
}

/**
 * Show version
 */
function showVersion() {
  // Read version from package.json
  import('fs').then(({ promises: fs }) => {
    fs.readFile(new URL('../package.json', import.meta.url), 'utf-8')
      .then((data) => {
        const pkg = JSON.parse(data);
        console.log(`v${pkg.version}`);
      })
      .catch(() => {
        console.log('Version information not available');
      });
  });
}

/**
 * Pick a sensible default source file by probing the common candidates
 * @returns {Promise<string>} First existing candidate, or the built-in default
 */
async function detectDefaultInput() {
  for (const candidate of DEFAULT_INPUT_CANDIDATES) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }
  return DEFAULT_OPTIONS.inputPath;
}

/**
 * Prompt user for configuration using inquirer
 */
async function promptForConfig() {
  console.log('🎨 Favicon Generator - Interactive Mode\n');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'inputPath',
      message: 'Path to source SVG or PNG:',
      default: await detectDefaultInput(),
      validate: async (input) => {
        if (!input) return 'Input path is required';
        if (!isSupportedInputFile(input)) return 'File must be an SVG (.svg) or PNG (.png)';
        const exists = await fileExists(input);
        if (!exists) return `File not found: ${input}`;
        return true;
      },
    },
    {
      type: 'input',
      name: 'outputDir',
      message: 'Output directory:',
      default: DEFAULT_OPTIONS.outputDir,
      validate: (input) => {
        if (!input) return 'Output directory is required';
        return true;
      },
    },
    {
      type: 'number',
      name: 'quality',
      message: 'PNG quality (1-100):',
      default: DEFAULT_OPTIONS.quality,
      validate: (input) => {
        const num = parseInt(input, 10);
        if (isNaN(num) || num < 1 || num > 100) {
          return 'Quality must be between 1 and 100';
        }
        return true;
      },
    },
    {
      type: 'number',
      name: 'compressionLevel',
      message: 'Compression level (0-9):',
      default: DEFAULT_OPTIONS.compressionLevel,
      validate: (input) => {
        const num = parseInt(input, 10);
        if (isNaN(num) || num < 0 || num > 9) {
          return 'Compression level must be between 0 and 9';
        }
        return true;
      },
    },
    {
      type: 'confirm',
      name: 'generateFavicon',
      message: 'Generate additional favicon sizes (16x16, 32x32)?',
      default: DEFAULT_OPTIONS.generateFavicon,
    },
  ]);

  return answers;
}

/**
 * Main CLI function
 */
async function main() {
  try {
    const cliArgs = parseArgs();

    // If no arguments provided, use interactive mode
    let options;
    if (Object.keys(cliArgs).length === 0) {
      options = await promptForConfig();
    } else {
      options = { ...DEFAULT_OPTIONS, ...cliArgs };
    }

    // Generate icons
    const results = await generateIcons(options);

    // Show summary
    console.log('\n📊 Summary:');
    console.log(`   Icons generated: ${results.icons.length}`);
    console.log(`   Output directory: ${path.resolve(results.outputDir)}`);
    if (results.faviconSizes.length > 0) {
      console.log(`   Favicon sizes: ${results.faviconSizes.length}`);
    }

    // In interactive mode, output the meta tags and manifest to stdout
    if (Object.keys(cliArgs).length === 0) {
      console.log('\n📄 HTML Meta Tags (also saved to meta-tags.html):');
      console.log('─'.repeat(60));
      const { promises: fs } = await import('fs');
      const htmlContent = await fs.readFile(results.htmlFile, 'utf-8');
      console.log(htmlContent);

      console.log('\n📱 Manifest JSON (also saved to manifest.json):');
      console.log('─'.repeat(60));
      const manifestContent = await fs.readFile(results.manifestFile, 'utf-8');
      console.log(manifestContent);

      console.log('\n🪟 Browser Config XML (also saved to browserconfig.xml):');
      console.log('─'.repeat(60));
      const browserConfigContent = await fs.readFile(results.browserConfigFile, 'utf-8');
      console.log(browserConfigContent);
      console.log('─'.repeat(60));
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run CLI
main();
