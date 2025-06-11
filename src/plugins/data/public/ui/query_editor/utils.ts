/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const simplifiedPPLSupportedApp = ['explore'];

/**
 * Determines the effective language for autocomplete based on the base language and current app ID.
 * When using PPL language in the explore app, it returns 'PPL_Simplified' for enhanced autocomplete.
 *
 * @param baseLanguage - The original query language (e.g., 'PPL', 'SQL', 'DQL')
 * @param currentAppId - The current application ID (e.g., 'explore', 'discover', 'dashboard')
 * @returns The effective language to use for autocomplete
 */
export const getEffectiveLanguageForAutoComplete = (
  baseLanguage: string,
  currentAppId: string
): string => {
  // TODO: Update it to make it reusable across other Apps
  if (baseLanguage === 'PPL' && simplifiedPPLSupportedApp.includes(currentAppId)) {
    return 'PPL_Simplified';
  }
  return baseLanguage;
};
