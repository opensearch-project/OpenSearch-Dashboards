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

import https from 'https';
import http from 'http';
import { URL } from 'url';
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
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const requestModule = parsedUrl.protocol === 'https:' ? https : http;

      const req = requestModule.request(
        url,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          timeout: 5000, // 5 second timeout
        },
        (res) => {
          if (res.statusCode !== 200) {
            logger.error(`Error fetching banner config: HTTP status ${res.statusCode}`);
            resolve(null);
            return;
          }

          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const jsonData = JSON.parse(data);
              resolve(jsonData);
            } catch (error) {
              logger.error(`Error parsing banner config JSON: ${error}`);
              resolve(null);
            }
          });
        }
      );

      req.on('error', (error) => {
        logger.error(`Error fetching banner config: ${error.message}`);
        resolve(null);
      });

      req.on('timeout', () => {
        req.destroy();
        logger.error('Request timeout while fetching banner config');
        resolve(null);
      });

      req.end();
    } catch (error) {
      logger.error(`Error creating request for banner config: ${error}`);
      resolve(null);
    }
  });
}
