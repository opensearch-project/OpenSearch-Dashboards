/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import dns from 'dns-sync';
import IPCIDR from 'ip-cidr';
/**
 * Resolve hostname to IP address
 * @param {object} urlObject
 * @returns {string} configuredIP
 * or null if it cannot be resolve
 * According to RFC, all IPv6 IP address needs to be in []
 * such as [::1]
 * So if we detect a IPv6 address, we remove brackets
 */
function getIpAddress(urlObject) {
  const hostname = urlObject.hostname;
  const configuredIP = dns.resolve(hostname);
  if (configuredIP) {
    return configuredIP;
  }
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    return hostname.substr(1).slice(0, -1);
  }
  return null;
}
/**
 * Check whether customer input URL is blocked
 * This function first check the format of URL, URL has be in the format as
 * scheme://server/path/resource otherwise an TypeError would be thrown
 * Then IPCIDR check if a specific IP address fall in the
 * range of an IP address block
 * @param {string} configuredUrls
 * @param {Array|string} blockedIPs
 * @returns {boolean} true if the configuredUrl is blocked
 */
function isBlockedURL(configuredUrl, blockedIPs) {
  let configuredUrlObject;
  try {
    configuredUrlObject = new URL(configuredUrl);
  } catch (err) {
    return true;
  }
  const ip = exports.getIpAddress(configuredUrlObject);
  if (!ip) {
    return true;
  }
  const isBlocked = blockedIPs.some((blockedIP) => new IPCIDR(blockedIP).contains(ip));
  return isBlocked;
}
/**
 * Check configured url using blocklist and allowlist
 * If allowlist is used, return false if allowlist does not contain configured url
 * If blocklist is used, return false if blocklist contains configured url
 * If both allowlist and blocklist are used, check blocklist first then allowlist
 * @param {Array|string} blockedIPs
 * @param {Array|string} allowedUrls
 * @param {string} configuredUrls
 * @returns {boolean} true if the configuredUrl is valid
 */
function isValidConfig(blockedIPs, allowedUrls, configuredUrl) {
  if (blockedIPs.length === 0) {
    if (!allowedUrls.includes(configuredUrl)) return false;
  } else if (allowedUrls.length === 0) {
    if (exports.isBlockedURL(configuredUrl, blockedIPs)) return false;
  } else {
    if (exports.isBlockedURL(configuredUrl, blockedIPs) || !allowedUrls.includes(configuredUrl))
      return false;
  }
  return true;
}
export { getIpAddress, isBlockedURL, isValidConfig };
