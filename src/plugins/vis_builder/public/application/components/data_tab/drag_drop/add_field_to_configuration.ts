/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DropResult } from '@elastic/eui';
import { AnyAction } from 'redux';
import { createNewAggConfig } from '../utils/get_valid_aggregations';
import { updateAggConfigParams } from '../../../utils/state_management/visualization_slice';
import { Schemas } from '../../../../../../vis_default_editor/public';
import { AggProps } from '../config_panel';
import { SchemaDisplayStates } from '../index';
import { Dispatch } from '../../../../../../opensearch_dashboards_utils/common/state_containers/types';
import { AggsStart } from '../../../../../../data/common';

export interface DragDropProperties {
  dropResult: DropResult;
  schemas: Schemas;
  aggProps: AggProps;
  aggService: AggsStart;
  activeSchemaFields: SchemaDisplayStates;
  dispatch: Dispatch<AnyAction>;
}

export function addFieldToConfiguration({
  dropResult,
  schemas,
  aggProps,
  aggService,
  activeSchemaFields,
  dispatch,
}: DragDropProperties) {
  const { source, destination, combine, draggableId } = dropResult;

  const destinationSchemaName = destination?.droppableId;
  const destinationSchema = schemas.all.find((schema) => schema.name === destinationSchemaName);

  const newFieldToAdd = draggableId;

  if (!destinationSchema || !destinationSchemaName) {
    // Invalid drop target selected
    return;
  }

  const destinationFields = activeSchemaFields[destinationSchemaName];

  if (!combine && destination && destinationFields.length > destinationSchema?.max) {
    // Can't Add additional Fields
    return;
  }

  // Adding the new field
  createNewAggConfig({
    fieldName: newFieldToAdd,
    sourceGroup: source.droppableId,
    destinationSchema,
    aggProps,
    aggService,
    sourceAgg: null,
  });

  const updatedAggConfigs = aggProps.aggConfigs?.aggs;

  if (updatedAggConfigs) {
    dispatch(updateAggConfigParams(updatedAggConfigs.map((agg) => agg.serialize())));
  }
}
