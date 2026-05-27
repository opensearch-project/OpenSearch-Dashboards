/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { BehaviorSubject, Observable } from 'rxjs';
import { IOsdUrlStateStorage } from '../../../../opensearch_dashboards_utils/public';
import { VisFieldType } from '../visualizations/types';
import { OpenSearchSearchHit } from '../../types/doc_views_types';

export interface FieldSchema {
  name: string;
  visFieldType: VisFieldType;
}
export interface UrlTransformationState {
  definitionId: string;
  config: Record<string, unknown>;
  hide: boolean;
}

export interface TransformationInstance<TConfig = Record<string, unknown>> {
  // Unique runtime UUID — allows multiple instances of the same definition in the pipeline
  instance_id: string;
  definition_id: string;
  // User settings (e.g. { limit: 5 })
  config: TConfig;
  // set true to skip transformation during pipeline execution
  hide: boolean;
  // core transformation method
  transformationMethod: (data: OpenSearchSearchHit[], config: TConfig) => OpenSearchSearchHit[];
  // config editor
  Editor: React.ComponentType<{
    config: TConfig;
    onChange: (newConfig: TConfig) => void;
    availableFields: FieldSchema[];
  }>;
  // rechange schema types after transformation (e.g. convert field type)
  transformSchema?: (
    schema: Array<{ name?: string; type?: string }>,
    config: TConfig
  ) => Array<{ name?: string; type?: string }>;
  // clean config when changing
  validateConfig?: (
    config: TConfig,
    availableFields: Array<{ name?: string; type?: string }>
  ) => TConfig;
}

export type TransformationPipeline = TransformationInstance[];

export interface TransformationDefinition<TConfig = Record<string, unknown>> {
  // name of this transformation
  id: string;
  // sub-group (e.g. 'filter', 'format', 'aggregate')
  // for future use to filter methods in group as methods grow
  type: string;
  label: string;
  description: string;
  iconType: string;
  createInstance: () => TransformationInstance<TConfig>;
}

export interface ITransformationService {
  // Catalog of definition registry
  registerDefinition<TConfig>(definition: TransformationDefinition<TConfig>): void;
  getDefinitions(): TransformationDefinition[];
  getDefinitionsByType(type: string): TransformationDefinition[];
  getDefinition(id: string): TransformationDefinition | undefined;

  //  Pipeline instance management --
  readonly pipeline$: BehaviorSubject<TransformationPipeline>;
  readonly stageSchemas$: BehaviorSubject<Map<string, Array<{ name?: string; type?: string }>>>;
  getPipeline$(): Observable<TransformationPipeline>;
  addInstance(id: string): void;
  removeInstance(id: string): void;
  updateInstanceConfig(id: string, newConfig: Record<string, any>): void;
  toggleInstanceHide(id: string): void;
  setPipeline(instances: TransformationPipeline): void;
  clearPipeline(): void;

  // execution
  applyPipeline(
    rawRows: OpenSearchSearchHit[],
    originalSchema: Array<{ name?: string; type?: string }>
  ): {
    rows: OpenSearchSearchHit[];
    finalSchema: Array<{ name?: string; type?: string }>;
  };

  // URL persistence
  initUrlSync(urlStateStorage: IOsdUrlStateStorage): void;

  destroy(): void;
  restoreFromState(states: UrlTransformationState[]): void;
}

export interface FilterConfig {
  field: string | undefined;
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'greater_than'
    | 'less_than'
    | 'greater_than_or_equal_to'
    | 'less_than_or_equal_to'
    | 'is_earlier'
    | 'is_earlier_or_equal'
    | 'is_later'
    | 'is_later_or_equal';
  value: string;
}

// All operators available for all field types
export const allOperatorOptions = [
  {
    value: 'equals',
    text: i18n.translate('explore.transformations.filter.equals', {
      defaultMessage: 'Equals',
    }),
  },
  {
    value: 'not_equals',
    text: i18n.translate('explore.transformations.filter.notEquals', {
      defaultMessage: 'Not equals',
    }),
  },
  {
    value: 'contains',
    text: i18n.translate('explore.transformations.filter.contains', {
      defaultMessage: 'Contains',
    }),
  },
  {
    value: 'not_contains',
    text: i18n.translate('explore.transformations.filter.notContains', {
      defaultMessage: 'Not contains',
    }),
  },
];

// Additional operators only for numerical fields
export const numericalOperatorOptions = [
  {
    value: 'greater_than',
    text: i18n.translate('explore.transformations.filter.greaterThan', {
      defaultMessage: 'Is greater than',
    }),
  },
  {
    value: 'greater_than_or_equal_to',
    text: i18n.translate('explore.transformations.filter.greaterThanOrEqualTo', {
      defaultMessage: 'Is greater or equal',
    }),
  },
  {
    value: 'less_than',
    text: i18n.translate('explore.transformations.filter.lowerThan', {
      defaultMessage: 'Is lower',
    }),
  },
  {
    value: 'less_than_or_equal_to',
    text: i18n.translate('explore.transformations.filter.lowerThanOrEqualTo', {
      defaultMessage: 'Is lower or equal',
    }),
  },
];

// Additional operators only for date fields
export const dateOperatorOptions = [
  {
    value: 'is_earlier',
    text: i18n.translate('explore.transformations.filter.isEarlier', {
      defaultMessage: 'Is earlier',
    }),
  },
  {
    value: 'is_earlier_or_equal',
    text: i18n.translate('explore.transformations.filter.isEarlierOrEqual', {
      defaultMessage: 'Is earlier or equal',
    }),
  },
  {
    value: 'is_later',
    text: i18n.translate('explore.transformations.filter.isLater', {
      defaultMessage: 'Is later',
    }),
  },
  {
    value: 'is_later_or_equal',
    text: i18n.translate('explore.transformations.filter.isLaterOrEqual', {
      defaultMessage: 'Is later or equal',
    }),
  },
];

// for add field method
export const binaryOperatorOptions = [
  { value: '+', text: '+' },
  { value: '-', text: '-' },
  { value: '*', text: '*' },
  { value: '/', text: '/' },
];

export const unaryOperatorOptions = [
  {
    value: 'abs',
    text: i18n.translate('explore.transformations.addField.abs', {
      defaultMessage: 'Absolute value',
    }),
  },
  {
    value: 'ceil',
    text: i18n.translate('explore.transformations.addField.ceil', { defaultMessage: 'Ceiling' }),
  },
  {
    value: 'floor',
    text: i18n.translate('explore.transformations.addField.floor', { defaultMessage: 'Floor' }),
  },
  {
    value: 'round',
    text: i18n.translate('explore.transformations.addField.round', { defaultMessage: 'Round' }),
  },
];

export const modeToggleOptions = [
  {
    id: 'binary',
    label: i18n.translate('explore.transformations.addField.binaryMode', {
      defaultMessage: 'Binary',
    }),
  },
  {
    id: 'unary',
    label: i18n.translate('explore.transformations.addField.unaryMode', {
      defaultMessage: 'Unary',
    }),
  },
  {
    id: 'crossFields',
    label: i18n.translate('explore.transformations.addField.crossFieldsMode', {
      defaultMessage: 'Cross-field',
    }),
  },
];
