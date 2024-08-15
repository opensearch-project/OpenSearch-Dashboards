/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extracts the locale value from a given URL.
 *
 * This function looks for the 'locale' parameter in either the main query string
 * or in the hash part of the URL. It supports two valid formats:
 * 1. As a regular query parameter: "?locale=xx-XX"
 * 2. In the hash with a proper query string: "#/?locale=xx-XX"
 *
 * If an invalid format is detected, it sets a warning message on the window object.
 *
 * @param url - The URL to extract the locale from
 * @returns The locale value if found and valid, or null otherwise
 */
export function getLocaleInUrl(url: string): string | null {
  let urlObject: URL;
  // Attempt to parse the URL, return null if invalid
  try {
    urlObject = new URL(url, window.location.origin);
  } catch (error) {
    setInvalidUrlWarning();
    return null;
  }

  let localeValue: string | null = null;

  // Check for locale in the main query string
  if (urlObject.searchParams.has('locale')) {
    localeValue = urlObject.searchParams.get('locale');
  }
  // Check for locale in the hash, but only if it's in proper query string format
  else if (urlObject.hash.includes('?')) {
    const hashParams = new URLSearchParams(urlObject.hash.split('?')[1]);
    if (hashParams.has('locale')) {
      localeValue = hashParams.get('locale');
    }
  }

  // Check for non standard query format:
  if (localeValue === null && url.includes('&locale=')) {
    setInvalidUrlWithLocaleWarning();
    return 'en';
  }

  // Return the locale value if found, or 'en' if not found
  return localeValue && localeValue.trim() !== '' ? localeValue : 'en';
}

function setInvalidUrlWarning(): void {
  (window as any).__localeWarning = {
    title: 'Invalid URL Format',
    text: 'The provided URL is not in a valid format.',
  };
}

function setInvalidUrlWithLocaleWarning(): void {
  (window as any).__localeWarning = {
    title: 'Invalid URL Format',
    text:
      'The locale parameter is not in a valid URL format. ' +
      'Use either "?locale=xx-XX" in the main URL or "#/?locale=xx-XX" in the hash. ' +
      'For example: "yourapp.com/page?locale=en-US" or "yourapp.com/page#/?locale=en-US".',
  };
}
