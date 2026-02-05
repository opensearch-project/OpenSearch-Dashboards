/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiHighlight, EuiSimplifiedBreadcrumbs } from '@elastic/eui';

import type { ApplicationStart } from '../../../../../core/public';
import { HttpStart, IBasePath } from '../../../../../core/public';
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
  onAssetClick,
}: {
  http: HttpStart;
  query: string;
  application?: ApplicationStart;
  currentWorkspaceId?: string;
  abortSignal?: AbortSignal;
  visibleWorkspaceIds: string[];
  onAssetClick?: () => void;
}) => {
  let findResponse;

  try {
    findResponse = await http.get<Record<string, any>>(
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
  } catch (e) {
    return [];
  }

  return (
    findResponse.saved_objects
      // @ts-expect-error TS7006 TODO(ts-error): fixme
      .map((asset) => {
        if (!asset.meta.title || !asset.meta.inAppUrl?.path) {
          return null;
        }
        return (
          <EuiSimplifiedBreadcrumbs
            breadcrumbs={[
              { text: asset.type },
              {
                text: <EuiHighlight search={query}>{asset.meta.title}</EuiHighlight>,
                href: getAssetsFinalPath({
                  object: asset,
                  basePath: http.basePath,
                  currentWorkspaceId,
                  useUpdatedUX: true,
                  visibleWorkspaceIds,
                }),
                onClick: onAssetClick,
              },
            ]}
            hideTrailingSeparator
            responsive
          />
        );
      })
      // @ts-expect-error TS7006 TODO(ts-error): fixme
      .filter((item) => !!item)
  );
};
