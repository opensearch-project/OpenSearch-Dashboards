/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WORKSPACE_PATH_PREFIX } from './constants';
import { IBasePath } from '../public';

export const getWorkspaceIdFromUrl = (url: string): string => {
  const regexp = /\/w\/([^\/]*)/;
  const urlObject = new URL(url);
  const matchedResult = urlObject.pathname.match(regexp);
  if (matchedResult) {
    return matchedResult[1];
  }

  return '';
};

export const cleanWorkspaceId = (path: string) => {
  return path.replace(/^\/w\/([^\/]*)/, '');
};

export const formatUrlWithWorkspaceId = (url: string, workspaceId: string, basePath: IBasePath) => {
  const newUrl = new URL(url, window.location.href);
  /**
   * Patch workspace id into path
   */
  newUrl.pathname = basePath.remove(newUrl.pathname);

  if (workspaceId) {
    newUrl.pathname = `${WORKSPACE_PATH_PREFIX}/${workspaceId}${newUrl.pathname}`;
  } else {
    newUrl.pathname = cleanWorkspaceId(newUrl.pathname);
  }

  newUrl.pathname = basePath.prepend(newUrl.pathname, {
    withoutWorkspace: true,
  });

  return newUrl.toString();
};
