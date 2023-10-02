/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateAggConfigParams, propFilter } from '../../../../data/common';
import { Schema } from '../../../../vis_default_editor/public';

const filterByType = propFilter('type');

export const getPersistedAggParams = (
  aggConfigParams: CreateAggConfigParams[],
  oldVisSchemas: Schema[] = [],
  newVisSchemas: Schema[] = []
): CreateAggConfigParams[] => {
  const updatedAggConfigParams: CreateAggConfigParams[] = [];
  const newVisSchemaCounts: Record<string, number> = newVisSchemas.reduce((acc, schema: Schema) => {
    acc[schema.name] = schema.max;
    return acc;
  }, {});

  // For each aggConfigParam, check if a compatible schema exists in the new visualization type
  aggConfigParams.forEach((aggConfigParam) => {
    const currentSchema = oldVisSchemas.find((schema: Schema) => {
      return schema.name === aggConfigParam.schema;
    });

    // see if a matching schma exists in the new visualization type
    const matchingSchema = newVisSchemas.find((schema: Schema) => {
      return schema.name === aggConfigParam.schema;
    });

    // if the matching schema is same as the current schema, add the aggConfigParam to the updatedAggConfigParams
    if (
      isSchemaEqual(matchingSchema, currentSchema) &&
      newVisSchemaCounts[matchingSchema!.name] > 0
    ) {
      updatedAggConfigParams.push(aggConfigParam);
      newVisSchemaCounts[matchingSchema!.name] -= 1;
      return;
    }

    // if a matching schema does not exist, check if a compatible schema exists
    for (const schema of newVisSchemas) {
      // Check if the schema group is the same
      if (schema.group !== currentSchema!.group) continue;

      const compatibleSchema = filterByType([aggConfigParam], schema.aggFilter).length !== 0;

      if (compatibleSchema && newVisSchemaCounts[schema.name] > 0) {
        updatedAggConfigParams.push({
          ...aggConfigParam,
          schema: schema.name,
        });
        newVisSchemaCounts[schema.name] -= 1;
        break;
      }
    }
  });

  return updatedAggConfigParams;
};

function isSchemaEqual(schema1?: Schema, schema2?: Schema) {
  // Check if schema1 and schema2 exist
  if (!schema1 || !schema2) return false;

  if (schema1.name !== schema2.name) return false;
  if (schema1.group !== schema2.group) return false;

  // Check if aggFilter is the same
  if (schema1.aggFilter.length !== schema2.aggFilter.length) return false;
  for (let i = 0; i < schema1.aggFilter.length; i++) {
    if (schema1.aggFilter[i] !== schema2.aggFilter[i]) return false;
  }

  return true;
}
