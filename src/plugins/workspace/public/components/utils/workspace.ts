/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WORKSPACE_OVERVIEW_APP_ID } from '../../../common/constants';
import { CoreStart } from '../../../../../core/public';

type Core = Pick<CoreStart, 'workspaces' | 'application'>;

export const switchWorkspace = ({ workspaces, application }: Core, id: string) => {
  const newUrl = workspaces?.formatUrlWithWorkspaceId(
    application.getUrlForApp(WORKSPACE_OVERVIEW_APP_ID, {
      absolute: true,
    }),
    id
  );
  if (newUrl) {
    window.location.href = newUrl;
  }
};
