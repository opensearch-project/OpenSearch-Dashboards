/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo } from 'react';
import { cloneDeep } from 'lodash';
import { IndexPatternField } from 'src/plugins/data/common';
import { Schema } from '../../../../../../../../vis_default_editor/public';
import { FieldDragDataType } from '../../../../../utils/drag_drop/types';
import { useTypedDispatch, useTypedSelector } from '../../../../../utils/state_management';
import { DropboxState, DropboxDisplay } from '../types';
import { DropboxProps } from '../dropbox';
import { useDrop } from '../../../../../utils/drag_drop';
import {
  editAgg,
  reorderAgg,
  updateAggConfigParams,
} from '../../../../../utils/state_management/visualization_slice';
import { useIndexPattern } from '../../../../../../application/utils/use/use_index_pattern';
import { useOpenSearchDashboards } from '../../../../../../../../opensearch_dashboards_react/public';
import { WizardServices } from '../../../../../../types';

export const INITIAL_STATE: DropboxState = {
  instances: [],
};

export interface UseDropboxProps extends Pick<DropboxProps, 'id' | 'label'> {
  schema: Schema;
}

export const useDropbox = (props: UseDropboxProps): DropboxProps => {
  const { id: dropboxId, label, schema } = props;
  const dispatch = useTypedDispatch();
  const indexPattern = useIndexPattern();
  const {
    services: {
      data: {
        search: { aggs: aggService },
      },
    },
  } = useOpenSearchDashboards<WizardServices>();
  const aggConfigParams = useTypedSelector(
    (state) => state.visualization.activeVisualization?.aggConfigParams
  );

  const aggConfigs = useMemo(() => {
    return indexPattern && aggService.createAggConfigs(indexPattern, cloneDeep(aggConfigParams));
  }, [aggConfigParams, aggService, indexPattern]);

  const aggs = useMemo(() => aggConfigs?.aggs ?? [], [aggConfigs?.aggs]);

  const dropboxAggs = aggs.filter((agg) => agg.schema === schema.name);

  const displayFields: DropboxDisplay[] = useMemo(
    () =>
      dropboxAggs?.map(
        (agg): DropboxDisplay => ({
          id: agg.id,
          label: agg.makeLabel(),
        })
      ) || [],
    [dropboxAggs]
  );

  // Event handlers for each dropbox action type
  const onAddField = useCallback(() => {
    if (!aggConfigs || !indexPattern) {
      throw new Error('Cannot create new field, missing parameters');
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

    dispatch(editAgg(newAggConfig.serialize()));
  }, [aggConfigs, aggService, aggs, dispatch, indexPattern, schema.name]);

  const onEditField = useCallback(
    (aggId) => {
      const aggConfig = aggConfigs?.aggs.find((agg) => agg.id === aggId);

      if (!aggConfig) {
        throw new Error('Could not find agg in aggConfigs');
      }

      dispatch(editAgg(aggConfig.serialize()));
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
      if (!data) return;

      const { name: fieldName } = data;

      aggConfigs?.createAggConfig({
        type: (schema.defaults as any).aggType,
        schema: schema.name,
        params: {
          field: fieldName,
        },
      });

      if (aggConfigs) {
        dispatch(updateAggConfigParams(aggConfigs.aggs.map((agg) => agg.serialize())));
      }
    },
    [aggConfigs, dispatch, schema.defaults, schema.name]
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

  const isValidDropField = useMemo(() => {
    if (!dragData) return false;

    const indexField = getIndexPatternField(dragData.name, indexPattern?.fields ?? []);

    if (!indexField) return false;

    return isValidDropTarget;
    // TODO: Validate if the field is droppable from schema ref : src/plugins/vis_default_editor/public/components/agg_params.tsx
    // return isValidDropTarget && (isDroppable?.(indexField) ?? true);
  }, [dragData, indexPattern?.fields, isValidDropTarget]);

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
    isValidDropTarget: isValidDropField,
    dropProps,
  };
};

const getIndexPatternField = (indexFieldName: string, availableFields: IndexPatternField[]) =>
  availableFields.find(({ name }) => name === indexFieldName);
