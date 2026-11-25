/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import dns, { promises as dnsPromises } from 'dns';
import { IPCIDR } from '@osd/utils';

export interface URLValidationResult {
  valid: boolean;
  error?: string; // Detailed error message for server logs
  userMessage?: string; // Safe message for client response
}

/**
 * Builds a `lookup` function for an http(s) agent that applies the denylist when the client
 * connects. isValidURL checks the address when a data source is saved, and the client resolves the
 * name again on each connection, so a name that changes its DNS answer after the check could
 * otherwise reach a denied address.
 *
 * Denied addresses are removed from the answer, so a connection only ever uses an address that
 * isValidURL would accept. The lookup fails only when every address is denied. Hosts that match an
 * allowlisted suffix use the normal lookup, exactly as isValidURL treats them. A literal IP
 * address never reaches a lookup function, which is why isValidURL still checks those.
 */
export const createGuardedLookup = (
  deniedIPs: string[],
  allowlistedSuffixes?: string[]
): typeof dns.lookup => {
  // Parse each range once. An entry that is not a valid CIDR is skipped, so a typo in the
  // configuration cannot throw inside the lookup callback and cannot stop a client from being created.
  const cidrs: IPCIDR[] = [];
  for (const deniedIP of deniedIPs) {
    try {
      cidrs.push(new IPCIDR(deniedIP));
    } catch {
      // ignore
    }
  }
  const isDenied = (address: string) =>
    !IPCIDR.isValidAddress(address) || cidrs.some((cidr) => cidr.contains(address));

  const guarded = (hostname: string, options: any, callback: any) => {
    if (allowlistedSuffixes?.some((suffix) => hostname.endsWith(suffix))) {
      return dns.lookup(hostname, options, callback);
    }
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    const lookupOptions = typeof options === 'number' ? { family: options } : options || {};

    dns.lookup(
      hostname,
      { ...lookupOptions, all: true },
      (err: NodeJS.ErrnoException | null, addresses: dns.LookupAddress[]) => {
        if (err) return callback(err);
        let allowed: dns.LookupAddress[];
        try {
          allowed = addresses.filter(({ address }) => !isDenied(address));
        } catch (error) {
          return callback(error);
        }
        if (allowed.length === 0) {
          return callback(new Error('Endpoint IP address is not allowed'));
        }
        if (lookupOptions.all) return callback(null, allowed);
        return callback(null, allowed[0].address, allowed[0].family);
      }
    );
  };
  return guarded as typeof dns.lookup;
};

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
