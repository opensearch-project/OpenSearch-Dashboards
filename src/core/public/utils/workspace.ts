/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const getWorkspaceIdFromUrl = (url: string): string => {
  const regexp = /\/w\/([^\/]*)/;
  const urlObject = new URL(url);
  const matchedResult = urlObject.pathname.match(regexp);
  if (matchedResult) {
    return matchedResult[1];
  }

  return '';
};
