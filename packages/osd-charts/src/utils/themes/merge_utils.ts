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

import { mergePartial } from '../common';
import { LIGHT_THEME } from './light_theme';
import { LineAnnotationStyle, PartialTheme, RectAnnotationStyle, Theme } from './theme';

/** @public */
export const DEFAULT_ANNOTATION_LINE_STYLE: LineAnnotationStyle = {
  line: {
    stroke: '#777',
    strokeWidth: 1,
    opacity: 1,
  },
  details: {
    fontSize: 10,
    fontFamily: 'sans-serif',
    fontStyle: 'normal',
    fill: '#777',
    padding: 0,
  },
};
/** @public */
export const DEFAULT_ANNOTATION_RECT_STYLE: RectAnnotationStyle = {
  stroke: '#FFEEBC',
  strokeWidth: 0,
  opacity: 0.25,
  fill: '#FFEEBC',
};

/** @public */
export function mergeWithDefaultAnnotationLine(config?: Partial<LineAnnotationStyle>): LineAnnotationStyle {
  const defaultLine = DEFAULT_ANNOTATION_LINE_STYLE.line;
  const defaultDetails = DEFAULT_ANNOTATION_LINE_STYLE.details;
  const mergedConfig: LineAnnotationStyle = { ...DEFAULT_ANNOTATION_LINE_STYLE };

  if (!config) {
    return mergedConfig;
  }

  if (config.line) {
    mergedConfig.line = {
      ...defaultLine,
      ...config.line,
    };
  }

  if (config.details) {
    mergedConfig.details = {
      ...defaultDetails,
      ...config.details,
    };
  }

  return mergedConfig;
}

/** @public */
export function mergeWithDefaultAnnotationRect(config?: Partial<RectAnnotationStyle>): RectAnnotationStyle {
  if (!config) {
    return DEFAULT_ANNOTATION_RECT_STYLE;
  }

  return {
    ...DEFAULT_ANNOTATION_RECT_STYLE,
    ...config,
  };
}

/**
 * Merge theme or themes with a base theme
 *
 * priority is based on spatial order
 *
 * @param theme - primary partial theme
 * @param defaultTheme - base theme
 * @param axillaryThemes - additional themes to be merged
 *
 * @public
 */
export function mergeWithDefaultTheme(
  theme: PartialTheme,
  defaultTheme: Theme = LIGHT_THEME,
  axillaryThemes: PartialTheme[] = [],
): Theme {
  return mergePartial(defaultTheme, theme, { mergeOptionalPartialValues: true }, axillaryThemes);
}
