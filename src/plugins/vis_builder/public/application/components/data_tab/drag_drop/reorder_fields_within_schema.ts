/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { reorderAgg } from '../../../utils/state_management/visualization_slice';
import { DragDropProperties } from './add_field_to_configuration';

export function reorderFieldsWithinSchema({
  dropResult,
  schemas,
  activeSchemaFields,
  dispatch,
}: DragDropProperties) {
  const { destination, draggableId } = dropResult;

  const destinationSchemaName = destination?.droppableId;
  if (!destinationSchemaName) {
    // Invalid Transition
    return;
  }
  const destinationAggFields = activeSchemaFields[destinationSchemaName];

  const sourceAggId = draggableId;
  const destinationAggId = destinationAggFields[destination?.index].id;

  const destinationSchema = schemas.all.find((schema) => schema.name === destination?.droppableId);

  if (!destinationSchema) {
    // Invalid Transition
    return;
  }

  dispatch(
    reorderAgg({
      sourceId: sourceAggId,
      destinationId: destinationAggId,
    })
  );
}
