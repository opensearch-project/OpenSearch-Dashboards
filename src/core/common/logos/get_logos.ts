/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { deepFreeze } from '@osd/std';
import type { ImageItem, LogoItem, Logos } from './types';
import { ColorScheme, ImageType } from './constants';
import { Branding } from '../../types';

// The logos are stored at `src/core/server/core_app/assets/logos` to have a pretty URL
export const OPENSEARCH_DASHBOARDS_THEMED = 'ui/logos/opensearch_dashboards.svg';
export const OPENSEARCH_DASHBOARDS_ON_LIGHT = 'ui/logos/opensearch_dashboards_on_light.svg';
export const OPENSEARCH_DASHBOARDS_ON_DARK = 'ui/logos/opensearch_dashboards_on_dark.svg';
export const OPENSEARCH_THEMED = 'ui/logos/opensearch.svg';
export const OPENSEARCH_ON_LIGHT = 'ui/logos/opensearch_on_light.svg';
export const OPENSEARCH_ON_DARK = 'ui/logos/opensearch_on_dark.svg';
export const MARK_THEMED = 'ui/logos/opensearch_mark.svg';
export const MARK_ON_LIGHT = 'ui/logos/opensearch_mark_on_light.svg';
export const MARK_ON_DARK = 'ui/logos/opensearch_mark_on_dark.svg';
export const CENTER_MARK_THEMED = 'ui/logos/opensearch_center_mark.svg';
export const CENTER_MARK_ON_LIGHT = 'ui/logos/opensearch_center_mark_on_light.svg';
export const CENTER_MARK_ON_DARK = 'ui/logos/opensearch_center_mark_on_dark.svg';
export const ANIMATED_MARK_THEMED = 'ui/logos/opensearch_spinner.svg';
export const ANIMATED_MARK_ON_LIGHT = 'ui/logos/opensearch_spinner_on_light.svg';
export const ANIMATED_MARK_ON_DARK = 'ui/logos/opensearch_spinner_on_dark.svg';

interface AssetOption {
  url?: string;
  type: ImageType;
  colorScheme: ColorScheme;
}

/**
 * Loops through the assets to find one that has a `url` set. If dark color-scheme asset is needed,
 * light assets can be used for fallback but not vice vera.
 * Place defaults at the end of assets to use them as final fallbacks.
 * `assets` should have dark - light assets of each type, one after the other.
 */
const getFirstUsableAsset = (
  assets: AssetOption[],
  requireDarkColorScheme: boolean = false
): ImageItem => {
  for (const { url, type, colorScheme } of assets) {
    if (url && (requireDarkColorScheme || colorScheme === 'light')) return { url, type };
  }

  // `assets` will contain the default assets so the code will never get here
  throw new Error('No default asset found');
};

const getLogo = (assets: AssetOption[], requireDarkColorScheme: boolean = false): LogoItem => {
  const lightAsset = getFirstUsableAsset(assets, false);
  const darkAsset = getFirstUsableAsset(assets, true);
  const colorSchemeAsset = requireDarkColorScheme ? darkAsset : lightAsset;

  return {
    light: lightAsset,
    dark: darkAsset,
    url: colorSchemeAsset.url,
    type: colorSchemeAsset.type!,
  };
};

/**
 * Generates all the combinations of logos based on the color-scheme and branding config
 *
 * Ideally, the default logos would point to color-scheme-aware (aka themed) imagery while the dark and light
 * subtypes reference the dark and light variants. Sadly, Safari doesn't support color-schemes in SVGs yet.
 * https://bugs.webkit.org/show_bug.cgi?id=199134
 */
export const getLogos = (branding: Branding = {}, serverBasePath: string): Logos => {
  const {
    logo: { defaultUrl: customLogoUrl, darkModeUrl: customDarkLogoUrl } = {},
    mark: { defaultUrl: customMarkUrl, darkModeUrl: customDarkMarkUrl } = {},
    loadingLogo: { defaultUrl: customAnimatedUrl, darkModeUrl: customDarkAnimatedMarkUrl } = {},
    darkMode = false,
  } = branding;

  // OSD logos
  const defaultLightColorSchemeOpenSearchDashboards = `${serverBasePath}/${OPENSEARCH_DASHBOARDS_ON_LIGHT}`;
  const defaultDarkColorSchemeOpenSearchDashboards = `${serverBasePath}/${OPENSEARCH_DASHBOARDS_ON_DARK}`;
  // OS logos
  const defaultLightColorSchemeOpenSearch = `${serverBasePath}/${OPENSEARCH_ON_LIGHT}`;
  const defaultDarkColorSchemeOpenSearch = `${serverBasePath}/${OPENSEARCH_ON_DARK}`;
  // OS marks
  const defaultLightColorSchemeMark = `${serverBasePath}/${MARK_ON_LIGHT}`;
  const defaultDarkColorSchemeMark = `${serverBasePath}/${MARK_ON_DARK}`;
  // OS marks variant padded (but not centered) within the container
  // ToDo: This naming is misleading; figure out if the distinction could be handled with CSS padding alone
  // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4714
  const defaultLightColorSchemeCenterMark = `${serverBasePath}/${CENTER_MARK_ON_LIGHT}`;
  const defaultDarkColorSchemeCenterMark = `${serverBasePath}/${CENTER_MARK_ON_DARK}`;
  // OS animated marks
  const defaultLightColorSchemeAnimatedMark = `${serverBasePath}/${ANIMATED_MARK_ON_LIGHT}`;
  const defaultDarkColorSchemeAnimatedMark = `${serverBasePath}/${ANIMATED_MARK_ON_DARK}`;

  const colorScheme: ColorScheme = darkMode ? ColorScheme.DARK : ColorScheme.LIGHT;

  // It is easier to read the lines unwrapped, so
  // prettier-ignore
  return deepFreeze({
    OpenSearch: getLogo([
      { url: customDarkLogoUrl, type: ImageType.CUSTOM, colorScheme: ColorScheme.DARK },
      { url: customLogoUrl, type: ImageType.CUSTOM, colorScheme: ColorScheme.LIGHT },
      { url: defaultDarkColorSchemeOpenSearch, type: ImageType.DEFAULT, colorScheme: ColorScheme.DARK },
      { url: defaultLightColorSchemeOpenSearch, type: ImageType.DEFAULT, colorScheme: ColorScheme.LIGHT },
    ], darkMode),

    Application: getLogo([
      { url: customDarkLogoUrl, type: ImageType.CUSTOM, colorScheme: ColorScheme.DARK },
      { url: customLogoUrl, type: ImageType.CUSTOM, colorScheme: ColorScheme.LIGHT },
      { url: defaultDarkColorSchemeOpenSearchDashboards, type: ImageType.DEFAULT, colorScheme: ColorScheme.DARK },
      { url: defaultLightColorSchemeOpenSearchDashboards, type: ImageType.DEFAULT, colorScheme: ColorScheme.LIGHT },
    ], darkMode),

    Mark: getLogo([
      { url: customDarkMarkUrl, type: ImageType.CUSTOM, colorScheme: ColorScheme.DARK },
      { url: customMarkUrl, type: ImageType.CUSTOM, colorScheme: ColorScheme.LIGHT },
      { url: defaultDarkColorSchemeMark, type: ImageType.DEFAULT, colorScheme: ColorScheme.DARK },
      { url: defaultLightColorSchemeMark, type: ImageType.DEFAULT, colorScheme: ColorScheme.LIGHT },
    ], darkMode),

    CenterMark: getLogo([
      { url: customDarkMarkUrl, type: ImageType.CUSTOM, colorScheme: ColorScheme.DARK },
      { url: customMarkUrl, type: ImageType.CUSTOM, colorScheme: ColorScheme.LIGHT },
      { url: defaultDarkColorSchemeCenterMark, type: ImageType.DEFAULT, colorScheme: ColorScheme.DARK },
      { url: defaultLightColorSchemeCenterMark, type: ImageType.DEFAULT, colorScheme: ColorScheme.LIGHT },
    ], darkMode),

    AnimatedMark: getLogo([
      { url: customDarkAnimatedMarkUrl, type: ImageType.CUSTOM, colorScheme: ColorScheme.DARK },
      { url: customAnimatedUrl, type: ImageType.CUSTOM, colorScheme: ColorScheme.LIGHT },
      { url: customDarkMarkUrl, type: ImageType.ALTERNATIVE, colorScheme: ColorScheme.DARK },
      { url: customMarkUrl, type: ImageType.ALTERNATIVE, colorScheme: ColorScheme.LIGHT },
      { url: defaultDarkColorSchemeAnimatedMark, type: ImageType.DEFAULT, colorScheme: ColorScheme.DARK },
      { url: defaultLightColorSchemeAnimatedMark, type: ImageType.DEFAULT, colorScheme: ColorScheme.LIGHT },
    ], darkMode),

    colorScheme,
  });
};
