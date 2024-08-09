/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The purpose of this file is to centalize theme configuration so it can be used across server,
 * client, and dev tooling. DO NOT add dependencies that wouldn't operate in all of these contexts.
 */

const DEFAULT_THEME_TAG = 'v8light';
const DEFAULT_THEME_VERSION = 'v8';
const THEME_MODES = ['light', 'dark'];
const THEME_VERSION_LABEL_MAP = {
  v7: 'v7',
  v8: 'Next (preview)',
};
const THEME_VERSION_VALUE_MAP = {
  // allow version lookup by label ...
  ...Object.fromEntries(Object.entries(THEME_VERSION_LABEL_MAP).map((a) => a.reverse())),
  // ... or by the version itself
  ...Object.fromEntries(Object.keys(THEME_VERSION_LABEL_MAP).map((v) => [v, v])),
};
const THEME_VERSIONS = Object.keys(THEME_VERSION_LABEL_MAP);
const THEME_TAGS = THEME_VERSIONS.flatMap((v) => THEME_MODES.map((m) => `${v}${m}`));

exports.defaultThemeVersion = DEFAULT_THEME_VERSION;

exports.themeVersionLabelMap = THEME_VERSION_LABEL_MAP;

exports.themeVersionValueMap = THEME_VERSION_VALUE_MAP;

exports.themeTags = THEME_TAGS;

exports.resolveThemeTag = (themeTag) =>
  THEME_TAGS.includes(themeTag) ? themeTag : DEFAULT_THEME_TAG;

exports.resolveThemeVersion = (themeTag) =>
  exports.resolveThemeTag(themeTag).replace(/(light|dark)$/, '');

exports.themeCssDistFilenames = THEME_VERSIONS.reduce((map, v) => {
  map[v] = THEME_MODES.reduce((acc, m) => {
    acc[m] = `osd-ui-shared-deps.${v}.${m}.css`;
    return acc;
  }, {});
  return map;
}, {});

exports.kuiCssDistFilenames = {
  v7: { dark: 'kui_dark.css', light: 'kui_light.css' },
  v8: { dark: 'kui_next_dark.css', light: 'kui_next_light.css' },
};
