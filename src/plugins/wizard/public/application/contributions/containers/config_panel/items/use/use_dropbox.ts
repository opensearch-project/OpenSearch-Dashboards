/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { FieldDragDataType } from '../../../../../utils/drag_drop/types';
import { useTypedDispatch, useTypedSelector } from '../../../../../utils/state_management';
import { updateConfigItemState } from '../../../../../utils/state_management/config_slice';
import { DroppableBoxProps, DropboxFields } from '../droppable_box';

interface DropBoxState {
  fields: DroppableBoxProps['fields'];
}

export const useDropBox = (
  droppableBoxId: string
): Pick<
  DroppableBoxProps,
  'fields' | 'onAddField' | 'onEditField' | 'onDeleteField' | 'onDropField'
> => {
  const dispatch = useTypedDispatch();
  const itemState: DropBoxState | undefined = useTypedSelector(
    (state) => state.config.items[droppableBoxId]
  );
  const fields: DropboxFields[] = itemState?.fields ?? [];

  const onAddField = useCallback(() => {}, []);
  const onEditField = useCallback(() => {}, []);

  const onDeleteField = useCallback(
    (fieldId) => {
      if (fields.find(({ id }) => id === fieldId)) {
        dispatch(
          updateConfigItemState({
            id: droppableBoxId,
            itemState: {
              fields: fields.filter(({ id }) => id !== fieldId),
            },
          })
        );
      }
    },
    [dispatch, fields, droppableBoxId]
  );

  const onDropField = useCallback(
    (data: FieldDragDataType['value']) => {
      if (!data) return;

      const { displayName, name, type } = data;
      const newField = {
        id: name,
        label: displayName,
        icon: type,
      };

      dispatch(
        updateConfigItemState({
          id: droppableBoxId,
          itemState: {
            fields: [...fields, newField],
          },
        })
      );
    },
    [dispatch, fields, droppableBoxId]
  );

  return {
    fields,
    onAddField,
    onEditField,
    onDeleteField,
    onDropField,
  };
};
