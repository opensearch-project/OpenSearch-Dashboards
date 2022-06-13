/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo } from 'react';
import { cloneDeep } from 'lodash';
import { CreateAggConfigParams, IndexPatternField } from 'src/plugins/data/common';
import { Schema } from '../../../../../../../../vis_default_editor/public';
import { FieldDragDataType } from '../../../../../utils/drag_drop/types';
import { useTypedDispatch, useTypedSelector } from '../../../../../utils/state_management';
import {
  DropboxContribution,
  DropboxState,
  ITEM_TYPES,
  DropboxDisplay,
  DropboxFieldProps,
} from '../types';
import { DropboxProps } from '../dropbox';
import { useDrop } from '../../../../../utils/drag_drop';
import {
  createAggConfigParams,
  reorderAggConfigParams,
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

  const aggs = aggConfigs?.aggs ?? [];

  const dropboxAggs = aggs.filter((agg) => agg.schema === schema.name);

  const displayFields: DropboxDisplay[] = useMemo(
    () =>
      dropboxAggs?.map(
        (agg): DropboxDisplay => ({
          id: agg.id,
          icon: 'number', // TODO: Check if we still need an icon here
          label: agg.makeLabel(),
        })
      ) || [],
    [dropboxAggs]
  );

  // Event handlers for each dropbox action type
  const onAddField = useCallback(() => {
    const agg = aggConfigs?.createAggConfig(
      {
        type: (schema.defaults as any).aggType,
        schema: schema.name,
      },
      {
        addToAggConfigs: false,
      }
    );

    if (agg) {
      dispatch(createAggConfigParams(agg.serialize()));
    }
  }, [aggConfigs, dispatch, schema.defaults, schema.name]);

  const onEditField = useCallback((instanceId) => {}, []);

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
        reorderAggConfigParams({
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

  // TODO: Will cleanup once add and edit field support is reintroduced
  // const configItemState = items[dropboxId];
  // const dropboxState =
  //   !configItemState || typeof configItemState === 'string' ? INITIAL_STATE : configItemState;
  // const filterPatrialInstances = useCallback(
  //   ({ properties }: DropboxInstanceState) => !!properties.fieldName,
  //   []
  // );
  // const mapInstanceToFieldDisplay = useCallback(
  //   ({ id, properties }: DropboxInstanceState): DropboxDisplay => {
  //     const indexPatternField = availableFields.find(({ name }) => name === properties.fieldName);

  //     if (!indexPatternField) throw new Error('Field to display missing in available fields');

  //     return getDisplayField(id, indexPatternField, properties, display);
  //   },
  //   [availableFields, display]
  // );

  // const displayFields: DropboxDisplay[] = useMemo(
  //   () => dropboxState.instances.filter(filterPatrialInstances).map(mapInstanceToFieldDisplay),
  //   [dropboxState.instances, filterPatrialInstances, mapInstanceToFieldDisplay]
  // );

  // Event handlers for each dropbox action type
  // const onAddField = useCallback(() => {
  //   dispatch(addInstance(dropboxId, ITEM_TYPES.DROPBOX));
  // }, [dispatch, dropboxId]);

  // const onEditField = useCallback(
  //   (instanceId) => {
  //     dispatch(
  //       setActiveItem({
  //         id: dropboxId,
  //         type: ITEM_TYPES.DROPBOX,
  //         instanceId,
  //       })
  //     );
  //   },
  //   [dispatch, dropboxId]
  // );

  // const onDeleteField = useCallback(
  //   (instanceId) => {
  //     dispatch(
  //       updateInstance({
  //         id: dropboxId,
  //         instanceId,
  //         instanceState: null,
  //       })
  //     );
  //   },
  //   [dispatch, dropboxId]
  // );

  // const onDropField = useCallback(
  //   (data: FieldDragDataType['value']) => {
  //     if (!data) return;

  //     const { name: fieldName } = data;
  //     const indexField = getIndexPatternField(fieldName, availableFields);

  //     if (!indexField) return;

  //     if (isDroppable && !isDroppable(indexField)) return;

  //     const newState: DropboxFieldProps = {
  //       ...onDrop?.(indexField),
  //       fieldName,
  //     };

  //     dispatch(addInstance(dropboxId, ITEM_TYPES.DROPBOX, false, newState));
  //   },
  //   [availableFields, isDroppable, onDrop, dispatch, dropboxId]
  // );

  // const onReorderField = useCallback(
  //   (reorderedInstanceIds: string[]) => {
  //     dispatch(
  //       reorderInstances({
  //         id: dropboxId,
  //         reorderedInstanceIds,
  //       })
  //     );
  //   },
  //   [dispatch, dropboxId]
  // );

  // const [dropProps, { isValidDropTarget, dragData, ...dropState }] = useDrop(
  //   'field-data',
  //   onDropField
  // );

  // const isValidDropField = useMemo(() => {
  //   if (!dragData) return false;

  //   const indexField = getIndexPatternField(dragData.name, availableFields);

  //   if (!indexField) return false;

  //   return isValidDropTarget && (isDroppable?.(indexField) ?? true);
  // }, [availableFields, dragData, isDroppable, isValidDropTarget]);

  // return {
  //   id: dropboxId,
  //   label,
  //   limit,
  //   fields: displayFields,
  //   onAddField,
  //   onEditField,
  //   onDeleteField,
  //   onReorderField,
  //   ...dropState,
  //   dragData,
  //   isValidDropTarget: isValidDropField,
  //   dropProps,
  // };
};

const getDisplayField = (
  instanceId: string,
  indexField: IndexPatternField,
  properties: DropboxFieldProps,
  display: DropboxContribution['display']
): DropboxDisplay => {
  let displayField: DropboxDisplay = {
    id: instanceId,
    icon: indexField.type,
    label: indexField.displayName,
  };
  if (display) {
    const { icon, label } = display(indexField, properties);

    displayField = {
      ...displayField,
      icon,
      label,
    };
  }

  return displayField;
};

const getIndexPatternField = (indexFieldName: string, availableFields: IndexPatternField[]) =>
  availableFields.find(({ name }) => name === indexFieldName);
