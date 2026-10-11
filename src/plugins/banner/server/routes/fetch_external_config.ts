/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { BannerConfig } from '../../common';

/**
 * Fetches banner configuration from an external URL
 * @param url The URL to fetch the banner configuration from
 * @param logger Logger instance for logging errors
 * @returns The banner configuration or null if there was an error
 */
export async function fetchExternalConfig(
  url: string,
  logger: { error: (message: string) => void }
): Promise<Partial<BannerConfig> | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.error(`Error fetching banner config: HTTP status ${response.status}`);
      return null;
    }

    const jsonData = await response.json();
    return jsonData;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      logger.error('Request timeout while fetching banner config');
    } else if (error instanceof SyntaxError) {
      logger.error(`Error parsing banner config JSON: ${error}`);
    } else {
      logger.error(`Error fetching banner config: ${error}`);
    }
    return null;
  }
}
