/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extracts the locale value and parameter from a given URL string.
 *
 * @param url - The full URL string to parse
 * @returns An object with localeValue, localeParam or null if not found, and updatedUrl or url if no updates.
 */
export function extractLocaleInfo(
  url: string
): { localeValue: string | null; localeParam: string | null; updatedUrl: string } {
  const patterns = [
    /[#&?](i18n-locale)=([^&/]+)/i, // Standard query parameter
    /#\/&(i18n-locale)=([^&/]+)/i, // After hash and slash
    /\/&(i18n-locale)=([^&/]+)/i, // After path and slash
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const localeValue = match[2];
      const localeParam = `${match[1]}=${match[2]}`;
      const updatedUrl = url.replace(match[0], '');
      return { localeValue, localeParam, updatedUrl };
    }
  }

  return { localeValue: 'en', localeParam: null, updatedUrl: url };
}

/**
 * Extracts a dynamically added locale parameter from a URL and restructures the URL
 * to include this locale parameter in a consistent, functional manner.
 *
 * This function is specifically designed to handle cases where '&i18n-locale=<locale>'
 * has been appended to the URL, potentially in a position that could cause issues
 * with OpenSearch Dashboards' URL parsing or functionality.
 *
 * The restructuring is necessary because simply appending the locale parameter
 * to certain URL structures can lead to parsing errors or the parameter being ignored.
 *
 * The function handles various URL structures to ensure the locale parameter
 * is placed in a position where it will be correctly parsed and utilized by
 * OpenSearch Dashboards, while maintaining the integrity of existing URL components.
 *
 * URL Components:
 * - basePath: The part of the URL before the hash (#). It typically includes the domain and application path.
 * - hashPath: The part of the URL after the hash (#) but before any query parameters (?).
 * - hashQuery: The query parameters after the hashPath. In OpenSearch Dashboards, this often contains
 *              RISON-encoded data and never ends with a slash (/) to avoid RISON parsing errors.
 *
 * This function handles three main categories of URLs:
 * 1. basePath + # + hashPath (including when hashPath is '/' or empty)
 *    Before: basePath#hashPath&i18n-locale=zh-CN
 *    After:  basePath#hashPath?i18n-locale=zh-CN
 *    Restructuring rationale: The '&' is changed to '?' because there were no existing
 *    query parameters after the hashPath. This ensures the locale is treated as a proper
 *    query parameter and not mistakenly considered part of the hashPath.
 *
 * 2. basePath + # + hashPath + ? + hashQuery
 *    Before: basePath#hashPath?hashQuery&i18n-locale=zh-CN
 *    After:  basePath#hashPath?hashQuery&i18n-locale=zh-CN
 *    Restructuring rationale: The locale parameter is appended to existing query parameters.
 *    No change in structure is needed as it's already in the correct position.
 *
 * 3. basePath only
 *    Before: basePath&i18n-locale=zh-CN
 *    After:  basePath?i18n-locale=zh-CN
 *    Restructuring rationale: The '&' is changed to '?' because there were no existing
 *    query parameters in the basePath. This ensures the locale is recognized as the
 *    start of the query string rather than being misinterpreted as part of the path.
 *
 * The function performs the following steps:
 * 1. Extracts the locale parameter from its current position in the URL.
 * 2. Removes the locale parameter from its original position.
 * 3. Reconstructs the URL, placing the locale parameter in the correct position
 *    based on the URL structure to ensure proper parsing by OpenSearch Dashboards.
 * 4. Updates the browser's URL without causing a page reload.
 *
 * @param {string} url - The full URL to process
 * @returns {string|null} The extracted locale value, or null if no locale was found
 */

export function getAndUpdateLocaleInUrl(url: string): string | null {
  let fullUrl = '';
  const { localeValue, localeParam, updatedUrl } = extractLocaleInfo(url);

  if (localeValue && localeParam) {
    const [basePath, hashPart] = updatedUrl.split('#');

    if (hashPart !== undefined) {
      const [hashPath, hashQuery] = hashPart.split('?');
      if (hashQuery) {
        // Category 2: basePath + # + hashPath + ? + hashQuery
        fullUrl = `${basePath}#${hashPath}?${hashQuery}&${localeParam}`;
      } else {
        // Category 1: basePath + # + hashPath (including when hashPath is '/' or empty)
        fullUrl = `${basePath}#${hashPath}?${localeParam}`;
      }
    } else {
      // Category 3: basePath only
      fullUrl = `${basePath}?${localeParam}`;
    }

    // Update the URL without causing a page reload
    window.history.replaceState(null, '', fullUrl);
    return localeValue;
  }

  return 'en';
}
