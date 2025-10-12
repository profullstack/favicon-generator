/**
 * Default icon sizes for iOS and PWA compatibility
 */
export const DEFAULT_ICON_SIZES = [
  { size: 57, name: 'apple-touch-icon-57x57.png' },
  { size: 60, name: 'apple-touch-icon-60x60.png' },
  { size: 72, name: 'apple-touch-icon-72x72.png' },
  { size: 76, name: 'apple-touch-icon-76x76.png' },
  { size: 114, name: 'apple-touch-icon-114x114.png' },
  { size: 120, name: 'apple-touch-icon-120x120.png' },
  { size: 144, name: 'apple-touch-icon-144x144.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 256, name: 'icon-256x256.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

/**
 * Default configuration options
 */
export const DEFAULT_OPTIONS = {
  svgPath: './favicon.svg',
  outputDir: './icons',
  iconSizes: DEFAULT_ICON_SIZES,
  generateFavicon: true,
  faviconSizes: [16, 32],
  generateRootFavicons: true, // Generate favicon.png, favicon.svg, favicon.ico
  faviconPngSize: 32, // Size for favicon.png
  quality: 95,
  compressionLevel: 9,
  verbose: true,
};

/**
 * Background color configurations
 */
export const BACKGROUNDS = {
  transparent: { r: 255, g: 255, b: 255, alpha: 0 },
  white: { r: 255, g: 255, b: 255, alpha: 1 },
  black: { r: 0, g: 0, b: 0, alpha: 1 },
};
