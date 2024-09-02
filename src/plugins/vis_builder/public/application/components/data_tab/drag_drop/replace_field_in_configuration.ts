/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { updateAggConfigParams } from '../../../utils/state_management/visualization_slice';
import { FIELD_SELECTOR_ID } from '../constants';
import { createNewAggConfig } from '../utils/get_valid_aggregations';
import { DragDropProperties } from './add_field_to_configuration';

export function replaceFieldInConfiguration({
  dropResult,
  schemas,
  aggProps,
  aggService,
  dispatch,
}: DragDropProperties) {
  const { source, combine, draggableId } = dropResult;

  const destinationSchemaName = combine?.droppableId;
  if (!destinationSchemaName) {
    return;
  }

  const sourceAggId = draggableId;
  const destinationAggId = combine?.draggableId;

  const destinationSchema = schemas.all.find((schema) => schema.name === combine?.droppableId);

  if (!destinationSchema) {
    // Invalid Transition
    return;
  }

  const sourceSchema = source.droppableId;

  if (Object.values(FIELD_SELECTOR_ID).includes(sourceSchema as FIELD_SELECTOR_ID)) {
    // Replacing an exisitng configuration with a new field from field selector panel

    const newFieldToAdd = draggableId;
    createNewAggConfig({
      fieldName: newFieldToAdd,
      sourceGroup: source.droppableId,
      destinationSchema,
      aggProps,
      aggService,
      sourceAgg: null,
    });

    // Removing the exisiting destination Aggregation
    const updatedAggConfig = aggProps.aggConfigs?.aggs.filter((agg) => agg.id !== destinationAggId);

    if (updatedAggConfig) {
      dispatch(updateAggConfigParams(updatedAggConfig.map((agg) => agg.serialize())));
    }
  } else {
    // Replacing an existing configuration with another exisiting configuration

    const sourceAgg = aggProps.aggConfigs?.aggs.find((agg) => agg.id === sourceAggId);
    const sourceFieldName = sourceAgg?.fieldName();

    createNewAggConfig({
      fieldName: sourceFieldName,
      sourceGroup: source.droppableId,
      destinationSchema,
      aggProps,
      aggService,
      sourceAgg,
    });

    // Removing the exisiting destination and source Aggregation
    const updatedAggConfig = aggProps.aggConfigs?.aggs.filter(
      (agg) => agg.id !== destinationAggId && agg.id !== sourceAggId
    );

    if (updatedAggConfig) {
      dispatch(updateAggConfigParams(updatedAggConfig.map((agg) => agg.serialize())));
    }
  }
}
