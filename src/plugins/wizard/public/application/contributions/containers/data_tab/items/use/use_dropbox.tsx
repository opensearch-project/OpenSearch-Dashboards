/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo } from 'react';
import { IndexPatternField } from 'src/plugins/data/common';
import { FieldDragDataType } from '../../../../../utils/drag_drop/types';
import { useTypedDispatch, useTypedSelector } from '../../../../../utils/state_management';
import {
  addInstance,
  reorderInstances,
  setActiveItem,
  updateInstance,
} from '../../../../../utils/state_management/config_slice';
import {
  DropboxContribution,
  DropboxState,
  ITEM_TYPES,
  DropboxDisplay,
  DropboxFieldProps,
} from '../types';
import { DropboxProps } from '../dropbox';
import { useDrop } from '../../../../../utils/drag_drop';

type DropboxInstanceState = DropboxState['instances'][number];

export const INITIAL_STATE: DropboxState = {
  instances: [],
};

export const useDropbox = (dropboxContribution: DropboxContribution): DropboxProps => {
  const { id: dropboxId, label, limit, display, onDrop, isDroppable } = dropboxContribution;
  const dispatch = useTypedDispatch();
  const { items, availableFields } = useTypedSelector((state) => ({
    items: state.config.items,
    availableFields: state.dataSource.visualizableFields,
  }));
  const configItemState = items[dropboxId];
  const dropboxState =
    !configItemState || typeof configItemState === 'string' ? INITIAL_STATE : configItemState;
  const filterPatrialInstances = useCallback(
    ({ properties }: DropboxInstanceState) => !!properties.fieldName,
    []
  );
  const mapInstanceToFieldDisplay = useCallback(
    ({ id, properties }: DropboxInstanceState): DropboxDisplay => {
      const indexPatternField = availableFields.find(({ name }) => name === properties.fieldName);

      if (!indexPatternField) throw new Error('Field to display missing in available fields');

      return getDisplayField(id, indexPatternField, properties, display);
    },
    [availableFields, display]
  );

  const displayFields: DropboxDisplay[] = useMemo(
    () => dropboxState.instances.filter(filterPatrialInstances).map(mapInstanceToFieldDisplay),
    [dropboxState.instances, filterPatrialInstances, mapInstanceToFieldDisplay]
  );

  // Event handlers for each dropbox action type
  const onAddField = useCallback(() => {
    dispatch(addInstance(dropboxId, ITEM_TYPES.DROPBOX));
  }, [dispatch, dropboxId]);

  const onEditField = useCallback(
    (instanceId) => {
      dispatch(
        setActiveItem({
          id: dropboxId,
          type: ITEM_TYPES.DROPBOX,
          instanceId,
        })
      );
    },
    [dispatch, dropboxId]
  );

  const onDeleteField = useCallback(
    (instanceId) => {
      dispatch(
        updateInstance({
          id: dropboxId,
          instanceId,
          instanceState: null,
        })
      );
    },
    [dispatch, dropboxId]
  );

  const onDropField = useCallback(
    (data: FieldDragDataType['value']) => {
      if (!data) return;

      const { name: fieldName } = data;
      const indexField = getIndexPatternField(fieldName, availableFields);

      if (!indexField) return;

      if (isDroppable && !isDroppable(indexField)) return;

      const newState: DropboxFieldProps = {
        ...onDrop?.(indexField),
        fieldName,
      };

      dispatch(addInstance(dropboxId, ITEM_TYPES.DROPBOX, false, newState));
    },
    [availableFields, isDroppable, onDrop, dispatch, dropboxId]
  );

  const onReorderField = useCallback(
    (reorderedInstanceIds: string[]) => {
      dispatch(
        reorderInstances({
          id: dropboxId,
          reorderedInstanceIds,
        })
      );
    },
    [dispatch, dropboxId]
  );

  const [dropProps, { isValidDropTarget, dragData, ...dropState }] = useDrop(
    'field-data',
    onDropField
  );

  const isValidDropField = useMemo(() => {
    if (!dragData) return false;

    const indexField = getIndexPatternField(dragData.name, availableFields);

    if (!indexField) return false;

    return isValidDropTarget && (isDroppable?.(indexField) ?? true);
  }, [availableFields, dragData, isDroppable, isValidDropTarget]);

  return {
    id: dropboxId,
    label,
    limit,
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
