import { arrayToLookup, hueInterpolator } from '../../src/chart_types/partition_chart/layout/utils/calcs';
import { palettes } from '../../src/mocks/hierarchical/palettes';
import { Datum } from '../../src/utils/domain';
import { countryDimension, productDimension, regionDimension } from '../../src/mocks/hierarchical/dimension_codes';

export const productLookup = arrayToLookup((d: Datum) => d.sitc1, productDimension);
export const regionLookup = arrayToLookup((d: Datum) => d.region, regionDimension);
export const countryLookup = arrayToLookup((d: Datum) => d.country, countryDimension);

// interpolation based, cyclical color example
export const interpolatorCET2s = hueInterpolator(palettes.CET2s.map(([r, g, b]) => [r, g, b, 0.8]));
export const interpolatorTurbo = hueInterpolator(palettes.turbo.map(([r, g, b]) => [r, g, b, 0.8]));
export const indexInterpolatedFillColor = (colorMaker: any) => (d: any, i: number, a: any[]) =>
  colorMaker(i / (a.length + 1));

// colorbrewer2.org based, categorical color example
type RGBStrings = [string, string, string][];
const colorBrewerExportMatcher = /rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)/;
const colorStringToTuple = (s: string) => (colorBrewerExportMatcher.exec(s) as string[]).slice(1);

// prettier-ignore
export const colorBrewerCategorical12: RGBStrings = ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)', 'rgb(51,160,44)', 'rgb(251,154,153)', 'rgb(227,26,28)', 'rgb(253,191,111)', 'rgb(255,127,0)', 'rgb(202,178,214)', 'rgb(106,61,154)', 'rgb(255,255,153)', 'rgb(177,89,40)'].map(colorStringToTuple) as RGBStrings;

// prettier-ignore
export const colorBrewerCategoricalPastel12: RGBStrings = ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)', 'rgb(51,160,44)', 'rgb(251,154,153)', 'rgb(227,26,28)', 'rgb(253,191,111)', 'rgb(255,127,0)', 'rgb(202,178,214)', 'rgb(106,61,154)', 'rgb(255,255,153)', 'rgb(177,89,40)'].map(colorStringToTuple) as RGBStrings;

// prettier-ignore
export const colorBrewerCategoricalStark9: RGBStrings = ['rgb(228,26,28)', 'rgb(55,126,184)', 'rgb(77,175,74)', 'rgb(152,78,163)', 'rgb(255,127,0)', 'rgb(255,255,51)', 'rgb(166,86,40)', 'rgb(247,129,191)', 'rgb(153,153,153)'].map(colorStringToTuple) as RGBStrings;

export const categoricalFillColor = (categoricalColors: RGBStrings, opacity = 1) => (i: number) =>
  `rgba(${categoricalColors[i % categoricalColors.length].concat([opacity.toString()]).join(',')})`;

export const decreasingOpacityCET2 = (opacity: number) => (d: any, i: number, a: any[]) =>
  hueInterpolator(palettes.CET2s.map(([r, g, b]) => [r, g, b, opacity]))(i / (a.length + 1));
