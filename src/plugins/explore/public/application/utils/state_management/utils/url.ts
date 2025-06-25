/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: update this once flavor and view route are finalized
export const getSavedExploreIdFromUrl = () => {
  const hashPath = window.location.hash.split('?')[0];
  const match = hashPath.match(/^#\/([^\/\?]+)/);
  const id = match ? match[1] : undefined;
  return id;
};
