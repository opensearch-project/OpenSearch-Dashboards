/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { DropResult, EuiDragDropContext } from '@elastic/eui';
import { FieldSelector } from './field_selector';

import './index.scss';
import { ConfigPanel } from './config_panel';
import { useAggs, useVisualizationType } from '../../utils/use';
import { useTypedDispatch, useTypedSelector } from '../../utils/state_management';

import {
  reorderAgg,
  updateAggConfigParams,
} from '../../utils/state_management/visualization_slice';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { VisBuilderServices } from '../../../types';
import { createNewAggConfig } from './utils/get_valid_aggregations';
import { DropboxDisplay } from './dropbox';

export const DATA_TAB_ID = 'data_tab';

export interface SchemaDisplayStates {
  [key: string]: DropboxDisplay[];
}

export const DataTab = () => {
  // Field Selector panel States
  const fieldSelectorGroups = [
    'preDefinedCountMetric',
    'categoricalFields',
    'numericalFields',
    'metaFields',
  ];

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
    },
  } = useOpenSearchDashboards<VisBuilderServices>();

  const aggProps = useAggs();
  const [schemaDisplayStates, setSchemaDisplayStates] = useState<SchemaDisplayStates>(() => {
    return schemas.all.reduce((acc, schema) => {
      acc[schema.name] = [];
      return acc;
    }, {});
  });
  const dispatch = useTypedDispatch();

  useEffect(() => {
    const newState = schemas.all.reduce((acc, schema) => {
      acc[schema.name] = [];
      return acc;
    }, {});
    const updatedState = { ...newState, ...schemaDisplayStates };
    setSchemaDisplayStates(updatedState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemas, vizType]);

  const handleFieldSelectorToConfigurationPanelTransition = ({
    source,
    destination,
    combine,
    draggableId,
  }: DropResult) => {
    // destination Schema
    const destinationSchemaName = destination?.droppableId || combine?.droppableId;
    const destinationSchema = schemas.all.find((schema) => schema.name === destinationSchemaName);
    const destinationFieldToCombine = combine?.draggableId;

    const newFieldToAdd = draggableId;

    if (!destinationSchema || !destinationSchemaName) {
      // Invalid drop target selected
      return;
    }

    const destinationFields = schemaDisplayStates[destinationSchemaName];

    if (!combine && destination && destinationFields.length > destinationSchema?.max) {
      // Can't Add additional Fields
      return;
    }

    // Case 1 we are adding a new field

    createNewAggConfig({
      fieldName: newFieldToAdd,
      sourceGroup: source.droppableId,
      destinationSchema,
      aggProps,
      aggService,
      sourceAgg: null,
    });

    let updatedAggConfigs = aggProps.aggConfigs?.aggs;

    if (combine) {
      // remove the previously selected Aggreagtion
      updatedAggConfigs = updatedAggConfigs?.filter((agg) => agg.id !== destinationFieldToCombine);
    }
    if (updatedAggConfigs) {
      dispatch(updateAggConfigParams(updatedAggConfigs.map((agg) => agg.serialize())));
    }
  };

  const handleConfigurationPanelTransition = ({
    source,
    destination,
    combine,
    draggableId,
  }: DropResult) => {
    const destinationSchemaName = destination?.droppableId || combine?.droppableId;
    const destinationAggFields = schemaDisplayStates[destinationSchemaName];

    const sourceAggId = draggableId;
    const destinationAggId = destinationAggFields[destination?.index] || combine?.draggableId;

    const destinationSchema = schemas.all.find(
      (schema) => schema.name === (destination?.droppableId || combine?.droppableId)
    );

    if (!destinationSchema) {
      // Invalid Transition
      return;
    }

    const sourceAgg = aggProps.aggConfigs?.aggs.find((agg) => agg.id === sourceAggId);
    const sourceFieldName = sourceAgg?.fieldName();

    if (!combine) {
      if (source?.droppableId === destination?.droppableId && source !== null) {
        if (source.index === destination.index) {
          // Moving the same element
          return;
        } else {
          // Reordering of the selections within a same group
          dispatch(
            reorderAgg({
              sourceId: sourceAggId,
              destinationId: destinationAggId,
            })
          );
        }
      } else if (
        source?.droppableId !== destination?.droppableId &&
        source !== null &&
        destination !== null
      ) {
        // Moving a element from one Dropable Box to another

        const destinationLimit = destinationSchema?.max;
        if (destinationLimit && destinationAggFields.length <= destinationLimit) {
          // Case 1: Destination has space
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
          const updatedAggConfig = aggProps.aggConfigs?.aggs.filter(
            (agg) => agg.id !== sourceAggId
          );

          if (updatedAggConfig?.length) {
            dispatch(updateAggConfigParams(updatedAggConfig.map((agg) => agg.serialize())));
          }
        } else {
          // Case 2 : Destination has no space
          return;
        }
      }
    } else if (combine !== null) {
      // Combining Elements
      // TODO: Do we need to restrict drag and drop features amongst the Dragables in one Droppables

      // Creating an Aggregation of the Source Field in the destination Schema
      createNewAggConfig({
        fieldName: sourceFieldName,
        sourceGroup: source.droppableId,
        destinationSchema,
        aggProps,
        aggService,
        sourceAgg,
      });

      // Removing the previous destination and source AggId's
      const updatedAggConfig = aggProps.aggConfigs?.aggs.filter(
        (agg) => agg.id !== destinationAggId && agg.id !== sourceAggId
      );

      if (updatedAggConfig) {
        dispatch(updateAggConfigParams(updatedAggConfig.map((agg) => agg.serialize())));
      }
    }
  };

  const handleDragEnd = ({ source, destination, combine, draggableId }: DropResult) => {
    try {
      const destinationSchemaName = destination?.droppableId || combine?.droppableId;
      const sourceSchemaName = source.droppableId;

      if (!sourceSchemaName || !destinationSchemaName) {
        // Invalid Scenario source should be present
        return;
      }

      const panelGroups = Array.from(schemas.all.map((schema) => schema.name));

      // Transition from FieldSelector to Conifg panel
      if (fieldSelectorGroups.includes(sourceSchemaName)) {
        if (panelGroups.includes(destinationSchemaName)) {
          handleFieldSelectorToConfigurationPanelTransition({
            source,
            destination,
            combine,
            draggableId,
          } as DropResult);
        }
      } else if (panelGroups.includes(sourceSchemaName)) {
        if (panelGroups.includes(destinationSchemaName)) {
          handleConfigurationPanelTransition({
            source,
            destination,
            combine,
            draggableId,
          } as DropResult);
        }
      }
    } catch (err) {
      return;
    }
  };

  return (
    <EuiDragDropContext onDragEnd={handleDragEnd}>
      <div className="vbDataTab">
        <FieldSelector />
        <ConfigPanel
          schemas={schemas}
          editingState={editingState}
          aggProps={aggProps}
          schemaDisplayStates={schemaDisplayStates}
          setSchemaDisplayStates={setSchemaDisplayStates}
        />
      </div>
    </EuiDragDropContext>
  );
};
