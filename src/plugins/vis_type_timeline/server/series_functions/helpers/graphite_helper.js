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
 * Check whether customer input URL is denied
 * This function first check the format of URL, URL has be in the format as
 * scheme://server/path/resource otherwise an TypeError would be thrown
 * Then IPCIDR check if a specific IP address fall in the
 * range of an IP address block
 * @param {string} configuredUrls
 * @param {Array|string} deniedIPs
 * @returns {boolean} true if the configuredUrl is denied
 */
function isDeniedURL(configuredUrl, deniedIPs) {
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
  const isDenied = deniedIPs.some((deniedIP) => new IPCIDR(deniedIP).contains(ip));
  return isDenied;
}
/**
 * Check configured url using denylist and allowlist
 * If allowlist is used, return false if allowlist does not contain configured url
 * If denylist is used, return false if denylist contains configured url
 * If both allowlist and denylist are used, check denylist first then allowlist
 * @param {Array|string} deniedIPs
 * @param {Array|string} allowedUrls
 * @param {string} configuredUrls
 * @returns {boolean} true if the configuredUrl is valid
 */
function isValidConfig(deniedIPs, allowedUrls, configuredUrl) {
  if (deniedIPs.length === 0) {
    if (!allowedUrls.includes(configuredUrl)) return false;
  } else if (allowedUrls.length === 0) {
    if (exports.isDeniedURL(configuredUrl, deniedIPs)) return false;
  } else {
    if (exports.isDeniedURL(configuredUrl, deniedIPs) || !allowedUrls.includes(configuredUrl))
      return false;
  }
  return true;
}
export { getIpAddress, isDeniedURL, isValidConfig };
