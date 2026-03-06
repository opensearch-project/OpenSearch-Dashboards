/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Normalizes 3-digit hex colors to 6-digit format
 */
export function normalizeHexColor(color: string): string {
  if (color.length === 4) {
    return color.replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i, '#$1$1$2$2$3$3');
  }
  return color;
}

/**
 * Darkens a hex color by multiplying RGB values by a factor
 * @param hexColor Hex color string (e.g., '#FF5733')
 * @param factor Darkening factor between 0 and 1 (e.g., 0.6 = 60% brightness)
 * @returns Darkened hex color string
 */
export function darkenHexColor(hexColor: string, factor: number = 0.6): string {
  const normalized = normalizeHexColor(hexColor);

  // Parse RGB values
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);

  // Darken by multiplying each component by the factor
  const darkenedR = Math.round(r * factor);
  const darkenedG = Math.round(g * factor);
  const darkenedB = Math.round(b * factor);

  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(darkenedR)}${toHex(darkenedG)}${toHex(darkenedB)}`;
}

/**
 * Calculates relative luminance and returns appropriate contrast text color
 * Uses WCAG 2.0 formula to determine if background is light or dark
 * @param backgroundColor Hex color string (e.g., '#FF5733' or '#F73')
 * @returns '#FFFFFF' for dark backgrounds, '#000000' for light backgrounds
 */
export function getContrastTextColor(backgroundColor: string): string {
  // Normalize to 6-digit hex
  const normalized = normalizeHexColor(backgroundColor);

  // Parse RGB values
  const r = parseInt(normalized.slice(1, 3), 16) / 255;
  const g = parseInt(normalized.slice(3, 5), 16) / 255;
  const b = parseInt(normalized.slice(5, 7), 16) / 255;

  // Apply gamma correction
  const gammaCorrect = (c: number) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  // Calculate relative luminance using WCAG formula
  const luminance = 0.2126 * gammaCorrect(r) + 0.7152 * gammaCorrect(g) + 0.0722 * gammaCorrect(b);

  // Return white for dark backgrounds, black for light backgrounds
  // Threshold at 0.5 provides good contrast for most cases
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
