/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const measureCanvas = (() => {
  let ctx: CanvasRenderingContext2D | null = null;
  return (
    text: string,
    font = '14px Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
  ): number => {
    if (!ctx) ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return text.length * 8;
    ctx.font = font;
    return Math.ceil(ctx.measureText(text).width);
  };
})();

export function inputWidth(
  text: string,
  padding = 16,
  min = 50,
  max = 200,
  font = '12px Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
): number {
  return Math.min(Math.max(measureCanvas(text, font) + padding, min), max);
}
