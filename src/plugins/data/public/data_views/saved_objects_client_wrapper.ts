/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { omit } from 'lodash';
import { SavedObjectsClient, SimpleSavedObject } from 'src/core/public';
import {
  DataViewSavedObjectsClientCommon,
  DataViewSavedObjectsClientCommonFindArgs,
  SavedObject,
} from '../../common/data_views';

type SOClient = Pick<SavedObjectsClient, 'find' | 'get' | 'update' | 'create' | 'delete'>;

const simpleSavedObjectToSavedObject = <T>(simpleSavedObject: SimpleSavedObject): SavedObject<T> =>
  ({
    version: simpleSavedObject._version,
    ...omit(simpleSavedObject, '_version'),
  } as any);

export class SavedObjectsClientPublicToCommon implements DataViewSavedObjectsClientCommon {
  private savedObjectClient: SOClient;
  constructor(savedObjectClient: SOClient) {
    this.savedObjectClient = savedObjectClient;
  }
  async find<T = unknown>(options: DataViewSavedObjectsClientCommonFindArgs) {
    const response = (await this.savedObjectClient.find<T>(options)).savedObjects;
    return response.map<SavedObject<T>>(simpleSavedObjectToSavedObject);
  }

  async get<T = unknown>(type: string, id: string) {
    const response = await this.savedObjectClient.get<T>(type, id);
    return simpleSavedObjectToSavedObject<T>(response);
  }
  async update<T = unknown>(
    type: string,
    id: string,
    attributes: Record<string, any>,
    options: Record<string, any>
  ) {
    const response = await this.savedObjectClient.update(type, id, attributes, options);
    return simpleSavedObjectToSavedObject<T>(response);
  }
  async create(type: string, attributes: Record<string, any>, options: Record<string, any>) {
    const response = await this.savedObjectClient.create(type, attributes, options);
    return simpleSavedObjectToSavedObject(response);
  }
  delete(type: string, id: string) {
    return this.savedObjectClient.delete(type, id);
  }
}
