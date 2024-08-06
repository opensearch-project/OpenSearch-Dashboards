/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Types for valid theme tags (themeVersion + themeMode)
 * Note: used by @osd/optimizer
 */
export type ThemeTag = 'v7light' | 'v7dark' | 'v8light' | 'v8dark';
export type ThemeTags = readonly ThemeTag[];

/**
 * List of valid ThemeTags
 * Note: used by @osd/optimizer
 */
export const themeTags: ThemeTags;

/**
 * Default themeVersion
 */
export const defaultThemeVersion: string;

/**
 * Returns passed themeTag if valid, default if not
 */
export function resolveThemeTag(themeTag: string): ThemeTag;

/**
 * Returns themeVersion from themeTag if valid, the defaultThemeVersion if not
 */
export function resolveThemeVersion(themeTag: string): string;

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
