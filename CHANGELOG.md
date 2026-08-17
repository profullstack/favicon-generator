# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-08-17

### Added

- PNG source support: `fav -i logo.png` and `generateIcons({ inputPath: './logo.png' })` now
  work alongside SVG sources
- `inputPath` option as the canonical name for the source file; `svgPath` continues to work as
  an alias and may itself point at a `.png`
- `isPngFile`, `isSupportedInputFile`, `getInputFormat`, and `resolveInputPath` utility exports
- `SUPPORTED_INPUT_EXTENSIONS` and `DEFAULT_INPUT_CANDIDATES` constant exports
- Interactive mode now detects an existing `favicon.svg`, `favicon.png`, or `logo.png` as its
  default source
- Warnings when a PNG source is smaller than the largest requested icon (upscaling) or is not
  square (padding)
- `inputPath` and `inputFormat` on the `generateIcons` result object

### Changed

- Generated `meta-tags.html` links `/favicon.png` for a PNG source instead of `/favicon.svg`
- `favicon.svg` is only written for SVG sources; a PNG source produces `favicon.png` and
  `favicon.ico` only
- Validation errors now read `inputPath is required` / `inputPath must be an SVG or PNG file`
  (previously `svgPath is required` / `svgPath must be an SVG file`)

## [1.0.0] - 2024-10-12

### Added

- Initial release of @profullstack/favicon-generator
- CLI tool with `fav` command
- Interactive mode with inquirer prompts
- Programmatic ESM API
- Generate PNG icons from SVG for iOS and PWA
- Support for Apple Touch Icons (57x57 to 180x180)
- Support for PWA icons (192x192 to 512x512)
- Optional favicon size generation (16x16, 32x32)
- Configurable quality and compression settings
- Comprehensive test suite with Mocha and Chai
- ESLint and Prettier configuration
- Full documentation and examples

### Features

- Command-line arguments support
- Interactive prompts for easy configuration
- Verbose and silent modes
- Custom icon sizes support
- Automatic directory creation
- Robust error handling
- High-quality PNG output with Sharp

[1.2.0]: https://github.com/profullstack/favicon-generator/releases/tag/v1.2.0
[1.0.0]: https://github.com/profullstack/favicon-generator/releases/tag/v1.0.0
