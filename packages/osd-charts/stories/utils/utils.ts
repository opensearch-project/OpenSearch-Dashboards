/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { arrayToLookup, hueInterpolator } from '../../src/common/color_calcs';
import { countryDimension, productDimension, regionDimension } from '../../src/mocks/hierarchical/dimension_codes';
import { palettes } from '../../src/mocks/hierarchical/palettes';

export const productLookup = arrayToLookup((d: any) => d.sitc1, productDimension);
export const regionLookup = arrayToLookup((d: any) => d.region, regionDimension);
export const countryLookup = arrayToLookup((d: any) => d.country, countryDimension);

type ColorMaker = (x: number) => string;

// interpolation based, cyclical color example
export const interpolatorCET2s = hueInterpolator(palettes.CET2s.map(([r, g, b]) => [r, g, b, 0.8]));
export const interpolatorTurbo = hueInterpolator(palettes.turbo.map(([r, g, b]) => [r, g, b, 0.8]));
export const indexInterpolatedFillColor = (colorMaker: ColorMaker) => (d: any, i: number, a: any[]) =>
  colorMaker(i / (a.length + 1));

// colorbrewer2.org based, categorical color example
type RGBStrings = [string, string, string][];
const colorBrewerExportMatcher = /rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)/;
const rgbStringToTuple = (s: string) => (colorBrewerExportMatcher.exec(s) as string[]).slice(1);
const hexStringToTuple = (s: string) => [
  String(parseInt(s.slice(1, 3), 16)),
  String(parseInt(s.slice(3, 5), 16)),
  String(parseInt(s.slice(5, 7), 16)),
];

export const plasma18 = [
  '#0d0887',
  '#2f0596',
  '#4903a0',
  '#6100a7',
  '#7801a8',
  '#8e0ca4',
  '#a21d9a',
  '#b42e8d',
  '#c43e7f',
  '#d24f71',
  '#de6164',
  '#e97257',
  '#f3854b',
  '#f99a3e',
  '#fdaf31',
  '#fdc627',
  '#f8df25',
  '#f0f921',
].map(hexStringToTuple) as RGBStrings;

export const viridis18 = [
  '#440154',
  '#481769',
  '#472a7a',
  '#433d84',
  '#3d4e8a',
  '#355e8d',
  '#2e6d8e',
  '#297b8e',
  '#23898e',
  '#1f978b',
  '#21a585',
  '#2eb37c',
  '#46c06f',
  '#65cb5e',
  '#89d548',
  '#b0dd2f',
  '#d8e219',
  '#fde725',
].map(hexStringToTuple) as RGBStrings;

export const cividis18 = [
  '#002051',
  '#002b64',
  '#0f356c',
  '#23406e',
  '#374a6e',
  '#4b556d',
  '#5c606e',
  '#6c6b70',
  '#797673',
  '#858176',
  '#928d78',
  '#9f9978',
  '#aea575',
  '#bfb26f',
  '#d2bf66',
  '#e4cd5a',
  '#f4db4e',
  '#fdea45',
].map(hexStringToTuple) as RGBStrings;

export const inferno18 = [
  '#000004',
  '#0a0722',
  '#1e0c45',
  '#380962',
  '#510e6c',
  '#69166e',
  '#801f6c',
  '#982766',
  '#b0315b',
  '#c63d4d',
  '#d94d3d',
  '#e9612b',
  '#f47918',
  '#fa9407',
  '#fcb014',
  '#f8cd37',
  '#f2ea69',
  '#fcffa4',
].map(hexStringToTuple) as RGBStrings;

export const colorBrewerSequential9: RGBStrings = [
  'rgb(255,247,251)',
  'rgb(236,231,242)',
  'rgb(208,209,230)',
  'rgb(166,189,219)',
  'rgb(116,169,207)',
  'rgb(54,144,192)',
  'rgb(5,112,176)',
  'rgb(4,90,141)',
  'rgb(2,56,88)',
].map(rgbStringToTuple) as RGBStrings;

export const colorBrewerDiverging11: RGBStrings = [
  'rgb(158,1,66)',
  'rgb(213,62,79)',
  'rgb(244,109,67)',
  'rgb(253,174,97)',
  'rgb(254,224,139)',
  'rgb(255,255,191)',
  'rgb(230,245,152)',
  'rgb(171,221,164)',
  'rgb(102,194,165)',
  'rgb(50,136,189)',
  'rgb(94,79,162)',
].map(rgbStringToTuple) as RGBStrings;

export const colorBrewerCategorical12: RGBStrings = [
  'rgb(166,206,227)',
  'rgb(31,120,180)',
  'rgb(178,223,138)',
  'rgb(51,160,44)',
  'rgb(251,154,153)',
  'rgb(227,26,28)',
  'rgb(253,191,111)',
  'rgb(255,127,0)',
  'rgb(202,178,214)',
  'rgb(106,61,154)',
  'rgb(255,255,153)',
  'rgb(177,89,40)',
].map(rgbStringToTuple) as RGBStrings;

export const colorBrewerCategoricalPastel12: RGBStrings = [
  'rgb(166,206,227)',
  'rgb(31,120,180)',
  'rgb(178,223,138)',
  'rgb(51,160,44)',
  'rgb(251,154,153)',
  'rgb(227,26,28)',
  'rgb(253,191,111)',
  'rgb(255,127,0)',
  'rgb(202,178,214)',
  'rgb(106,61,154)',
  'rgb(255,255,153)',
  'rgb(177,89,40)',
].map(rgbStringToTuple) as RGBStrings;

export const colorBrewerCategoricalPastel12B: RGBStrings = [
  'rgb(141,211,199)',
  'rgb(255,255,179)',
  'rgb(190,186,218)',
  'rgb(251,128,114)',
  'rgb(128,177,211)',
  'rgb(253,180,98)',
  'rgb(179,222,105)',
  'rgb(252,205,229)',
  'rgb(217,217,217)',
  'rgb(188,128,189)',
  'rgb(204,235,197)',
  'rgb(255,237,111)',
].map(rgbStringToTuple) as RGBStrings;

export const colorBrewerCategoricalStark9: RGBStrings = [
  'rgb(228,26,28)',
  'rgb(55,126,184)',
  'rgb(77,175,74)',
  'rgb(152,78,163)',
  'rgb(255,127,0)',
  'rgb(255,255,51)',
  'rgb(166,86,40)',
  'rgb(247,129,191)',
  'rgb(153,153,153)',
].map(rgbStringToTuple) as RGBStrings;

export const discreteColor = (categoricalColors: RGBStrings, opacity = 1) => (i: number) =>
  `rgba(${categoricalColors[i % categoricalColors.length].concat([opacity.toString()]).join(',')})`;

export const decreasingOpacityCET2 = (opacity: number) => (d: any, i: number, a: any[]) =>
  hueInterpolator(palettes.CET2s.map(([r, g, b]) => [r, g, b, opacity]))(i / (a.length + 1));
