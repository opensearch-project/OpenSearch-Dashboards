/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WORKSPACE_DETAIL_APP_ID } from '../../../common/constants';
import { CoreStart } from '../../../../../core/public';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { DetailTab } from '../workspace_form/constants';

type Core = Pick<CoreStart, 'application' | 'http'>;

export const navigateToWorkspaceDetail = (
  { application, http }: Core,
  workspaceId: string,
  tabId: string = DetailTab.Details
) => {
  navigateToAppWithinWorkspace(
    { application, http },
    workspaceId,
    WORKSPACE_DETAIL_APP_ID,
    `/?tab=${tabId}`
  );
};

export const navigateToAppWithinWorkspace = (
  { application, http }: Core,
  workspaceId: string,
  appId: string,
  hash?: string
) => {
  const newUrl = formatUrlWithWorkspaceId(
    application.getUrlForApp(appId, {
      absolute: true,
    }),
    workspaceId,
    http.basePath
  );
  if (newUrl) {
    const url = new URL(newUrl);
    if (hash) {
      url.hash = hash;
    }
    application.navigateToUrl(url.toString());
  }
};
