/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generate an updated URL by removing the "data-explorer" segment
 * from the current location and appending the provided URL.
 *
 * @param {string} url - The URL to append to the current location.
 * @returns {string} The updated URL.
 */
export function generateDocViewsUrl(url: string) {
  // split the current location into segments
  const urlSegments = window.location.href.split('/');
  // find the index of the "data-explorer" segment
  const indexOfDataExplorerInUrl = urlSegments.indexOf('data-explorer');
  // if "data-explorer" is found, remove it from the array
  if (indexOfDataExplorerInUrl !== -1) {
    urlSegments.splice(indexOfDataExplorerInUrl, 1);
  }
  // create a new URL object from the current location
  const newUrl = urlSegments.join('/');
  const updatedUrlSegments = newUrl.split('#');
  // append the provided URL to the current location
  updatedUrlSegments[1] = url;
  // join the segments to form the doc views URL
  const docViewsUrl = updatedUrlSegments.join('');
  return docViewsUrl;
}
