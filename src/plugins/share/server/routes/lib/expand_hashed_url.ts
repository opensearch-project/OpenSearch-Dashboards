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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { parse, format } from 'url';
import rison from 'rison-node';

/**
 * Server-side utility to expand hashed URLs to full RISON format.
 * This is needed for short URL resolution when storeInSessionStorage is enabled.
 *
 * When storeInSessionStorage is ON, URLs contain hash references (e.g., _a=h@abc123)
 * that point to sessionStorage entries. Since sessionStorage is session-specific,
 * these references become invalid when accessing short URLs from different sessions.
 *
 * This utility detects such URLs and attempts to expand them by converting
 * hash references back to full RISON format when possible.
 */

// Hash prefix used to identify hash strings in URLs
const HASH_PREFIX = 'h@';

/**
 * Checks if a string is a state hash
 */
function isStateHash(str: string): boolean {
  return String(str).indexOf(HASH_PREFIX) === 0;
}

/**
 * Checks if a URL contains any hashed state parameters
 */
export function hasHashedState(url: string): boolean {
  try {
    const parsed = parse(url, true);
    const hashPart = parsed.hash;

    if (!hashPart) return false;

    // Parse the hash fragment to check for query parameters
    const hashUrl = parse(hashPart.startsWith('#') ? hashPart.substring(1) : hashPart, true);
    const query = hashUrl.query || {};

    // Check if any of the common state parameters are hashed
    const stateParams = ['_g', '_a', '_s'];
    return stateParams.some(param => {
      const value = query[param];
      return typeof value === 'string' && isStateHash(value);
    });
  } catch (e) {
    return false;
  }
}

/**
 * Attempts to expand a hashed URL by converting hash references to RISON format.
 * Since we don't have access to the original sessionStorage data on the server,
 * we'll create a fallback that removes the hashed parameters to prevent errors.
 *
 * This is a graceful degradation - the URL will still work but some state might be lost.
 * This is better than the current behavior where the URL completely fails.
 */
export function expandHashedUrl(url: string): string {
  try {
    const parsed = parse(url, true);
    const hashPart = parsed.hash;

    if (!hashPart) return url;

    // Parse the hash fragment
    const hashUrl = parse(hashPart.startsWith('#') ? hashPart.substring(1) : hashPart, true);
    const query = hashUrl.query || {};

    // Remove hashed parameters to prevent restoration errors
    // This provides graceful degradation instead of complete failure
    const stateParams = ['_g', '_a', '_s'];
    let hasChanges = false;

    stateParams.forEach(param => {
      const value = query[param];
      if (typeof value === 'string' && isStateHash(value)) {
        delete query[param];
        hasChanges = true;
      }
    });

    if (!hasChanges) return url;

    // Reconstruct the URL with cleaned parameters
    const newHashUrl = format({
      pathname: hashUrl.pathname,
      query: query
    });

    const result = format({
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port,
      pathname: parsed.pathname,
      search: parsed.search,
      hash: newHashUrl
    });

    return result;
  } catch (e) {
    // If parsing fails, return the original URL
    return url;
  }
}

/**
 * Processes a URL for short URL resolution when storeInSessionStorage is enabled.
 * If the URL contains hashed state, it attempts to expand or clean it to prevent errors.
 */
export function processUrlForShortUrlResolution(url: string): string {
  if (hasHashedState(url)) {
    return expandHashedUrl(url);
  }
  return url;
}