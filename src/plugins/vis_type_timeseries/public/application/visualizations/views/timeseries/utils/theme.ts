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

// @ts-ignore
import colorJS from 'color';
import { Theme, LIGHT_THEME, DARK_THEME } from '@elastic/charts';

// Axis-title fill colors from @elastic/charts' pre-71 (Amsterdam) LIGHT_THEME
// and DARK_THEME. charts >=71 switched its default themes to Borealis text
// tokens; using these legacy reference colors in the contrast computation
// below keeps TSVB's axis text color consistent with pre-upgrade behavior.
const LEGACY_LIGHT_AXIS_TITLE_FILL = '#333';
const LEGACY_DARK_AXIS_TITLE_FILL = '#D4D4D4';

function computeRelativeLuminosity(rgb: string) {
  return colorJS(rgb).luminosity();
}

function computeContrast(rgb1: string, rgb2: string) {
  return colorJS(rgb1).contrast(colorJS(rgb2));
}

function getAAARelativeLum(bgColor: string, fgColor: string, ratio = 7) {
  const relLum1 = computeRelativeLuminosity(bgColor);
  const relLum2 = computeRelativeLuminosity(fgColor);
  if (relLum1 > relLum2) {
    // relLum1 is brighter, relLum2 is darker
    return (relLum1 + 0.05 - ratio * 0.05) / ratio;
  } else {
    // relLum1 is darker, relLum2 is brighter
    return Math.min(ratio * (relLum1 + 0.05) - 0.05, 1);
  }
}

function getGrayFromRelLum(relLum: number) {
  if (relLum <= 0.0031308) {
    return relLum * 12.92;
  } else {
    return (1.0 + 0.055) * Math.pow(relLum, 1.0 / 2.4) - 0.055;
  }
}

function getGrayRGBfromGray(gray: number) {
  const g = Math.round(gray * 255);
  return `rgb(${g},${g},${g})`;
}

function getAAAGray(bgColor: string, fgColor: string, ratio = 7) {
  const relLum = getAAARelativeLum(bgColor, fgColor, ratio);
  const gray = getGrayFromRelLum(relLum);
  return getGrayRGBfromGray(gray);
}

function findBestContrastColor(
  bgColor: string,
  lightFgColor: string,
  darkFgColor: string,
  ratio = 4.5
) {
  const lc = computeContrast(bgColor, lightFgColor);
  const dc = computeContrast(bgColor, darkFgColor);
  if (lc >= dc) {
    if (lc >= ratio) {
      return lightFgColor;
    }
    return getAAAGray(bgColor, lightFgColor, ratio);
  }
  if (dc >= ratio) {
    return darkFgColor;
  }
  return getAAAGray(bgColor, darkFgColor, ratio);
}

function isValidColor(color: string | null | undefined): color is string {
  if (typeof color !== 'string') {
    return false;
  }
  if (color.length === 0) {
    return false;
  }
  try {
    colorJS(color);
    return true;
  } catch {
    return false;
  }
}

/**
 * compute base chart theme based on the background color
 *
 * @param baseTheme
 * @param bgColor
 */
export function getBaseTheme(baseTheme: Theme, bgColor?: string | null): Theme {
  if (!isValidColor(bgColor)) {
    return baseTheme;
  }

  const bgLuminosity = computeRelativeLuminosity(bgColor);
  const mainTheme = bgLuminosity <= 0.179 ? DARK_THEME : LIGHT_THEME;
  // Reference the legacy (Amsterdam) axis-title fills so the computed
  // high-contrast color stays consistent with pre-71 behavior (charts >=71's
  // Borealis text tokens would otherwise flip some colors, e.g. white ->
  // near-black). The base `mainTheme` still uses the current charts theme.
  const color = findBestContrastColor(
    bgColor,
    LEGACY_LIGHT_AXIS_TITLE_FILL,
    LEGACY_DARK_AXIS_TITLE_FILL
  );
  return {
    ...mainTheme,
    axes: {
      ...mainTheme.axes,
      axisTitle: {
        ...mainTheme.axes.axisTitle,
        fill: color,
      },
      tickLabel: {
        ...mainTheme.axes.tickLabel,
        fill: color,
      },
      axisLine: {
        ...mainTheme.axes.axisLine,
        stroke: color,
      },
      tickLine: {
        ...mainTheme.axes.tickLine,
        stroke: color,
      },
    },
  };
}

export function getChartClasses(bgColor?: string) {
  // keep the original theme color if no bg color is specified
  if (typeof bgColor !== 'string') {
    return;
  }
  const bgLuminosity = computeRelativeLuminosity(bgColor);
  return bgLuminosity <= 0.179 ? 'tvbVisTimeSeriesDark' : 'tvbVisTimeSeriesLight';
}
