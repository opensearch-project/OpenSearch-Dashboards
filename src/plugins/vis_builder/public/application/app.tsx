/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import {
  DraggableLocation,
  DropResult,
  EuiDragDropContext,
  EuiPage,
  EuiResizableContainer,
} from '@elastic/eui';
import { useLocation } from 'react-router-dom';
import { DragDropProvider } from './utils/drag_drop/drag_drop_context';
import { LeftNav } from './components/left_nav';
import { TopNav } from './components/top_nav';
import { Workspace } from './components/workspace';
import { RightNav } from './components/right_nav';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { VisBuilderServices } from '../types';
import { syncQueryStateWithUrl } from '../../../data/public';

import './app.scss';
import { useAggs, useVisualizationType } from './utils/use';
import { useTypedDispatch, useTypedSelector } from './utils/state_management';
import { SchemaDisplayStates } from './components/data_tab';
import { ADD_PANEL_PREFIX, CANVAS_ID, FIELD_SELECTOR_ID } from './components/data_tab/constants';
import { addFieldToConfiguration } from './components/data_tab/drag_drop/add_field_to_configuration';
import { replaceFieldInConfiguration } from './components/data_tab/drag_drop/replace_field_in_configuration';
import { reorderFieldsWithinSchema } from './components/data_tab/drag_drop/reorder_fields_within_schema';
import { moveFieldBetweenSchemas } from './components/data_tab/drag_drop/move_field_between_schemas';
import { advancedCanvasDropVisualization } from './components/data_tab/drag_drop/drop_to_canvas_visualization';

export const VisBuilderApp = () => {
  // Defining states and props that will be propagated to child components
  const {
    services: {
      data: {
        query,
        search: { aggs: aggService },
      },
      osdUrlStateStorage,
    },
  } = useOpenSearchDashboards<VisBuilderServices>();
  const { pathname } = useLocation();

  const vizType = useVisualizationType();
  const editingState = useTypedSelector(
    (state) => state.visualization.activeVisualization?.draftAgg
  );
  const schemas = vizType.ui.containerConfig.data.schemas;

  const aggProps = useAggs();

  const [activeSchemaFields, setActiveSchemaFields] = useState<SchemaDisplayStates>(() => {
    return schemas.all.reduce((acc, schema) => {
      acc[schema.name] = [];
      return acc;
    }, {});
  });
  // state variable indicating if an item is being dragged
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dispatch = useTypedDispatch();

  useEffect(() => {
    // syncs `_g` portion of url with query services
    const { stop } = syncQueryStateWithUrl(query, osdUrlStateStorage);

    return () => stop();

    // this effect should re-run when pathname is changed to preserve querystring part,
    // so the global state is always preserved
  }, [query, osdUrlStateStorage, pathname]);

  const handleDragEnd = (dropResult: DropResult) => {
    setIsDragging(false); // Resetting the state variable
    try {
      const { source, destination, combine } = dropResult;

      const destinationSchemaName = destination?.droppableId || combine?.droppableId;
      const sourceSchemaName = source.droppableId;

      if (!sourceSchemaName || !destinationSchemaName) {
        // Invalid operation should contain a source and destination
        return;
      }

      // Workflow for a field Drop into the canvas
      if (destinationSchemaName === CANVAS_ID) {
        if (Object.values(FIELD_SELECTOR_ID).includes(sourceSchemaName as FIELD_SELECTOR_ID)) {
          advancedCanvasDropVisualization({
            dropResult,
            aggProps,
            aggService,
            activeSchemaFields,
            dispatch,
            schemas,
          });
        }
        return;
      }

      const panelGroups = Array.from(schemas.all.map((schema) => schema.name));

      // Workfow for field drop on click or drop to add panel button
      if (destinationSchemaName.startsWith(ADD_PANEL_PREFIX)) {
        if (Object.values(FIELD_SELECTOR_ID).includes(sourceSchemaName as FIELD_SELECTOR_ID)) {
          const updatedDestinationSchemaName = destinationSchemaName.split(ADD_PANEL_PREFIX)[1];
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
        }
        return;
      }

      // Workfow for field drop on each of the schemas
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

  // Render the application DOM.
  return (
    <I18nProvider>
      <DragDropProvider>
        <EuiDragDropContext onDragEnd={handleDragEnd} onDragStart={() => setIsDragging(true)}>
          <EuiPage className="vbLayout">
            <TopNav />
            <LeftNav
              isDragging={isDragging}
              vizType={vizType}
              aggProps={aggProps}
              activeSchemaFields={activeSchemaFields}
              setActiveSchemaFields={setActiveSchemaFields}
              schemas={schemas}
              editingState={editingState}
            />
            <EuiResizableContainer className="vbLayout__resizeContainer">
              {(EuiResizablePanel, EuiResizableButton) => (
                <>
                  <EuiResizablePanel
                    className="vbLayout__workspaceResize"
                    paddingSize="none"
                    initialSize={80}
                    minSize="300px"
                    mode="main"
                  >
                    <Workspace />
                  </EuiResizablePanel>
                  <EuiResizableButton className="vbLayout__resizeButton" />
                  <EuiResizablePanel
                    className="vbLayout__rightNavResize"
                    paddingSize="none"
                    initialSize={20}
                    minSize="250px"
                    mode={[
                      'collapsible',
                      {
                        position: 'top',
                      },
                    ]}
                    id="vbRightResize"
                  >
                    <RightNav />
                  </EuiResizablePanel>
                </>
              )}
            </EuiResizableContainer>
          </EuiPage>
        </EuiDragDropContext>
      </DragDropProvider>
    </I18nProvider>
  );
};

export { Option } from './components/option';
