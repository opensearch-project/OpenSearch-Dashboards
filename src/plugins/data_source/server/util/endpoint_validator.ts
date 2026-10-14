/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as dnsPromises } from 'dns';
import { IPCIDR } from '@osd/utils';

export interface URLValidationResult {
  valid: boolean;
  error?: string; // Detailed error message for server logs
  userMessage?: string; // Safe message for client response
}

export async function isValidURL(
  endpoint: string,
  deniedIPs?: string[],
  allowlistedSuffixes?: string[]
): Promise<URLValidationResult> {
  // Check the format of URL, URL has be in the format as
  // scheme://server/path/resource otherwise an TypeError
  // would be thrown.
  let url;
  try {
    url = new URL(endpoint);
  } catch (err) {
    return {
      valid: false,
      error: `Invalid URL format: ${err instanceof Error ? err.message : String(err)}`,
      userMessage: 'Invalid URL format',
    };
  }

  if (!(Boolean(url) && (url.protocol === 'http:' || url.protocol === 'https:'))) {
    return {
      valid: false,
      error: `Invalid protocol: ${url.protocol}. Only http and https are allowed`,
      userMessage: 'Invalid protocol. Only http and https are allowed',
    };
  }

  if (allowlistedSuffixes && allowlistedSuffixes.length > 0) {
    const isallowlisted = allowlistedSuffixes.some((suffix) => url.hostname.endsWith(suffix));
    if (isallowlisted) {
      return { valid: true };
    }
  }

  const ip = await getIpAddress(url);
  if (!ip) {
    return {
      valid: false,
      error: `Failed to resolve hostname "${url.hostname}" to IP address`,
      userMessage: 'Unable to resolve hostname to IP address',
    };
  }

  // IP CIDR check if a specific IP address fall in the
  // range of an IP address block
  for (const deniedIP of deniedIPs ?? []) {
    const cidr = new IPCIDR(deniedIP);
    if (cidr.contains(ip)) {
      const range = cidr.toRange();
      return {
        valid: false,
        error: `IP ${ip} is blocked by denied range ${deniedIP} (${range[0]} - ${range[1]})`,
        userMessage: 'Endpoint IP address is not allowed',
      };
    }
  }

  return { valid: true };
}

/**
 * Resolve hostname to IP address
 * @param {object} urlObject
 * @returns {Promise<string | null>} configuredIP
 * or null if it cannot be resolved.
 * According to RFC, all IPv6 IP address needs to be in []
 * such as [::1].
 * So if we detect a IPv6 address, we remove brackets.
 */
async function getIpAddress(urlObject: URL): Promise<string | null> {
  const hostname = urlObject.hostname;
  try {
    const { address } = await dnsPromises.lookup(hostname);
    if (address) {
      return address;
    }
  } catch {
    // Fall through to bracketed-IPv6 handling below.
  }
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    return hostname.substr(1).slice(0, -1);
  }
  return null;
}
