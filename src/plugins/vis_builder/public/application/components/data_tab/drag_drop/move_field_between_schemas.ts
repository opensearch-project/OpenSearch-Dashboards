/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { updateAggConfigParams } from '../../../utils/state_management/visualization_slice';
import { createNewAggConfig } from '../utils/get_valid_aggregations';
import { DragDropProperties } from './add_field_to_configuration';

export function moveFieldBetweenSchemas({
  dropResult,
  schemas,
  aggProps,
  aggService,
  activeSchemaFields,
  dispatch,
}: DragDropProperties) {
  const { source, destination, combine, draggableId } = dropResult;

  const destinationSchemaName = destination?.droppableId;
  if (!destinationSchemaName) {
    // Invalid Transition
    return;
  }
  const sourceAggId = draggableId;

  const destinationSchema = schemas.all.find(
    (schema) => schema.name === (destination?.droppableId || combine?.droppableId)
  );

  if (!destinationSchema) {
    // Invalid Transition
    return;
  }

  const sourceAgg = aggProps.aggConfigs?.aggs.find((agg) => agg.id === sourceAggId);
  const sourceFieldName = sourceAgg?.fieldName();

  const destinationAggFields = activeSchemaFields[destinationSchemaName];

  const destinationLimit = destinationSchema?.max;

  if (destinationLimit && destinationAggFields.length <= destinationLimit) {
    // destination schema has space for more items to be added
    // We Need to update sourceAgg

    createNewAggConfig({
      fieldName: sourceFieldName,
      sourceGroup: source.droppableId,
      destinationSchema,
      aggProps,
      aggService,
      sourceAgg,
    });

    // Remove the sourceAggConfig from the updated Config
    const updatedAggConfig = aggProps.aggConfigs?.aggs.filter((agg) => agg.id !== sourceAggId);

    if (updatedAggConfig?.length) {
      dispatch(updateAggConfigParams(updatedAggConfig.map((agg) => agg.serialize())));
    }
  }
}
