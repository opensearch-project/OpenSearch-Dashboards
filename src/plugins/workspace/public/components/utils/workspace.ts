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
  id: string,
  tabId: string = DetailTab.Details
) => {
  const newUrl = formatUrlWithWorkspaceId(
    application.getUrlForApp(WORKSPACE_DETAIL_APP_ID, {
      absolute: true,
    }),
    id,
    http.basePath
  );
  if (newUrl) {
    const url = new URL(newUrl);
    url.hash = `/?tab=${tabId}`;
    application.navigateToUrl(url.toString());
  }
};
