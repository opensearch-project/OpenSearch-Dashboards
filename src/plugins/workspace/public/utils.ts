/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { setStateToOsdUrl } from '../../opensearch_dashboards_utils/public';
import { WORKSPACE_ID_STATE_KEY } from '../common/constants';

export const formatUrlWithWorkspaceId = (url: string, workspaceId: string) => {
  return setStateToOsdUrl(WORKSPACE_ID_STATE_KEY, workspaceId, undefined, url);
};
