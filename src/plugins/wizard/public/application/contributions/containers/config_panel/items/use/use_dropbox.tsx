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

export const INITIAL_STATE: DropboxState = {
  fields: {},
};

export const useDropbox = (dropbox: DropboxContribution): DropboxProps => {
  const { id: droppableBoxId, label, limit, display, onDrop } = dropbox;
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
      const indexField = availableFields.find(({ name }) => name === fieldName);

      if (!indexField) return;

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
    [dropboxState, dispatch, droppableBoxId, onDrop, availableFields]
  );

  return {
    label,
    limit,
    fields: displayFields,
    onAddField,
    onEditField,
    onDeleteField,
    onDropField,
  };
};

const getDefaultDisplay = (indexField: IndexPatternField): DropboxField => ({
  icon: indexField.type,
  id: indexField.name,
  label: indexField.displayName,
});
