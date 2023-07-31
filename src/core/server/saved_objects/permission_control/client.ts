/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchDashboardsRequest } from '../../http';
import { SavedObjectsServiceStart } from '../saved_objects_service';
import { SavedObjectsBulkGetObject } from '../service';

export type SavedObjectsPermissionControlContract = Pick<
  SavedObjectsPermissionControl,
  keyof SavedObjectsPermissionControl
>;

export type SavedObjectsPermissionModes = string[];

export class SavedObjectsPermissionControl {
  private getScopedClient?: SavedObjectsServiceStart['getScopedClient'];
  private getScopedSavedObjectsClient(request: OpenSearchDashboardsRequest) {
    return this.getScopedClient?.(request);
  }
  private async bulkGetSavedObjects(
    request: OpenSearchDashboardsRequest,
    savedObjects: SavedObjectsBulkGetObject[]
  ) {
    return (
      (await this.getScopedSavedObjectsClient(request)?.bulkGet(savedObjects))?.saved_objects || []
    );
  }
  public async setup(getScopedClient: SavedObjectsServiceStart['getScopedClient']) {
    this.getScopedClient = getScopedClient;
  }
  public async validate(
    request: OpenSearchDashboardsRequest,
    savedObject: SavedObjectsBulkGetObject,
    permissionModeOrModes: SavedObjectsPermissionModes
  ) {
    const savedObjectsGet = await this.bulkGetSavedObjects(request, [savedObject]);
    if (savedObjectsGet) {
      return {
        success: true,
        result: true,
      };
    }

    return {
      success: true,
      result: false,
    };
  }

  public async addPrinciplesToObjects(
    request: OpenSearchDashboardsRequest,
    savedObjects: SavedObjectsBulkGetObject[],
    personas: string[],
    permissionModeOrModes: SavedObjectsPermissionModes
  ): Promise<boolean> {
    return true;
  }

  public async removePrinciplesFromObjects(
    request: OpenSearchDashboardsRequest,
    savedObjects: SavedObjectsBulkGetObject[],
    personas: string[],
    permissionModeOrModes: SavedObjectsPermissionModes
  ): Promise<boolean> {
    return true;
  }

  public async getPrinciplesOfObjects(
    request: OpenSearchDashboardsRequest,
    savedObjects: SavedObjectsBulkGetObject[]
  ): Promise<Record<string, unknown>> {
    return {};
  }

  public async getPermittedWorkspaceIds(
    request: OpenSearchDashboardsRequest,
    permissionModeOrModes: SavedObjectsPermissionModes
  ) {
    return [];
  }
}
