/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IIndexPattern,
  IndexPatternAttributes,
  OnNotification,
  OnError,
  OnUnsupportedTimePattern,
  UiSettingsCommon,
  SavedObjectsClientCommonFindArgs,
  SavedObjectsClientCommon,
  GetFieldsOptions,
  IIndexPatternsApiClient,
  SavedObject,
  AggregationRestrictions,
  IFieldSubType,
  TypeMeta,
  FieldSpecConflictDescriptions,
  FieldSpecExportFmt,
  FieldSpec,
  IndexPatternFieldMap,
  SavedObjectReference,
  IndexPatternSpec,
  SourceFilter,
} from '../index_patterns/types';
import { Dataset } from '../datasets/types';

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export interface IDataView extends IIndexPattern {
  displayName?: string;
  description?: string;
  type?: string;
  dataSourceRef?: DataViewSavedObjectReference;

  /**
   * @experimental This method is experimental and may change in future versions
   */
  initializeDataSourceRef?(): Promise<void>;

  /**
   * Converts a DataView to a serializable Dataset object
   * Maps dataSourceRef and includes only essential properties for backward compatibility
   * @experimental This method is experimental and may change in future versions
   */
  toDataset?(): Promise<Dataset>;
}

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export type DataViewAttributes = IndexPatternAttributes;

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export type DataViewOnNotification = OnNotification;

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export type DataViewOnError = OnError;

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export type DataViewOnUnsupportedTimePattern = OnUnsupportedTimePattern;

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export type DataViewUiSettingsCommon = UiSettingsCommon;

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export type DataViewSavedObjectsClientCommonFindArgs = SavedObjectsClientCommonFindArgs;

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export type DataViewSavedObjectsClientCommon = SavedObjectsClientCommon;

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export type DataViewGetFieldsOptions = GetFieldsOptions;

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export type IDataViewsApiClient = IIndexPatternsApiClient;

export type { SavedObject };

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export type DataViewAggregationRestrictions = AggregationRestrictions;

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export type IDataViewFieldSubType = IFieldSubType;

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export type DataViewTypeMeta = TypeMeta;

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export type DataViewFieldSpecConflictDescriptions = FieldSpecConflictDescriptions;

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export type DataViewFieldSpecExportFmt = FieldSpecExportFmt;

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export type DataViewFieldSpec = FieldSpec;

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export type DataViewFieldMap = IndexPatternFieldMap;

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export type DataViewSavedObjectReference = SavedObjectReference;

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export type DataViewSpec = IndexPatternSpec & {
  dataSourceRef?: DataViewSavedObjectReference;
};

/**
 * @experimental DataView functionality is experimental and may change in future versions
 */
export type DataViewSourceFilter = SourceFilter;
