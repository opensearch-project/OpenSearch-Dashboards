/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PartialTheme, Theme } from '@elastic/charts';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { AppPluginStartDependencies } from '../../types';

/**
 * Hook to access the charts theme service from OpenSearch Dashboards context
 */
export const useChartsThemeService = () => {
  const { services } = useOpenSearchDashboards<AppPluginStartDependencies>();

  if (!services?.charts?.theme) {
    throw new Error(
      'Charts theme service not available. Make sure charts plugin is properly loaded.'
    );
  }

  return services.charts.theme;
};

/**
 * Hook to get the current charts theme with automatic light/dark mode switching
 * @returns PartialTheme - The current EUI charts theme
 */
export const useChartsTheme = (): PartialTheme => {
  try {
    const themeService = useChartsThemeService();
    return themeService.useChartsTheme();
  } catch (error) {
    // Charts theme service not available, using fallback theme
    return {}; // Fallback empty theme
  }
};

/**
 * Hook to get the current charts base theme with automatic light/dark mode switching
 * @returns Theme - The current Elastic Charts base theme (LIGHT_THEME or DARK_THEME)
 */
export const useChartsBaseTheme = (): Theme => {
  try {
    const themeService = useChartsThemeService();
    return themeService.useChartsBaseTheme();
  } catch (error) {
    // Charts base theme service not available, using fallback theme
    // Return a basic light theme object as fallback
    return {
      colors: {
        vizColors: ['#006BB4', '#017D73', '#F5A700', '#BD271E', '#DD0A73'],
        defaultVizColor: '#006BB4',
      },
      background: {
        color: '#FFFFFF',
      },
    };
  }
};

/**
 * Hook to get the current dark mode state
 * @returns boolean - True if dark mode is enabled, false otherwise
 */
export const useDarkMode = (): boolean => {
  const themeService = useChartsThemeService();
  return themeService.useDarkMode();
};

/**
 * Utility function to merge custom theme overrides with the base charts theme
 * @param customTheme - Custom theme overrides to apply
 * @param baseTheme - Base theme to merge with (defaults to current charts theme)
 * @returns PartialTheme - Merged theme with custom overrides
 */
export const mergeChartsTheme = (
  customTheme: Partial<PartialTheme>,
  baseTheme?: PartialTheme
): PartialTheme => {
  const theme = baseTheme || {};

  return {
    ...theme,
    ...customTheme,
    // Deep merge specific theme properties that are commonly customized
    colors: {
      ...theme.colors,
      ...customTheme.colors,
    },
    axes: {
      ...theme.axes,
      ...customTheme.axes,
    },
    background: {
      ...theme.background,
      ...customTheme.background,
    },
  };
};

/**
 * Utility function to get chart colors that work well with the current theme
 * @param isDarkMode - Whether dark mode is active
 * @returns Array of color strings suitable for chart series
 */
export const getThemeAwareChartColors = (isDarkMode: boolean): string[] => {
  // These colors are designed to work well in both light and dark modes
  // and follow EUI's color palette guidelines
  if (isDarkMode) {
    return [
      '#1BA9F5', // Blue
      '#7DE2D1', // Teal
      '#F990C0', // Pink
      '#D36086', // Rose
      '#9170B8', // Purple
      '#CA8EAE', // Light Purple
      '#F5A35C', // Orange
      '#E7664C', // Red-Orange
    ];
  } else {
    return [
      '#006BB4', // Blue
      '#017D73', // Teal
      '#BD271E', // Red
      '#DD0A73', // Magenta
      '#7B4397', // Purple
      '#B9A888', // Tan
      '#E7664C', // Orange
      '#54B399', // Green
    ];
  }
};

/**
 * Utility function to apply consistent styling for graph visualization charts
 * @param customOverrides - Optional custom theme overrides
 * @returns PartialTheme - Theme optimized for graph visualizations
 */
export const getGraphVisualizationTheme = (
  customOverrides?: Partial<PartialTheme>
): PartialTheme => {
  const baseOverrides: Partial<PartialTheme> = {
    // Ensure good contrast and readability for time series data
    axes: {
      gridLine: {
        horizontal: {
          visible: true,
          strokeWidth: 1,
        },
        vertical: {
          visible: true,
          strokeWidth: 1,
        },
      },
      tickLine: {
        visible: true,
        strokeWidth: 1,
      },
    },
    // Optimize crosshairs for time series interaction
    crosshair: {
      band: {
        visible: true,
        fill: 'transparent',
      },
      line: {
        visible: true,
        strokeWidth: 1,
      },
    },
  };

  return customOverrides ? mergeChartsTheme(customOverrides, baseOverrides) : baseOverrides;
};
