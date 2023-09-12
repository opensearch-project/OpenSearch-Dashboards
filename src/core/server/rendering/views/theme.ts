/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { deepFreeze } from '@osd/std';

export enum ThemeColorSchemes {
  LIGHT = 'light',
  DARK = 'dark',
}
export const THEME_SOURCES: {
  [key: string]: {
    [key in ThemeColorSchemes]: string;
  };
} = deepFreeze({
  v7: {
    [ThemeColorSchemes.LIGHT]: '@elastic/eui/dist/eui_theme_light.json',
    [ThemeColorSchemes.DARK]: '@elastic/eui/dist/eui_theme_dark.json',
  },
  default: {
    [ThemeColorSchemes.LIGHT]: '@elastic/eui/dist/eui_theme_next_light.json',
    [ThemeColorSchemes.DARK]: '@elastic/eui/dist/eui_theme_next_dark.json',
  },
});

export const getThemeDefinitionSource = (
  theme: string,
  colorScheme: ThemeColorSchemes = ThemeColorSchemes.LIGHT
) => {
  const themeName = theme in THEME_SOURCES ? theme : 'default';
  return THEME_SOURCES[themeName][colorScheme];
};

export const getThemeDefinition = (
  theme: string,
  colorScheme: ThemeColorSchemes = ThemeColorSchemes.LIGHT
) => {
  const file = getThemeDefinitionSource(theme, colorScheme);
  return require(file);
};
