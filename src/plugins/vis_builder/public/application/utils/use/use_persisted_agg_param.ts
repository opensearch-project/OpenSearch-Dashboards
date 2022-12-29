/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateAggConfigParams } from '../../../../../data/common';
import { Schema } from '../../../../../vis_default_editor/public';

export const usePersistedAggParams = (
  types,
  oldAggParams: CreateAggConfigParams[],
  oldVisType?: string,
  newVisType?: string
): CreateAggConfigParams[] => {
  // Do not persist agg param for metric or table
  if (
    oldVisType === 'metric' ||
    oldVisType === 'table' ||
    newVisType === 'metric' ||
    newVisType === 'table' ||
    !newVisType
  ) {
    return [];
  }

  const newVisualizationType = types.get(newVisType)?.ui.containerConfig.data.schemas.all;

  return oldAggParams.filter((oldAggParam: CreateAggConfigParams) =>
    updateAggParams(oldAggParam, newVisualizationType)
  );
};

export const updateAggParams = (
  oldAggParam: CreateAggConfigParams,
  newVisualizationType?: Schema[]
) => {
  const schemaType = oldAggParam.schema;
  if (schemaType && newVisualizationType) {
    return newVisualizationType.map((type) => type.name).includes(schemaType);
  }
  return false;
};
