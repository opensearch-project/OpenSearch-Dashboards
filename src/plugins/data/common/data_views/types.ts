/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ErrorToastOptions, ToastInputFields } from 'src/core/public/notifications';
// eslint-disable-next-line
import type { SavedObject } from 'src/core/server';
import { FieldFormat, DataViewField, OSD_FIELD_TYPES } from '..';
import { SerializedFieldFormat } from '../../../expressions/common';
import { IDataViewFieldType } from './fields';

export type DataViewFieldFormatMap = Record<string, SerializedFieldFormat>;

export interface IDataView {
  fields: IDataViewFieldType[];
  title: string;
  displayName?: string;
  description?: string;
  id?: string;
  type?: string;
  timeFieldName?: string;
  intervalName?: string | null;
  getTimeField?(): IDataViewFieldType | undefined;
  fieldFormatMap?: Record<string, SerializedFieldFormat<unknown> | undefined>;
  getFormatterForField?: (
    field: DataViewField | DataViewField['spec'] | IDataViewFieldType
  ) => FieldFormat;
  /**
   * Converts a DataView to a serializable Dataset object suitable for storage in Redux
   * Maps dataSource to dataSourceRef and includes only essential properties
   */
  toDataset?(): any;
}

export interface DataViewAttributes {
  type: string;
  fields: string;
  title: string;
  displayName?: string;
  description?: string;
  typeMeta: string;
  timeFieldName?: string;
  intervalName?: string;
  sourceFilters?: string;
  fieldFormatMap?: string;
}

export type DataViewOnNotification = (toastInputFields: ToastInputFields) => void;
export type DataViewOnError = (error: Error, toastInputFields: ErrorToastOptions) => void;

export type DataViewOnUnsupportedTimePattern = ({
  id,
  title,
  index,
}: {
  id: string;
  title: string;
  index: string;
}) => void;

export interface DataViewUiSettingsCommon {
  get: (key: string) => Promise<any>;
  getAll: () => Promise<Record<string, any>>;
  set: (key: string, value: any) => Promise<void>;
  remove: (key: string) => Promise<void>;
}

export interface DataViewSavedObjectsClientCommonFindArgs {
  type: string | string[];
  fields?: string[];
  perPage?: number;
  search?: string;
  searchFields?: string[];
}

export interface DataViewSavedObjectsClientCommon {
  find: <T = unknown>(
    options: DataViewSavedObjectsClientCommonFindArgs
  ) => Promise<Array<SavedObject<T>>>;
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

export interface DataViewGetFieldsOptions {
  pattern?: string;
  type?: string;
  params?: any;
  lookBack?: boolean;
  metaFields?: string[];
  dataSourceId?: string;
}

export interface IDataViewsApiClient {
  getFieldsForTimePattern: (options: DataViewGetFieldsOptions) => Promise<any>;
  getFieldsForWildcard: (options: DataViewGetFieldsOptions) => Promise<any>;
}

export type { SavedObject };

export type DataViewAggregationRestrictions = Record<
  string,
  {
    agg?: string;
    interval?: number;
    fixed_interval?: string;
    calendar_interval?: string;
    delay?: string;
    time_zone?: string;
  }
>;

export interface IDataViewFieldSubType {
  multi?: { parent: string };
  nested?: { path: string };
}

export interface DataViewTypeMeta {
  aggs?: Record<string, DataViewAggregationRestrictions>;
  [key: string]: any;
}

export type DataViewFieldSpecConflictDescriptions = Record<string, string[]>;

// This should become FieldSpec once types are cleaned up
export interface DataViewFieldSpecExportFmt {
  count?: number;
  script?: string;
  lang?: string;
  conflictDescriptions?: DataViewFieldSpecConflictDescriptions;
  name: string;
  type: OSD_FIELD_TYPES;
  esTypes?: string[];
  scripted: boolean;
  searchable: boolean;
  aggregatable: boolean;
  readFromDocValues?: boolean;
  subType?: IDataViewFieldSubType;
  format?: SerializedFieldFormat;
  indexed?: boolean;
}

export interface DataViewFieldSpec {
  count?: number;
  script?: string;
  lang?: string;
  conflictDescriptions?: Record<string, string[]>;
  format?: SerializedFieldFormat;

  name: string;
  type: string;
  esTypes?: string[];
  scripted?: boolean;
  searchable: boolean;
  aggregatable: boolean;
  readFromDocValues?: boolean;
  subType?: IDataViewFieldSubType;
  indexed?: boolean;
}

export type DataViewFieldMap = Record<string, DataViewFieldSpec>;

export interface DataViewSavedObjectReference {
  name?: string;
  id: string;
  type: string;
}
export interface DataViewSpec {
  id?: string;
  version?: string;
  title?: string;
  displayName?: string;
  description?: string;
  intervalName?: string;
  timeFieldName?: string;
  sourceFilters?: DataViewSourceFilter[];
  fields?: DataViewFieldMap;
  typeMeta?: DataViewTypeMeta;
  type?: string;
  dataSourceRef?: DataViewSavedObjectReference;
  fieldsLoading?: boolean;
}

export interface DataViewSourceFilter {
  value: string;
}
