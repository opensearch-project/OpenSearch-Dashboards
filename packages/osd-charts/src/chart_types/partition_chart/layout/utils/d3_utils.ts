import { rgb as d3Rgb, RGBColor as D3RGBColor } from 'd3-color';

type RGB = number;
type A = number;
export type RgbTuple = [RGB, RGB, RGB, RGB?];
export type RgbObject = { r: RGB; g: RGB; b: RGB; opacity: A };

const defaultColor: RgbObject = { r: 255, g: 0, b: 0, opacity: 1 };
const defaultD3Color: D3RGBColor = d3Rgb(defaultColor.r, defaultColor.g, defaultColor.b, defaultColor.opacity);

export function stringToRGB(cssColorSpecifier: string): RgbObject {
  return d3Rgb(cssColorSpecifier) || defaultColor;
}

function argsToRGB(r: number, g: number, b: number, opacity: number): D3RGBColor {
  return d3Rgb(r, g, b, opacity) || defaultD3Color;
}

export function argsToRGBString(r: number, g: number, b: number, opacity: number): string {
  // d3.rgb returns an Rgb instance, which has a specialized `toString` method
  return argsToRGB(r, g, b, opacity).toString();
}

export function RGBtoString(rgb: RgbObject): string {
  const { r, g, b, opacity } = rgb;
  return argsToRGBString(r, g, b, opacity);
}
