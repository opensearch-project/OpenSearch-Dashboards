/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { cloneDeep } from 'lodash';
import { Schema } from '../../../../../../vis_default_editor/public';
import { COUNT_FIELD, FieldDragDataType } from '../../../utils/drag_drop/types';
import { useTypedDispatch } from '../../../utils/state_management';
import { DropboxDisplay, DropboxProps } from '../dropbox';
import { useDrop } from '../../../utils/drag_drop';
import {
  editDraftAgg,
  reorderAgg,
  updateAggConfigParams,
} from '../../../utils/state_management/visualization_slice';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { VisBuilderServices } from '../../../../types';
import { getValidAggTypes } from '../utils/get_valid_aggregations';
import { AggProps } from '../config_panel';
import { SchemaDisplayStates } from '..';

export interface UseDropboxProps extends Pick<DropboxProps, 'id' | 'label'> {
  schema: Schema;
  aggProps: AggProps;
  activeSchemaFields: SchemaDisplayStates;
  setActiveSchemaFields: React.Dispatch<React.SetStateAction<SchemaDisplayStates>>;
  isDragging: boolean;
}

export const useDropbox = (props: UseDropboxProps): DropboxProps => {
  const {
    id: dropboxId,
    label,
    schema,
    aggProps,
    activeSchemaFields,
    setActiveSchemaFields,
    isDragging,
  } = props;
  const [validAggTypes, setValidAggTypes] = useState<string[]>([]);
  const { aggConfigs, indexPattern, aggs, timeRange } = aggProps;
  const fields = activeSchemaFields[schema.name];

  const dispatch = useTypedDispatch();
  const {
    services: {
      data: {
        search: { aggs: aggService },
      },
    },
  } = useOpenSearchDashboards<VisBuilderServices>();

  const dropboxAggs = useMemo(() => aggs.filter((agg) => agg.schema === schema.name), [
    aggs,
    schema.name,
  ]);

  const displayFields: DropboxDisplay[] = useMemo(
    () =>
      dropboxAggs?.map(
        (agg): DropboxDisplay => {
          // For timeseries aggregations that have timeinterval set as auto, the current timerange is required to calculate the label accurately
          agg.aggConfigs.setTimeRange(timeRange);
          return {
            id: agg.id,
            label: agg.makeLabel(),
          };
        }
      ) ?? [],
    [dropboxAggs, timeRange]
  );

  useEffect(() => {
    if (displayFields && JSON.stringify(fields) !== JSON.stringify(displayFields)) {
      const newDisplayState = { ...activeSchemaFields };
      newDisplayState[schema.name] = displayFields;
      setActiveSchemaFields(newDisplayState);
    }
    // useEffect runs whenever disaplyFields changes and this in turn updates the activeSchema fields passed by parent hence disabling eslint that asks activeSchema to be included in dependecy list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayFields]);

  // Event handlers for each dropbox action type
  const onAddField = useCallback(() => {
    if (!aggConfigs || !indexPattern) {
      throw new Error('Cannot create new field, missing aggConfigs or indexPattern');
    }

    const aggConfig = aggConfigs.createAggConfig(
      {
        schema: schema.name,
        // using any since createAggConfig requires the type property but when an agg is brandNew, this has to be skipped.
        // TODO: Update createAggConfig typing to correctly handle missing type field
      } as any,
      {
        addToAggConfigs: false,
      }
    );

    aggConfig.brandNew = true;
    const newAggs = [...aggs, aggConfig];
    const newAggConfigs = aggService.createAggConfigs(indexPattern, cloneDeep(newAggs));
    const newAggConfig = newAggConfigs.aggs.find((agg) => agg.brandNew);

    if (!newAggConfig) {
      throw new Error('Missing new aggConfig');
    }

    dispatch(editDraftAgg(newAggConfig.serialize()));
  }, [aggConfigs, aggService, aggs, dispatch, indexPattern, schema.name]);

  const onEditField = useCallback(
    (aggId: string) => {
      const aggConfig = aggConfigs?.aggs.find((agg) => agg.id === aggId);

      if (!aggConfig) {
        throw new Error('Could not find agg in aggConfigs');
      }

      dispatch(editDraftAgg(aggConfig.serialize()));
    },
    [aggConfigs?.aggs, dispatch]
  );

  const onDeleteField = useCallback(
    (aggId: string) => {
      const newAggs = aggConfigs?.aggs.filter((agg) => agg.id !== aggId);
      if (newAggs) {
        dispatch(updateAggConfigParams(newAggs.map((agg) => agg.serialize())));
      }
    },
    [aggConfigs?.aggs, dispatch]
  );

  const onDropField = useCallback(
    (data: FieldDragDataType['value']) => {
      if (!data || !validAggTypes.length) return;

      const fieldName = data;
      const schemaAggTypes = (schema.defaults as any).aggTypes;
      const allowedAggTypes = schemaAggTypes
        ? schemaAggTypes.filter((type: string) => validAggTypes.includes(type))
        : [];

      aggConfigs?.createAggConfig({
        type: allowedAggTypes[0] || validAggTypes[0],
        schema: schema.name,
        params: {
          field: fieldName,
        },
      });

      if (aggConfigs) {
        dispatch(updateAggConfigParams(aggConfigs.aggs.map((agg) => agg.serialize())));
      }
    },
    [aggConfigs, dispatch, schema.defaults, schema.name, validAggTypes]
  );

  const onReorderField = useCallback(
    ({ sourceAggId, destinationAggId }) => {
      dispatch(
        reorderAgg({
          sourceId: sourceAggId,
          destinationId: destinationAggId,
        })
      );
    },
    [dispatch]
  );

  const [dropProps, { isValidDropTarget, dragData, ...dropState }] = useDrop(
    'field-data',
    onDropField
  );

  useEffect(() => {
    const fieldName = typeof dragData === typeof COUNT_FIELD ? '' : (dragData as string);
    const sourceGroup = typeof dragData === typeof COUNT_FIELD ? 'preDefinedCountMetric' : '';

    setValidAggTypes(
      getValidAggTypes({
        fieldName,
        sourceGroup,
        destinationSchema: schema,
        aggProps,
        aggService,
        sourceAgg: null,
      })
    );

    return () => {
      setValidAggTypes([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aggService.types, dragData, indexPattern?.fields, schema.aggFilter, schema.group]);
  const canDrop = validAggTypes.length > 0 && schema.max > dropboxAggs.length;

  return {
    id: dropboxId,
    label,
    limit: schema.max,
    fields: displayFields,
    onAddField,
    onEditField,
    onDeleteField,
    onReorderField,
    ...dropState,
    dragData,
    isValidDropTarget: canDrop,
    dropProps,
    isDragging,
  };
};
