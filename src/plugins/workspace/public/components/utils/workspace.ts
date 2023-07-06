/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WORKSPACE_APP_ID, PATHS } from '../../../common/constants';
import { CoreStart } from '../../../../../core/public';

type Core = Pick<CoreStart, 'workspaces' | 'application'>;

export const switchWorkspace = ({ workspaces, application }: Core, id: string) => {
  const newUrl = workspaces?.formatUrlWithWorkspaceId(
    application.getUrlForApp(WORKSPACE_APP_ID, {
      path: PATHS.update,
      absolute: true,
    }),
    id
  );
  if (newUrl) {
    window.location.href = newUrl;
  }
};
