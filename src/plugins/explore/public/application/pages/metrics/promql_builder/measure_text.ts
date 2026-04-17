/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const measureCanvas = (() => {
  let canvas: HTMLCanvasElement | null = null;
  return (
    text: string,
    font = '14px Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
  ): number => {
    if (!canvas) canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.font = font;
    return Math.ceil(ctx.measureText(text).width);
  };
})();

/**
 * Returns a minWidth style value that fits the displayed text (selected value or placeholder).
 * Adds padding for the combo box chrome (icon, borders, etc).
 */
export function comboBoxWidth(text: string): number {
  return Math.min(Math.max(measureCanvas(text) + 80, 200), 350);
}

export function inputWidth(
  text: string,
  padding = 16,
  min = 50,
  max = 200,
  font = '12px Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
): number {
  return Math.min(Math.max(measureCanvas(text, font) + padding, min), max);
}
