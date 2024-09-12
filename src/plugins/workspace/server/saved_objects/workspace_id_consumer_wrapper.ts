/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getWorkspaceState } from '../../../../core/server/utils';
import {
  SavedObjectsBaseOptions,
  SavedObjectsBulkCreateObject,
  SavedObjectsClientWrapperFactory,
  SavedObjectsCreateOptions,
  SavedObjectsCheckConflictsObject,
  OpenSearchDashboardsRequest,
  SavedObjectsFindOptions,
  SavedObject,
} from '../../../../core/server';

const UI_SETTINGS_SAVED_OBJECTS_TYPE = 'config';

type WorkspaceOptions = Pick<SavedObjectsBaseOptions, 'workspaces'> | undefined;

export class WorkspaceIdConsumerWrapper {
  private formatWorkspaceIdParams<T extends WorkspaceOptions>(
    request: OpenSearchDashboardsRequest,
    options?: T
  ): T {
    const { workspaces, ...others } = options || {};
    const workspaceState = getWorkspaceState(request);
    const workspaceIdParsedFromRequest = workspaceState?.requestWorkspaceId;
    const workspaceIdsInUserOptions = options?.workspaces;
    let finalWorkspaces: string[] = [];
    if (options?.hasOwnProperty('workspaces')) {
      // In order to get all data sources in workspace, use * to skip appending workspace id automatically
      finalWorkspaces = (workspaceIdsInUserOptions || []).filter((id) => id !== '*');
    } else if (workspaceIdParsedFromRequest) {
      finalWorkspaces = [workspaceIdParsedFromRequest];
    }

    return {
      ...(others as T),
      ...(finalWorkspaces.length ? { workspaces: finalWorkspaces } : {}),
    };
  }

  private isConfigType(type: string): boolean {
    return type === UI_SETTINGS_SAVED_OBJECTS_TYPE;
  }

  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    return {
      ...wrapperOptions.client,
      create: <T>(type: string, attributes: T, options: SavedObjectsCreateOptions = {}) =>
        wrapperOptions.client.create(
          type,
          attributes,
          this.isConfigType(type)
            ? options
            : this.formatWorkspaceIdParams(wrapperOptions.request, options)
        ),
      bulkCreate: <T = unknown>(
        objects: Array<SavedObjectsBulkCreateObject<T>>,
        options: SavedObjectsCreateOptions = {}
      ) =>
        wrapperOptions.client.bulkCreate(
          objects,
          this.formatWorkspaceIdParams(wrapperOptions.request, options)
        ),
      checkConflicts: (
        objects: SavedObjectsCheckConflictsObject[] = [],
        options: SavedObjectsBaseOptions = {}
      ) =>
        wrapperOptions.client.checkConflicts(
          objects,
          this.formatWorkspaceIdParams(wrapperOptions.request, options)
        ),
      delete: wrapperOptions.client.delete,
      find: (options: SavedObjectsFindOptions) => {
        return wrapperOptions.client.find(
          // Based on https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/core/server/ui_settings/create_or_upgrade_saved_config/get_upgradeable_config.ts#L49
          // we need to make sure the find call for upgrade config should be able to find all the global configs as it was before.
          // It is a workaround for 2.17, should be optimized in the upcoming 2.18 release.
          this.isConfigType(options.type as string) && options.sortField === 'buildNum'
            ? options
            : this.formatWorkspaceIdParams(wrapperOptions.request, options)
        );
      },
      bulkGet: wrapperOptions.client.bulkGet,
      get: wrapperOptions.client.get,
      update: wrapperOptions.client.update,
      bulkUpdate: wrapperOptions.client.bulkUpdate,
      addToNamespaces: wrapperOptions.client.addToNamespaces,
      deleteFromNamespaces: wrapperOptions.client.deleteFromNamespaces,
      deleteByWorkspace: wrapperOptions.client.deleteByWorkspace,
    };
  };

  constructor() {}
}
