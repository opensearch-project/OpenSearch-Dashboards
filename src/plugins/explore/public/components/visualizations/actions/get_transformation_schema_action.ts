/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  limitConfigSchema,
  sortByConfigSchema,
  filterConfigSchema,
  filterFieldsConfigSchema,
  convertFieldTypeConfigSchema,
  groupByConfigSchema,
  extractFieldsConfigSchema,
  addFieldConfigSchema,
  TransformationConfigSchema,
} from '../../data_transformations';
import { GetTransformationSchemaMeta } from './utils';

const SCHEMA_REGISTRY: Record<string, TransformationConfigSchema> = {
  limit: limitConfigSchema,
  sort_by: sortByConfigSchema,
  filter: filterConfigSchema,
  filter_fields: filterFieldsConfigSchema,
  convert_field_type: convertFieldTypeConfigSchema,
  group_by: groupByConfigSchema,
  extract_fields: extractFieldsConfigSchema,
  add_field: addFieldConfigSchema,
};

const AVAILABLE_IDS = Object.keys(SCHEMA_REGISTRY);

export function registerGetTransformationSchemaAction(
  registerAction: ((action: any) => void) | undefined
) {
  if (!registerAction) return;

  registerAction({
    ...GetTransformationSchemaMeta,
    handler: async (args: { definitionIds: string[] }) => {
      const results: Record<string, TransformationConfigSchema | { error: string }> = {};

      for (const id of args.definitionIds) {
        const schema = SCHEMA_REGISTRY[id];
        if (!schema) {
          results[id] = {
            error:
              `Unknown transformation type "${id}". ` +
              `Available types: [${AVAILABLE_IDS.join(', ')}].`,
          };
        } else {
          results[id] = schema;
        }
      }

      const found = args.definitionIds.filter((id) => SCHEMA_REGISTRY[id]);
      const unknown = args.definitionIds.filter((id) => !SCHEMA_REGISTRY[id]);

      return {
        success: unknown.length === 0,
        schemas: results,
        message:
          found.length > 0
            ? `Returned schemas for: [${found.join(', ')}].` +
              (unknown.length > 0 ? ` Unknown types: [${unknown.join(', ')}].` : '') +
              ` Use each schema's field descriptions and enumOptions to build valid config objects, ` +
              `then pass them in the transformations array of auto_create_visualization.`
            : `No valid transformation types found. Available: [${AVAILABLE_IDS.join(', ')}].`,
      };
    },
  });
}
