/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WORKSPACE_OVERVIEW_APP_ID } from '../../../common/constants';
import { CoreStart } from '../../../../../core/public';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';

type Core = Pick<CoreStart, 'application' | 'http'>;

export const switchWorkspace = ({ application, http }: Core, id: string) => {
  const newUrl = formatUrlWithWorkspaceId(
    application.getUrlForApp(WORKSPACE_OVERVIEW_APP_ID, {
      absolute: true,
    }),
    id,
    http.basePath
  );
  if (newUrl) {
    window.location.href = newUrl;
  }
};
