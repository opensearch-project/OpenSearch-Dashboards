/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import produce from 'immer';
import { useCallback, useMemo } from 'react';
import { FieldDragDataType } from '../../../../../utils/drag_drop/types';
import { useTypedDispatch, useTypedSelector } from '../../../../../utils/state_management';
import {
  setActiveItem,
  updateConfigItemState,
} from '../../../../../utils/state_management/config_slice';
import { ITEM_TYPES } from '../types';
import { DroppableBoxProps, DropboxField } from '../droppable_box';
import { DroppableBoxContribution } from '../types';
export interface DropBoxState {
  fields: {
    [fieldId: string]: {
      [itemId: string]: any;
    };
  };
  draft?: {
    [itemId: string]: any;
  };
}

export const INITIAL_STATE = {
  fields: {},
};

export const useDropBox = (dropbox: DroppableBoxContribution): DroppableBoxProps => {
  const { id: droppableBoxId, label, limit } = dropbox;
  const dispatch = useTypedDispatch();
  const { items, availableFields } = useTypedSelector((state) => ({
    items: state.config.items,
    availableFields: state.dataSource.visualizableFields,
  }));
  const dropboxState: DropBoxState = items[droppableBoxId] ?? INITIAL_STATE;
  const fields: DropboxField[] = useMemo(
    () =>
      availableFields
        .filter(({ name }) => dropboxState.fields.hasOwnProperty(name))
        .map(({ name, displayName, type }) => ({ icon: type, id: name, label: displayName })),
    [availableFields, dropboxState.fields]
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

    // setSecondaryMenu(SecondaryMenu);
  }, [dispatch, droppableBoxId]);

  const onEditField = useCallback(() => {}, []);

  const onDeleteField = useCallback(
    (fieldId) => {
      if (fields.find(({ id }) => id === fieldId)) {
        const newState = produce(dropboxState, (draft) => {
          delete draft.fields?.[fieldId];
        });
        dispatch(
          updateConfigItemState({
            id: droppableBoxId,
            itemState: newState,
          })
        );
      }
    },
    [fields, dropboxState, dispatch, droppableBoxId]
  );

  const onDropField = useCallback(
    (data: FieldDragDataType['value']) => {
      if (!data) return;

      const { name: fieldName } = data;

      const newState = produce(dropboxState, (draft) => {
        draft.fields[fieldName] = {};
      });

      dispatch(
        updateConfigItemState({
          id: droppableBoxId,
          itemState: newState,
        })
      );
    },
    [dropboxState, dispatch, droppableBoxId]
  );

  return {
    label,
    limit,
    fields,
    onAddField,
    onEditField,
    onDeleteField,
    onDropField,
  };
};
