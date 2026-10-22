/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getTransformationConfigSchemaRegistry } from '../../data_transformations';
import { TransformationConfigSchema } from '../../data_transformations/types';
import { GetTransformationSchemaMeta } from './utils';

let schemaRegistry: Record<string, TransformationConfigSchema> | undefined;

function getSchemaRegistry(): Record<string, TransformationConfigSchema> {
  if (!schemaRegistry) {
    schemaRegistry = getTransformationConfigSchemaRegistry();
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
