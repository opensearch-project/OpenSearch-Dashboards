/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { DraggableLocation, DropResult, EuiDragDropContext } from '@elastic/eui';
import { FieldSelector } from './field_selector';

import './index.scss';
import { ConfigPanel } from './config_panel';
import { useAggs, useVisualizationType } from '../../utils/use';
import { useTypedDispatch, useTypedSelector } from '../../utils/state_management';

import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { VisBuilderServices } from '../../../types';
import { DropboxDisplay } from './dropbox';
import { ADD_PANEL_PREFIX, FIELD_SELECTOR_ID } from './constants';
import { addFieldToConfiguration } from './drag_drop/add_field_to_configuration';
import { replaceFieldInConfiguration } from './drag_drop/replace_field_in_configuration';
import { reorderFieldsWithinSchema } from './drag_drop/reorder_fields_within_schema';
import { moveFieldBetweenSchemas } from './drag_drop/move_field_between_schemas';
import { validateAggregations } from '../../utils/validations';

export const DATA_TAB_ID = 'data_tab';

export interface SchemaDisplayStates {
  [key: string]: DropboxDisplay[];
}

export const DataTab = () => {
  // Config panel States
  const vizType = useVisualizationType();
  const editingState = useTypedSelector(
    (state) => state.visualization.activeVisualization?.draftAgg
  );
  const schemas = vizType.ui.containerConfig.data.schemas;
  const {
    services: {
      data: {
        search: { aggs: aggService },
      },
      notifications: { toasts },
    },
  } = useOpenSearchDashboards<VisBuilderServices>();

  const aggProps = useAggs();
  const [activeSchemaFields, setActiveSchemaFields] = useState<SchemaDisplayStates>(() => {
    return schemas.all.reduce((acc, schema) => {
      acc[schema.name] = [];
      return acc;
    }, {});
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dispatch = useTypedDispatch();

  useEffect(() => {
    const newState = schemas.all.reduce((acc, schema) => {
      acc[schema.name] = [];
      return acc;
    }, {});
    const updatedState = { ...newState, ...activeSchemaFields };
    setActiveSchemaFields(updatedState);
    // This useEffect hook should run whenever the upstream params corresponding to schemas and vizType changes hence disabling the eslint which asks to include activeSchemaFields as dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemas, vizType]);

  const handleDragEnd = (dropResult: DropResult) => {
    try {
      setIsDragging(false); // Reseting the Dragging flag
      const { source, destination, combine } = dropResult;

      const destinationSchemaName = destination?.droppableId || combine?.droppableId;
      const sourceSchemaName = source.droppableId;

      if (!sourceSchemaName || !destinationSchemaName) {
        // Invalid operation should contain a source and destination
        return;
      }

      const panelGroups = Array.from(schemas.all.map((schema) => schema.name));
      // Check schema order
      if (destinationSchemaName === 'split') {
        const validationResult = validateAggregations(aggProps.aggs, schemas.all);
        if (!validationResult.valid) {
          toasts.addWarning({
            title: 'vb_invalid_schema',
            text: validationResult.errorMsg,
          });
          return;
        }
      }

      if (destinationSchemaName.startsWith(ADD_PANEL_PREFIX)) {
        const updatedDestinationSchemaName = destinationSchemaName.split(ADD_PANEL_PREFIX)[1];

        if (Object.values(FIELD_SELECTOR_ID).includes(sourceSchemaName as FIELD_SELECTOR_ID)) {
          if (panelGroups.includes(updatedDestinationSchemaName)) {
            const newDropResult = {
              ...dropResult,
              destination: {
                droppableId: updatedDestinationSchemaName,
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
        } else if (panelGroups.includes(sourceSchemaName)) {
          if (panelGroups.includes(updatedDestinationSchemaName)) {
            const newDropResult = {
              ...dropResult,
              destination: {
                droppableId: updatedDestinationSchemaName,
                index: 0,
              } as DraggableLocation,
            };
            moveFieldBetweenSchemas({
              dropResult: newDropResult,
              aggProps,
              aggService,
              activeSchemaFields,
              dispatch,
              schemas,
            });
          }
        }
        return;
      }

      if (Object.values(FIELD_SELECTOR_ID).includes(sourceSchemaName as FIELD_SELECTOR_ID)) {
        if (panelGroups.includes(destinationSchemaName) && !combine) {
          addFieldToConfiguration({
            dropResult,
            aggProps,
            aggService,
            activeSchemaFields,
            dispatch,
            schemas,
          });
        } else if (panelGroups.includes(destinationSchemaName) && combine) {
          replaceFieldInConfiguration({
            dropResult,
            aggProps,
            aggService,
            activeSchemaFields,
            dispatch,
            schemas,
          });
        }
      } else if (panelGroups.includes(sourceSchemaName)) {
        if (panelGroups.includes(destinationSchemaName)) {
          if (sourceSchemaName === destinationSchemaName && !combine) {
            reorderFieldsWithinSchema({
              dropResult,
              aggProps,
              aggService,
              activeSchemaFields,
              dispatch,
              schemas,
            });
          } else if (sourceSchemaName !== destinationSchemaName && !combine) {
            moveFieldBetweenSchemas({
              dropResult,
              aggProps,
              aggService,
              activeSchemaFields,
              dispatch,
              schemas,
            });
          } else if (combine) {
            replaceFieldInConfiguration({
              dropResult,
              aggProps,
              aggService,
              activeSchemaFields,
              dispatch,
              schemas,
            });
          }
        }
      }
    } catch (err) {
      return;
    }
  };

  return (
    <EuiDragDropContext onDragEnd={handleDragEnd} onDragStart={() => setIsDragging(true)}>
      <div className="vbDataTab">
        <FieldSelector />
        <ConfigPanel
          schemas={schemas}
          editingState={editingState}
          aggProps={aggProps}
          activeSchemaFields={activeSchemaFields}
          setActiveSchemaFields={setActiveSchemaFields}
          isDragging={isDragging}
        />
      </div>
    </EuiDragDropContext>
  );
};
