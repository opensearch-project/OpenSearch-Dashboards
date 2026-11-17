/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransformationService } from './transformation_service';
import {
  limitConfigSchema,
  limitTransformationDefinition,
} from './transformations/limit_transformation';
import {
  sortByConfigSchema,
  sortByTransformationDefinition,
} from './transformations/sortby_transformation';
import {
  filterConfigSchema,
  filterTransformationDefinition,
} from './transformations/filter_transformation';
import {
  addFieldConfigSchema,
  addFieldTransformationDefinition,
} from './transformations/add_field_transformation';
import {
  filterFieldsConfigSchema,
  filterFieldsTransformationDefinition,
} from './transformations/filter_fields_transformation';
import {
  convertFieldTypeConfigSchema,
  convertFieldTypeTransformationDefinition,
} from './transformations/convert_field_type_transformation';
import {
  groupByConfigSchema,
  groupByTransformationDefinition,
} from './transformations/group_by_transformation';
import {
  extractFieldsConfigSchema,
  extractFieldsTransformationDefinition,
} from './transformations/extract_fields_transformation';
import {
  mergeSeriesConfigSchema,
  mergeSeriesTransformationDefinition,
} from './transformations/merge_series_transformation';
import {
  concatenateFieldsConfigSchema,
  concatenateFieldsTransformationDefinition,
} from './transformations/concatenate_fields_transformation';
import {
  mergeTablesConfigSchema,
  mergeTablesTransformationDefinition,
} from './transformations/merge_tables_transformation';
import {
  joinByFieldConfigSchema,
  joinByFieldTransformationDefinition,
} from './transformations/join_by_field_transformation';
import {
  joinByLabelsConfigSchema,
  joinByLabelsTransformationDefinition,
} from './transformations/join_by_labels_transformation';
import {
  seriesToRowsConfigSchema,
  seriesToRowsTransformationDefinition,
} from './transformations/series_to_rows_transformation';
import {
  reduceConfigSchema,
  reduceTransformationDefinition,
} from './transformations/reduce_transformation';
import {
  formatStringConfigSchema,
  formatStringTransformationDefinition,
} from './transformations/format_string_transformation';
import {
  organizeFieldsConfigSchema,
  organizeFieldsTransformationDefinition,
} from './transformations/organize_fields_transformation';
import { TransformationConfigSchema, TransformationDefinition } from './types';

function createTransformationDefinitionEntry<T>(
  definition: TransformationDefinition<T>,
  configSchema: TransformationConfigSchema
) {
  return {
    definition,
    configSchema,
    register: (service: TransformationService) => service.registerDefinition(definition),
  };
}

const transformationDefinitionEntries = [
  createTransformationDefinitionEntry(limitTransformationDefinition, limitConfigSchema),
  createTransformationDefinitionEntry(sortByTransformationDefinition, sortByConfigSchema),
  createTransformationDefinitionEntry(filterTransformationDefinition, filterConfigSchema),
  createTransformationDefinitionEntry(addFieldTransformationDefinition, addFieldConfigSchema),
  createTransformationDefinitionEntry(
    filterFieldsTransformationDefinition,
    filterFieldsConfigSchema
  ),
  createTransformationDefinitionEntry(
    convertFieldTypeTransformationDefinition,
    convertFieldTypeConfigSchema
  ),
  createTransformationDefinitionEntry(groupByTransformationDefinition, groupByConfigSchema),
  createTransformationDefinitionEntry(
    extractFieldsTransformationDefinition,
    extractFieldsConfigSchema
  ),
  createTransformationDefinitionEntry(mergeSeriesTransformationDefinition, mergeSeriesConfigSchema),
  createTransformationDefinitionEntry(
    concatenateFieldsTransformationDefinition,
    concatenateFieldsConfigSchema
  ),
  createTransformationDefinitionEntry(mergeTablesTransformationDefinition, mergeTablesConfigSchema),
  createTransformationDefinitionEntry(joinByFieldTransformationDefinition, joinByFieldConfigSchema),
  createTransformationDefinitionEntry(
    joinByLabelsTransformationDefinition,
    joinByLabelsConfigSchema
  ),
  createTransformationDefinitionEntry(
    seriesToRowsTransformationDefinition,
    seriesToRowsConfigSchema
  ),
  createTransformationDefinitionEntry(reduceTransformationDefinition, reduceConfigSchema),
  createTransformationDefinitionEntry(
    formatStringTransformationDefinition,
    formatStringConfigSchema
  ),
  createTransformationDefinitionEntry(
    organizeFieldsTransformationDefinition,
    organizeFieldsConfigSchema
  ),
];

export function getAllTransformationDefinitions() {
  return transformationDefinitionEntries.map(({ definition }) => definition);
}

export function getTransformationConfigSchemaRegistry(): Record<
  string,
  TransformationConfigSchema
> {
  return Object.fromEntries(
    transformationDefinitionEntries.map(({ definition, configSchema }) => [
      definition.id,
      configSchema,
    ])
  );
}

export function registerAllTransformations(service: TransformationService): void {
  transformationDefinitionEntries.forEach(({ register }) => register(service));
}
