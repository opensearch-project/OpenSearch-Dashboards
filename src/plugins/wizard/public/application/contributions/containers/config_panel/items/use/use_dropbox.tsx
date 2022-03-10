/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import produce from 'immer';
import { useCallback, useMemo } from 'react';
import { IndexPatternField } from 'src/plugins/data/common';
import { FieldDragDataType } from '../../../../../utils/drag_drop/types';
import { useTypedDispatch, useTypedSelector } from '../../../../../utils/state_management';
import {
  setActiveItem,
  updateConfigItemState,
} from '../../../../../utils/state_management/config_slice';
import { DropboxContribution, DropboxState, ITEM_TYPES, DropboxField } from '../types';
import { DropboxProps } from '../dropbox';
import { useDrop } from '../../../../../utils/drag_drop';

export const INITIAL_STATE: DropboxState = {
  fields: {},
};

export const useDropbox = (dropbox: DropboxContribution): DropboxProps => {
  const { id: droppableBoxId, label, limit, display, onDrop, isDroppable } = dropbox;
  const dispatch = useTypedDispatch();
  const { items, availableFields } = useTypedSelector((state) => ({
    items: state.config.items,
    availableFields: state.dataSource.visualizableFields,
  }));
  const dropboxState: DropboxState = items[droppableBoxId] ?? INITIAL_STATE;
  const displayFields: DropboxField[] = useMemo(
    () =>
      availableFields
        .filter(({ name }) => dropboxState.fields.hasOwnProperty(name))
        .map((indexField) =>
          display ? display(indexField, dropboxState) : getDefaultDisplay(indexField)
        ),
    [availableFields, display, dropboxState]
  );

  // Event handlers for each dropbox action type
  const onAddField = useCallback(() => {
    dispatch(
      setActiveItem({
        id: droppableBoxId,
        type: ITEM_TYPES.DROPBOX,
        fieldName: undefined,
      })
    );
  }, [dispatch, droppableBoxId]);

  const onEditField = useCallback(
    (fieldName) => {
      dispatch(
        setActiveItem({
          id: droppableBoxId,
          type: ITEM_TYPES.DROPBOX,
          fieldName,
        })
      );
    },
    [dispatch, droppableBoxId]
  );

  const onDeleteField = useCallback(
    (fieldName) => {
      if (displayFields.find(({ id }) => id === fieldName)) {
        const newState = produce(dropboxState, (draft) => {
          delete draft.fields?.[fieldName];
        });
        dispatch(
          updateConfigItemState({
            id: droppableBoxId,
            itemState: newState,
          })
        );
      }
    },
    [displayFields, dropboxState, dispatch, droppableBoxId]
  );

  const onDropField = useCallback(
    (data: FieldDragDataType['value']) => {
      if (!data) return;

      const { name: fieldName } = data;
      const indexField = getIndexPatternField(fieldName, availableFields);

      if (!indexField) return;

      if (isDroppable && !isDroppable(indexField)) return;

      const newState = produce(dropboxState, (draft) => {
        draft.fields[fieldName] = onDrop?.(indexField) ?? {};
      });

      dispatch(
        updateConfigItemState({
          id: droppableBoxId,
          itemState: newState,
        })
      );
    },
    [availableFields, isDroppable, dropboxState, dispatch, droppableBoxId, onDrop]
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
    label,
    limit,
    fields: displayFields,
    onAddField,
    onEditField,
    onDeleteField,
    ...dropState,
    dragData,
    isValidDropTarget: isValidDropField,
    dropProps,
  };
};

const getDefaultDisplay = (indexField: IndexPatternField): DropboxField => ({
  icon: indexField.type,
  id: indexField.name,
  label: indexField.displayName,
});

const getIndexPatternField = (indexFieldName: string, availableFields: IndexPatternField[]) =>
  availableFields.find(({ name }) => name === indexFieldName);
