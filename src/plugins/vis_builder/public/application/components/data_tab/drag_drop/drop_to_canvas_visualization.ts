/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DraggableLocation } from '@elastic/eui';
import { addFieldToConfiguration } from './add_field_to_configuration';
import { FIELD_SELECTOR_ID } from '../constants';

export function basicCanvasDropVisualization({
  dropResult,
  aggProps,
  aggService,
  activeSchemaFields,
  dispatch,
  schemas,
}) {
  // Updated dropResult emulating dropping of the field on the metric schema
  const newDropResult = {
    ...dropResult,
    destination: {
      droppableId: 'metric',
      index: 0,
    } as DraggableLocation,
  };

  addFieldToConfiguration({
    dropResult: newDropResult,
    aggProps,
    aggService,
    activeSchemaFields,
    dispatch,
    schemas,
  });
}

export function advancedCanvasDropVisualization({
  dropResult,
  aggProps,
  aggService,
  activeSchemaFields,
  dispatch,
  schemas,
}) {
  const containsSegmentSchema = schemas.all.find((schema) => schema.name === 'segment')
    ? true
    : false;

  if (!containsSegmentSchema) {
    // No segment Schema available hence using the field as metric aggregation
    basicCanvasDropVisualization({
      dropResult,
      aggProps,
      aggService,
      activeSchemaFields,
      dispatch,
      schemas,
    });
    return;
  }

  const { source } = dropResult;

  const fieldSelector = source.droppableId;

  switch (fieldSelector as FIELD_SELECTOR_ID) {
    case FIELD_SELECTOR_ID.NUMERICAL:
      // The dropped in field should be a metric aggregation while the timeStampField is the segment aggregation
      const timeStampFieldName = aggProps.indexPattern.timeFieldName;

      // Add dropped Field as metric aggregation
      basicCanvasDropVisualization({
        dropResult,
        aggProps,
        aggService,
        activeSchemaFields,
        dispatch,
        schemas,
      });

      // Updated dropresult emulating dropping of timeStampField on the segment Schema
      const newDropResult = {
        ...dropResult,
        source: {
          droppableId: FIELD_SELECTOR_ID.CATEGORICAL,
          index: 0,
        } as DraggableLocation,
        destination: {
          droppableId: 'segment',
          index: 0,
        } as DraggableLocation,
        draggableId: timeStampFieldName,
      };

      // Add timeStampField as segment aggregation
      addFieldToConfiguration({
        dropResult: newDropResult,
        aggProps,
        aggService,
        activeSchemaFields,
        dispatch,
        schemas,
      });
      break;
    case FIELD_SELECTOR_ID.COUNT:
      // Add the dropped field as a metric Aggregation
      basicCanvasDropVisualization({
        dropResult,
        aggProps,
        aggService,
        activeSchemaFields,
        dispatch,
        schemas,
      });
      break;
    default:
      // Count should be the metric aggregation while the dropped field should be segment aggregation

      // Updated dropresult emulating dropping of count on the metric Schema
      const newDropResult2 = {
        ...dropResult,
        destination: {
          droppableId: 'metric',
          index: 0,
        } as DraggableLocation,
        source: {
          droppableId: FIELD_SELECTOR_ID.COUNT,
          index: 0,
        } as DraggableLocation,
        draggableId: 'count',
      };

      // Add the count field as metric aggregation
      addFieldToConfiguration({
        dropResult: newDropResult2,
        aggProps,
        aggService,
        activeSchemaFields,
        dispatch,
        schemas,
      });

      // Updated dropresult emulating dropping of field on the segment Schema
      const newDropResult1 = {
        ...dropResult,
        destination: {
          droppableId: 'segment',
          index: 0,
        } as DraggableLocation,
      };

      // Add the dropped field as segment aggregation
      addFieldToConfiguration({
        dropResult: newDropResult1,
        aggProps,
        aggService,
        activeSchemaFields,
        dispatch,
        schemas,
      });

      break;
  }
}
