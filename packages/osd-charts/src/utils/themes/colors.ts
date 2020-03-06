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

export interface ColorScales {
  [key: string]: string;
}

interface EchPalette {
  colors: string[];
}

const echPaletteColorBlind: EchPalette = {
  colors: [
    '#1EA593',
    '#2B70F7',
    '#CE0060',
    '#38007E',
    '#FCA5D3',
    '#F37020',
    '#E49E29',
    '#B0916F',
    '#7B000B',
    '#34130C',
  ],
};

const echPaletteForLightBackground: EchPalette = {
  colors: ['#006BB4', '#017D73', '#F5A700', '#BD271E', '#DD0A73'],
};

const echPaletteForDarkBackground: EchPalette = {
  colors: ['#1BA9F5', '#7DE2D1', '#F990C0', '#F66', '#FFCE7A'],
};

const echPaletteForStatus: EchPalette = {
  colors: [
    '#58BA6D',
    '#6ECE67',
    '#A5E26A',
    '#D2E26A',
    '#EBDF61',
    '#EBD361',
    '#EBC461',
    '#D99D4C',
    '#D97E4C',
    '#D75949',
  ],
};

export const palettes = {
  echPaletteColorBlind,
  echPaletteForLightBackground,
  echPaletteForDarkBackground,
  echPaletteForStatus,
};
