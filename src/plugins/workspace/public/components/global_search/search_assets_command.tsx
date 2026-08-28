/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiHighlight, EuiSimplifiedBreadcrumbs } from '@elastic/eui';

import {
  ApplicationStart,
  GlobalSearchResult,
  HttpStart,
  IBasePath,
} from '../../../../../core/public';
import type { SavedObjectWithMetadata } from '../../../../saved_objects_management/common';
import { formatUrlWithWorkspaceId } from '../../../../../core/public/utils';
import { SUPPORTED_ASSET_TYPES } from './constants';

// TODO: Separate a util function to share with src/plugins/saved_objects_management/public/management_section/objects_table/components/table.tsx in the future
const getAssetsFinalPath = ({
  object,
  useUpdatedUX,
  basePath,
  currentWorkspaceId,
  visibleWorkspaceIds,
}: {
  object: SavedObjectWithMetadata;
  useUpdatedUX: boolean;
  basePath: IBasePath;
  currentWorkspaceId: string | undefined;
  visibleWorkspaceIds: string[];
}) => {
  const { path = '' } = object.meta.inAppUrl || {};
  let finalPath = path;
  if (useUpdatedUX && finalPath) {
    finalPath = finalPath.replace(/^\/app\/management\/opensearch-dashboards/, '/app');
  }
  let inAppUrl = basePath.prepend(finalPath);
  if (object.workspaces?.length) {
    if (currentWorkspaceId) {
      inAppUrl = formatUrlWithWorkspaceId(finalPath, currentWorkspaceId, basePath);
    } else {
      // find first workspace user have permission
      const workspaceId = object.workspaces.find((wsId) => visibleWorkspaceIds.includes(wsId));
      if (workspaceId) {
        inAppUrl = formatUrlWithWorkspaceId(finalPath, workspaceId, basePath);
      }
    }
  }
  return inAppUrl;
};

export const searchAssets = async ({
  http,
  query,
  currentWorkspaceId,
  abortSignal,
  visibleWorkspaceIds,
  navigateToUrl,
}: {
  http: HttpStart;
  query: string;
  currentWorkspaceId?: string;
  abortSignal?: AbortSignal;
  visibleWorkspaceIds: string[];
  navigateToUrl: ApplicationStart['navigateToUrl'];
}): Promise<GlobalSearchResult[]> => {
  let findResponse;

  try {
    findResponse = await http.get<{ saved_objects: SavedObjectWithMetadata[] }>(
      '/api/opensearch-dashboards/management/saved_objects/_find',
      {
        query: {
          type: SUPPORTED_ASSET_TYPES,
          search: `*${query}*`,
          perPage: 10,
          workspaces: currentWorkspaceId ? [currentWorkspaceId] : [],
        },
        signal: abortSignal,
      }
    );
  } catch {
    return [];
  }

  return findResponse.saved_objects
    .map((asset): GlobalSearchResult | null => {
      if (!asset.meta.title || !asset.meta.inAppUrl?.path) {
        return null;
      }
      const href = getAssetsFinalPath({
        object: asset,
        basePath: http.basePath,
        currentWorkspaceId,
        useUpdatedUX: true,
        visibleWorkspaceIds,
      });

      return {
        id: `${asset.type}:${asset.id}`,
        label: asset.meta.title,
        content: (
          <EuiSimplifiedBreadcrumbs
            breadcrumbs={[
              { text: asset.type },
              {
                text: <EuiHighlight search={query}>{asset.meta.title}</EuiHighlight>,
              },
            ]}
            hideTrailingSeparator
            responsive
          />
        ),
        href,
        execute: () => navigateToUrl(href),
      };
    })
    .filter((item): item is GlobalSearchResult => item !== null);
};
