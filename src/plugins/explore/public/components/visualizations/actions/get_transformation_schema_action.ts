/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { limitConfigSchema } from '../../data_transformations/transformations/limit_transformation';
import { sortByConfigSchema } from '../../data_transformations/transformations/sortby_transformation';
import { filterConfigSchema } from '../../data_transformations/transformations/filter_transformation';
import { filterFieldsConfigSchema } from '../../data_transformations/transformations/filter_fields_transformation';
import { convertFieldTypeConfigSchema } from '../../data_transformations/transformations/convert_field_type_transformation';
import { groupByConfigSchema } from '../../data_transformations/transformations/group_by_transformation';
import { extractFieldsConfigSchema } from '../../data_transformations/transformations/extract_fields_transformation';
import { addFieldConfigSchema } from '../../data_transformations/transformations/add_field_transformation';
import { TransformationConfigSchema } from '../../data_transformations/types';
import { GetTransformationSchemaMeta } from './utils';

let schemaRegistry: Record<string, TransformationConfigSchema> | undefined;

function getSchemaRegistry(): Record<string, TransformationConfigSchema> {
  if (!schemaRegistry) {
    const candidates: Record<string, TransformationConfigSchema | undefined> = {
      limit: limitConfigSchema,
      sort_by: sortByConfigSchema,
      filter: filterConfigSchema,
      filter_fields: filterFieldsConfigSchema,
      convert_field_type: convertFieldTypeConfigSchema,
      group_by: groupByConfigSchema,
      extract_fields: extractFieldsConfigSchema,
      add_field: addFieldConfigSchema,
    };

    schemaRegistry = Object.fromEntries(
      Object.entries(candidates).filter(([, schema]) => Boolean(schema))
    ) as Record<string, TransformationConfigSchema>;
  }
  return schemaRegistry;
}

export function registerGetTransformationSchemaAction(
  registerAction: ((action: any) => void) | undefined
) {
  if (!registerAction) return;

  registerAction({
    ...GetTransformationSchemaMeta,
    handler: async (args: { definitionIds: string[] }) => {
      const registry = getSchemaRegistry();
      const availableIds = Object.keys(registry);
      const results: Record<string, TransformationConfigSchema | { error: string }> = {};

      for (const id of args.definitionIds) {
        const schema = registry[id];
        if (!schema) {
          results[id] = {
            error:
              `Unknown transformation type "${id}". ` +
              `Available types: [${availableIds.join(', ')}].`,
          };
        } else {
          results[id] = schema;
        }
      }

      const found = args.definitionIds.filter((id) => registry[id]);
      const unknown = args.definitionIds.filter((id) => !registry[id]);

      return {
        success: unknown.length === 0,
        schemas: results,
        message:
          found.length > 0
            ? `Returned schemas for: [${found.join(', ')}].` +
              (unknown.length > 0 ? ` Unknown types: [${unknown.join(', ')}].` : '') +
              ` Use each schema's field descriptions and enumOptions to build valid config objects, ` +
              `then pass them in the transformations array of auto_create_visualization.`
            : `No valid transformation types found. Available: [${availableIds.join(', ')}].`,
      };
    },
  });
}
