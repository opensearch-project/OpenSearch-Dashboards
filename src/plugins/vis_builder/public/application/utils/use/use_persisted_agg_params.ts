/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AggGroupNames, CreateAggConfigParams } from '../../../../../data/common';
import { Schema } from '../../../../../vis_default_editor/public';

export const usePersistedAggParams = (
  types,
  aggConfigParams: CreateAggConfigParams[],
  oldVisType?: string,
  newVisType?: string
): CreateAggConfigParams[] => {
  if (oldVisType && newVisType) {
    const oldVisualizationType = types.get(oldVisType)?.ui.containerConfig.data.schemas.all;
    const newVisualizationType = types.get(newVisType)?.ui.containerConfig.data.schemas.all;
    const aggMapping = getSchemaMapping(oldVisualizationType, newVisualizationType);
    const updatedAggConfigParams = aggConfigParams.map((aggConfigParam: CreateAggConfigParams) =>
      updateAggParams(aggConfigParam, aggMapping)
    );
    return updatedAggConfigParams;
  }
  return [];
};

// Map metric fields to metric fields, bucket fields to bucket fields
export const getSchemaMapping = (
  oldVisualizationType: Schema[],
  newVisualizationType: Schema[]
): Map<string, AggMapping> => {
  const aggMap = new Map<string, AggMapping>();

  // currently Metrics, Buckets, and None are the three groups. We simply drop the aggregations that belongs to the None group
  mapAggParamsSchema(oldVisualizationType, newVisualizationType, AggGroupNames.Metrics, aggMap);
  mapAggParamsSchema(oldVisualizationType, newVisualizationType, AggGroupNames.Buckets, aggMap);

  return aggMap;
};

export interface AggMapping {
  name: string;
  maxCount: number;
  currentCount: number;
}

export const mapAggParamsSchema = (
  oldVisualizationType: Schema[],
  newVisualizationType: Schema[],
  aggGroup: string,
  map: Map<string, AggMapping>
) => {
  const oldSchemas = oldVisualizationType.filter((type) => type.group === aggGroup);
  const newSchemas = newVisualizationType.filter((type) => type.group === aggGroup);

  oldSchemas.forEach((oldSchema, index) => {
    if (newSchemas[index]) {
      const mappedNewSchema = {
        name: newSchemas[index].name,
        maxCount: newSchemas[index].max,
        currentCount: 0,
      };
      map.set(oldSchema.name, mappedNewSchema);
    }
  });
};

export const updateAggParams = (
  oldAggParam: CreateAggConfigParams,
  aggMap: Map<string, AggMapping>
) => {
  const newAggParam = { ...oldAggParam };
  if (oldAggParam.schema) {
    const newSchema = aggMap.get(oldAggParam.schema);
    newAggParam.schema = newSchema
      ? newSchema.currentCount < newSchema.maxCount
        ? assignNewSchemaType(oldAggParam, aggMap, newSchema)
        : undefined
      : undefined;
  }
  return newAggParam;
};

export const assignNewSchemaType = (
  oldAggParam: any,
  aggMap: Map<string, AggMapping>,
  newSchema: AggMapping
) => {
  aggMap.set(oldAggParam.schema, {
    name: newSchema.name,
    maxCount: newSchema.maxCount,
    currentCount: newSchema.currentCount + 1,
  });
  return aggMap.get(oldAggParam.schema)?.name;
};
