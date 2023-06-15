/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { SavedObject, SavedObjectError, SavedObjectsClientContract } from '../types';
import {
  IWorkspaceDBImpl,
  WorkspaceAttribute,
  WorkspaceFindOptions,
  IResponse,
  IRequestDetail,
} from './types';
import { WorkspacesSetupDeps } from './workspaces_service';
import { workspace } from './saved_objects';

export const WORKSPACES_TYPE_FOR_SAVED_OBJECT = 'workspace';

export class WorkspacesClientWithSavedObject implements IWorkspaceDBImpl {
  private setupDep: WorkspacesSetupDeps;
  constructor(dep: WorkspacesSetupDeps) {
    this.setupDep = dep;
  }
  private getSavedObjectClientsFromRequestDetail(
    requestDetail: IRequestDetail
  ): SavedObjectsClientContract {
    return requestDetail.context.core.savedObjects.client;
  }
  private getFlatternedResultWithSavedObject(
    savedObject: SavedObject<WorkspaceAttribute>
  ): WorkspaceAttribute {
    return {
      ...savedObject.attributes,
      id: savedObject.id,
    };
  }
  private formatError(error: SavedObjectError | Error | any): string {
    return error.message || error.error || 'Error';
  }
  public async setup(dep: WorkspacesSetupDeps): Promise<IResponse<boolean>> {
    this.setupDep.savedObject.registerType(workspace);
    return {
      success: true,
      result: true,
    };
  }
  public async create(
    requestDetail: IRequestDetail,
    payload: Omit<WorkspaceAttribute, 'id'>
  ): ReturnType<IWorkspaceDBImpl['create']> {
    try {
      const result = await this.getSavedObjectClientsFromRequestDetail(requestDetail).create<
        Omit<WorkspaceAttribute, 'id'>
      >(WORKSPACES_TYPE_FOR_SAVED_OBJECT, payload);
      return {
        success: true,
        result: {
          id: result.id,
        },
      };
    } catch (e: unknown) {
      return {
        success: false,
        error: this.formatError(e),
      };
    }
  }
  public async list(
    requestDetail: IRequestDetail,
    options: WorkspaceFindOptions
  ): ReturnType<IWorkspaceDBImpl['list']> {
    try {
      const {
        saved_objects: savedObjects,
        ...others
      } = await this.getSavedObjectClientsFromRequestDetail(requestDetail).find<WorkspaceAttribute>(
        {
          ...options,
          type: WORKSPACES_TYPE_FOR_SAVED_OBJECT,
        }
      );
      return {
        success: true,
        result: {
          ...others,
          workspaces: savedObjects.map((item) => this.getFlatternedResultWithSavedObject(item)),
        },
      };
    } catch (e: unknown) {
      return {
        success: false,
        error: this.formatError(e),
      };
    }
  }
  public async get(
    requestDetail: IRequestDetail,
    id: string
  ): Promise<IResponse<WorkspaceAttribute>> {
    try {
      const result = await this.getSavedObjectClientsFromRequestDetail(requestDetail).get<
        WorkspaceAttribute
      >(WORKSPACES_TYPE_FOR_SAVED_OBJECT, id);
      return {
        success: true,
        result: this.getFlatternedResultWithSavedObject(result),
      };
    } catch (e: unknown) {
      return {
        success: false,
        error: this.formatError(e),
      };
    }
  }
  public async update(
    requestDetail: IRequestDetail,
    id: string,
    payload: Omit<WorkspaceAttribute, 'id'>
  ): Promise<IResponse<boolean>> {
    try {
      await this.getSavedObjectClientsFromRequestDetail(requestDetail).update<
        Omit<WorkspaceAttribute, 'id'>
      >(WORKSPACES_TYPE_FOR_SAVED_OBJECT, id, payload);
      return {
        success: true,
        result: true,
      };
    } catch (e: unknown) {
      return {
        success: false,
        error: this.formatError(e),
      };
    }
  }
  public async delete(requestDetail: IRequestDetail, id: string): Promise<IResponse<boolean>> {
    try {
      await this.getSavedObjectClientsFromRequestDetail(requestDetail).delete(
        WORKSPACES_TYPE_FOR_SAVED_OBJECT,
        id
      );
      return {
        success: true,
        result: true,
      };
    } catch (e: unknown) {
      return {
        success: false,
        error: this.formatError(e),
      };
    }
  }
  public async destroy(): Promise<IResponse<boolean>> {
    return {
      success: true,
      result: true,
    };
  }
}
