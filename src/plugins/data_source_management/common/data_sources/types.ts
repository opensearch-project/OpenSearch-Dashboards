/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToastInputFields, ErrorToastOptions } from 'src/core/public/notifications';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import type { SavedObject } from 'src/core/server';

export interface IDataSource {
  title: string;
  id?: string;
  type?: string;
  endpoint: string;
}

export interface IDataSourceAttributes {
  title: string;
  id: string;
  type: string;
  endpoint: string;
}

export type OnNotification = (toastInputFields: ToastInputFields) => void;
export type OnError = (error: Error, toastInputFields: ErrorToastOptions) => void;

export interface UiSettingsCommon {
  get: (key: string) => Promise<any>;
  getAll: () => Promise<Record<string, any>>;
  set: (keu: string, value: any) => Promise<void>;
  remove: (key: string) => Promise<void>;
}

export interface SavedObjectsClientCommonFindArgs {
  type: string | string[];
  perPage?: number;
  // fields?: string[];
  // search?: string;
  // searchFields?: string[];
}

export interface SavedObjectsClientCommon {
  find: <T = unknown>(options: SavedObjectsClientCommonFindArgs) => Promise<Array<SavedObject<T>>>;
  get: <T = unknown>(type: string, id: string) => Promise<SavedObject<T>>;
  update: <T = unknown>(
    type: string,
    id: string,
    attributes: Record<string, any>,
    options: Record<string, any>
  ) => Promise<SavedObject<T>>;
  create: (
    type: string,
    attributes: Record<string, any>,
    options: Record<string, any>
  ) => Promise<SavedObject>;
  delete: (type: string, id: string) => Promise<{}>;
}

// export interface IDataSourcesApiClient {

// }

export interface DataSourceSpec {
  id?: string;
  version?: string;
  title?: string;
  type?: string;
  endpoint?: string;
}

export type { SavedObject };
