# @profullstack/favicon-generator

Generate PNG icons from SVG for iOS and PWA compatibility. A modern, flexible Node.js tool that converts your SVG favicon into all the icon sizes you need for mobile devices and progressive web apps.

[![npm version](https://img.shields.io/npm/v/@profullstack/favicon-generator.svg)](https://www.npmjs.com/package/@profullstack/favicon-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎨 Convert SVG to multiple PNG icon sizes
- 📱 iOS Apple Touch Icon support
- 🌐 PWA icon generation
- 🖼️ Automatic favicon size generation (16x16, 32x32)
- ⚙️ Configurable quality and compression
- 🎯 CLI with interactive mode
- 📦 ESM module for programmatic use
- ✅ Comprehensive test coverage
- 🚀 Built with modern Node.js (v20+)

## Installation

```bash
# Using pnpm (recommended)
pnpm add @profullstack/favicon-generator

# Using npm
npm install @profullstack/favicon-generator

# Using yarn
yarn add @profullstack/favicon-generator
```

### Global Installation (for CLI)

```bash
# Using pnpm
pnpm add -g @profullstack/favicon-generator

# Using npm
npm install -g @profullstack/favicon-generator
```

## Usage

### CLI Usage

#### Interactive Mode

Simply run the command without arguments to enter interactive mode:

```bash
fav
```

You'll be prompted for:

- SVG file path
- Output directory
- PNG quality (1-100)
- Compression level (0-9)
- Whether to generate additional favicon sizes

#### Command Line Arguments

```bash
# Basic usage
fav -i favicon.svg -o ./icons

# With custom quality and compression
fav -i logo.svg -o ./public/icons -q 90 -c 7

# Silent mode (no output)
fav -i favicon.svg -o ./icons --silent

# Skip favicon generation
fav -i favicon.svg -o ./icons --no-favicon

# Show help
fav --help

# Show version
fav --version
```

#### CLI Options

| Option          | Alias | Description                   | Default         |
| --------------- | ----- | ----------------------------- | --------------- |
| `--input`       | `-i`  | Path to SVG file              | `./favicon.svg` |
| `--output`      | `-o`  | Output directory              | `./icons`       |
| `--quality`     | `-q`  | PNG quality (1-100)           | `95`            |
| `--compression` | `-c`  | Compression level (0-9)       | `9`             |
| `--no-favicon`  |       | Skip additional favicon sizes | `false`         |
| `--silent`      |       | Suppress output messages      | `false`         |
| `--help`        | `-h`  | Show help message             |                 |
| `--version`     | `-v`  | Show version number           |                 |

### Programmatic Usage (ESM)

#### Basic Example

```javascript
import { generateIcons } from '@profullstack/favicon-generator';

const results = await generateIcons({
  svgPath: './favicon.svg',
  outputDir: './icons',
});

console.log(`Generated ${results.icons.length} icons`);
```

#### Custom Configuration

```javascript
import { generateIcons } from '@profullstack/favicon-generator';

const results = await generateIcons({
  svgPath: './logo.svg',
  outputDir: './public/icons',
  quality: 90,
  compressionLevel: 7,
  generateFavicon: true,
  faviconSizes: [16, 32, 48],
  verbose: true,
});

// Access generated files
results.icons.forEach((icon) => {
  console.log(`${icon.name}: ${icon.path}`);
});
```

#### Custom Icon Sizes

```javascript
import { generateCustomIcons } from '@profullstack/favicon-generator';

const customSizes = [
  { size: 48, name: 'icon-48.png' },
  { size: 96, name: 'icon-96.png' },
  { size: 144, name: 'icon-144.png' },
];

const results = await generateCustomIcons('./favicon.svg', './icons', customSizes, { quality: 95 });
```

#### Using Constants

```javascript
import { generateIcons, DEFAULT_ICON_SIZES, BACKGROUNDS } from '@profullstack/favicon-generator';

// Use default icon sizes
const results = await generateIcons({
  svgPath: './favicon.svg',
  outputDir: './icons',
  iconSizes: DEFAULT_ICON_SIZES,
});

// Available background colors
console.log(BACKGROUNDS.transparent); // { r: 255, g: 255, b: 255, alpha: 0 }
console.log(BACKGROUNDS.white); // { r: 255, g: 255, b: 255, alpha: 1 }
console.log(BACKGROUNDS.black); // { r: 0, g: 0, b: 0, alpha: 1 }
```

## API Reference

### `generateIcons(options)`

Generate PNG icons from an SVG file.

**Parameters:**

- `options` (Object):
  - `svgPath` (string, required): Path to the SVG file
  - `outputDir` (string, required): Output directory for generated icons
  - `iconSizes` (Array, optional): Array of `{size, name}` objects. Defaults to `DEFAULT_ICON_SIZES`
  - `quality` (number, optional): PNG quality (1-100). Default: `95`
  - `compressionLevel` (number, optional): Compression level (0-9). Default: `9`
  - `generateFavicon` (boolean, optional): Generate additional favicon sizes. Default: `true`
  - `faviconSizes` (Array, optional): Array of favicon sizes. Default: `[16, 32]`
  - `verbose` (boolean, optional): Enable verbose logging. Default: `true`

**Returns:** Promise<Object>

```javascript
{
  icons: [
    { size: 64, name: 'icon-64.png', path: './icons/icon-64.png' },
    // ...
  ],
  faviconSizes: [
    { size: 16, path: './icons/favicon-16.png' },
    // ...
  ],
  outputDir: './icons'
}
```

### `generateCustomIcons(svgPath, outputDir, customSizes, additionalOptions)`

Generate icons with custom sizes.

**Parameters:**

- `svgPath` (string): Path to the SVG file
- `outputDir` (string): Output directory
- `customSizes` (Array): Array of `{size, name}` objects
- `additionalOptions` (Object, optional): Additional options (quality, compressionLevel, etc.)

**Returns:** Promise<Object> (same as `generateIcons`)

## Default Icon Sizes

The package generates the following icon sizes by default:

### Apple Touch Icons

- 57x57, 60x60, 72x72, 76x76
- 114x114, 120x120, 144x144
- 152x152, 180x180

### PWA Icons

- 192x192, 256x256, 384x384, 512x512

### Favicon Sizes (optional)

- 16x16, 32x32

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/profullstack/favicon-generator.git
cd favicon-generator

# Install dependencies
pnpm install
```

### Running Tests

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Linting and Formatting

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check
```

## Requirements

- Node.js >= 20.0.0
- ESM support

## Dependencies

- [sharp](https://sharp.pixelplumbing.com/) - High-performance image processing
- [inquirer](https://github.com/SBoudrias/Inquirer.js) - Interactive CLI prompts

## License

MIT © profullstack

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Issues

If you encounter any issues or have questions, please file an issue on the [GitHub repository](https://github.com/profullstack/favicon-generator/issues).

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.
