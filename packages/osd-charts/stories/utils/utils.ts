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
 * under the License. */

import { arrayToLookup, hueInterpolator } from '../../src/chart_types/partition_chart/layout/utils/calcs';
import { palettes } from '../../src/mocks/hierarchical/palettes';
import { countryDimension, productDimension, regionDimension } from '../../src/mocks/hierarchical/dimension_codes';

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
