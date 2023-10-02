/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { i18n } from '@osd/i18n';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import {
  ouiPaletteCool,
  ouiPaletteGray,
  ouiPalettePositive,
  ouiPaletteNegative,
  colorPalette as ouiColorPalette,
} from '@elastic/eui';

export enum ColorSchemas {
  Blues = 'Blues',
  Greens = 'Greens',
  Greys = 'Greys',
  Reds = 'Reds',
  YellowToRed = 'Yellow to Red',
  GreenToRed = 'Green to Red',
}

export interface ColorSchema {
  value: ColorSchemas;
  text: string;
}

export interface RawColorSchema {
  id: ColorSchemas;
  label: string;
  value: Array<[number, number[]]>;
}

export interface ColorMap {
  [key: string]: RawColorSchema;
}

const COLOR_MAP_LENGTH = 512;

// TODO: replace with on demand palette generation: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4400
function convertColorPaletteToColorMap(colorPalette: string[]): RawColorSchema['value'] {
  const colorMap: RawColorSchema['value'] = [];

  for (let i = 0; i < colorPalette.length; i++) {
    const color = colorPalette[i];
    const regex = /#([0-9a-zA-Z]{2})([0-9a-zA-Z]{2})([0-9a-zA-Z]{2})/;

    const [, rawRed, rawGreen, rawBlue] = regex.exec(color)!;
    const [red, green, blue] = [
      parseInt(rawRed, 16) / 255,
      parseInt(rawGreen, 16) / 255,
      parseInt(rawBlue, 16) / 255,
    ];

    colorMap[i] = [i / (colorPalette.length - 1), [red, green, blue]];
  }

  return colorMap;
}

export const vislibColorMaps: ColorMap = {
  // Sequential
  [ColorSchemas.Blues]: {
    id: ColorSchemas.Blues,
    label: i18n.translate('charts.colormaps.bluesText', {
      defaultMessage: 'Blues',
    }),
    value: convertColorPaletteToColorMap(ouiPaletteCool(COLOR_MAP_LENGTH)),
  },
  [ColorSchemas.Greens]: {
    id: ColorSchemas.Greens,
    label: i18n.translate('charts.colormaps.greensText', {
      defaultMessage: 'Greens',
    }),
    value: convertColorPaletteToColorMap(ouiPalettePositive(COLOR_MAP_LENGTH)),
  },
  [ColorSchemas.Greys]: {
    id: ColorSchemas.Greys,
    label: i18n.translate('charts.colormaps.greysText', {
      defaultMessage: 'Greys',
    }),
    value: convertColorPaletteToColorMap(ouiPaletteGray(COLOR_MAP_LENGTH)),
  },
  [ColorSchemas.Reds]: {
    id: ColorSchemas.Reds,
    label: i18n.translate('charts.colormaps.redsText', {
      defaultMessage: 'Reds',
    }),
    value: convertColorPaletteToColorMap(ouiPaletteNegative(COLOR_MAP_LENGTH)),
  },
  [ColorSchemas.YellowToRed]: {
    id: ColorSchemas.YellowToRed,
    label: i18n.translate('charts.colormaps.yellowToRedText', {
      defaultMessage: 'Yellow to Red',
    }),
    value: convertColorPaletteToColorMap(
      ouiColorPalette(
        [euiThemeVars.euiColorWarning, euiThemeVars.euiColorDanger],
        COLOR_MAP_LENGTH,
        false,
        true
      )
    ),
  },

  [ColorSchemas.GreenToRed]: {
    id: ColorSchemas.GreenToRed,
    label: i18n.translate('charts.colormaps.greenToRedText', {
      defaultMessage: 'Green to Red',
    }),
    value: convertColorPaletteToColorMap(
      ouiColorPalette(
        [euiThemeVars.euiColorSuccess, euiThemeVars.euiColorWarning, euiThemeVars.euiColorDanger],
        COLOR_MAP_LENGTH,
        false,
        true
      )
    ),
  },
};

export const colorSchemas: ColorSchema[] = Object.values(vislibColorMaps).map(({ id, label }) => ({
  value: id,
  text: label,
}));
