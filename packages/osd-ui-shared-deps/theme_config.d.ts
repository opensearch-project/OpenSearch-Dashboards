/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Types for valid theme versions
 */
type ThemeVersion = 'v7' | 'v8' | 'v9';

/**
 * Types for valid theme color-scheme modes
 */
type ThemeMode = 'light' | 'dark';

/**
 * Types for valid theme tags (themeVersion + themeMode)
 * Note: used by @osd/optimizer
 */
export type ThemeTag = 'v7light' | 'v7dark' | 'v8light' | 'v8dark' | 'v9light' | 'v9dark';
export type ThemeTags = readonly ThemeTag[];

/**
 * List of valid ThemeTags
 * Note: used by @osd/optimizer
 */
export const themeTags: ThemeTags;

/**
 * Map of themeTag values to their version and mode
 * Note: this is used for ui display
 */
export const themeTagDetailMap: Map<ThemeTag, { version: ThemeVersion; mode: ThemeMode }>;

/**
 * Map of themeVersion values to labels
 * Note: this is used for ui display
 */
export const themeVersionLabelMap: Record<string, string>;

/**
 * Map of labels and versions to themeVersion values
 * Note: this is used to correct incorrectly persisted ui settings
 */
export const themeVersionValueMap: Record<string, string>;

/**
 * Theme CSS distributable filenames by themeVersion and themeMode
 * Note: used by bootstrap template
 */
export const themeCssDistFilenames: Record<string, Record<string, string>>;

/**
 * KUI CSS distributable filenames by themeVersion and themeMode
 * Note: used by bootstrap template
 */
export const kuiCssDistFilenames: Record<string, Record<string, string>>;
