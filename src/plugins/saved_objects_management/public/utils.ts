/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from 'opensearch-dashboards/public';
import { formatUrlWithWorkspaceId } from '../../../core/public/utils';
import { SavedObjectWithMetadata } from './types';

export function formatWorkspaceIdParams<
  T extends { workspaces?: string[] | null; availableWorkspaces?: string[] | null }
>(obj: T): T | Omit<T, 'workspaces' | 'availableWorkspaces'> {
  const { workspaces, availableWorkspaces, ...others } = obj;
  if (workspaces || (availableWorkspaces && availableWorkspaces.length)) {
    return obj;
  }
  return others;
}

export function formatInspectUrl(
  savedObject: SavedObjectWithMetadata,
  coreStart: CoreStart
): string | undefined {
  const { editUrl } = savedObject.meta;
  const useUpdatedUX = !!coreStart.uiSettings.get('home:useNewHomePage');
  let finalEditUrl = editUrl;
  if (useUpdatedUX && finalEditUrl) {
    finalEditUrl = finalEditUrl.replace(/^\/management\/opensearch-dashboards/, '');
  }
  if (finalEditUrl) {
    finalEditUrl = `/app${finalEditUrl}`;
    const basePath = coreStart.http.basePath;
    let inAppUrl = basePath.prepend(finalEditUrl);
    const workspaceEnabled = coreStart.application.capabilities.workspaces.enabled;
    if (workspaceEnabled) {
      const currentWorkspace = coreStart.workspaces.currentWorkspace$.value;
      if (currentWorkspace) {
        inAppUrl = formatUrlWithWorkspaceId(finalEditUrl, currentWorkspace.id, basePath);
      } else {
        const visibleWsIds = coreStart.workspaces.workspaceList$.value?.map((ws) => ws.id) || [];

        // find first workspace user have permission
        const workspaceId = savedObject?.workspaces?.find((wsId) => visibleWsIds.includes(wsId));
        if (workspaceId) {
          inAppUrl = formatUrlWithWorkspaceId(finalEditUrl, workspaceId, basePath);
        }
      }
    }
    return inAppUrl;
  }
}
