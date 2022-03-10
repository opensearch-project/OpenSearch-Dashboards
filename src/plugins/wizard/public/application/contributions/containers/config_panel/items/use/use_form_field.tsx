/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import produce from 'immer';
import { useCallback } from 'react';
import { Dispatch } from '@reduxjs/toolkit';
import {
  ConfigState,
  setActiveItem,
  updateConfigItemState,
} from '../../../../../utils/state_management/config_slice';
import { useTypedSelector, useTypedDispatch } from '../../../../../utils/state_management';
import { INITIAL_STATE as INITIAL_DROPBOX_STATE } from './use_dropbox';
import { FieldContributions, DropboxState, ITEM_TYPES } from '../types';

export const INDEX_FIELD_KEY = 'index_field';

interface FieldProps {
  onChange: Function;
  value: string;
}

// TODO: Currently this only supports formfields created inn the main npanel or as a child of dropbox fields.
// We should be able to use these with other fields that support child components too
export const useFormField = (id: string, onChange: FieldContributions['onChange']): FieldProps => {
  const activeItem = useTypedSelector((state) => state.config.activeItem);
  const configState = useTypedSelector((state) => state.config);
  const { items } = configState;
  const dispatch = useTypedDispatch();

  const handleChange = useCallback(
    (newValue: string) => {
      onChange?.(newValue);

      // is a MainPanel field value
      if (!activeItem) return dispatchUpdateConfig(id, newValue, dispatch);

      const dropboxState: DropboxState =
        activeItem?.id && items[activeItem.id] ? items[activeItem.id] : INITIAL_DROPBOX_STATE;

      if (id === INDEX_FIELD_KEY) {
        // Transfer state between indexFields
        if (activeItem.fieldName) {
          const newDropboxState = produce(dropboxState, (draftState) => {
            const indexFieldName = activeItem.fieldName!;
            // For new fields
            if (!draftState.fields[indexFieldName]) {
              draftState.fields[indexFieldName] = {};
            }
            draftState.fields[newValue] = { ...draftState.fields[indexFieldName] };
            delete draftState.fields[indexFieldName];
          });

          dispatchUpdateConfig(activeItem.id, newDropboxState, dispatch);
        }

        dispatch(
          setActiveItem({
            id: activeItem.id,
            type: ITEM_TYPES.DROPBOX,
            fieldName: newValue,
          })
        );
        return;
      }

      const newDropboxState = produce(dropboxState, (draftState) => {
        const indexFieldName = activeItem.fieldName ?? '';
        if (!draftState.fields[indexFieldName]) {
          draftState.fields[indexFieldName] = {};
        }
        draftState.fields[indexFieldName][id] = newValue;
      });

      dispatchUpdateConfig(activeItem.id, newDropboxState, dispatch);
    },
    [activeItem, dispatch, id, items, onChange]
  );

  return {
    value: mapStateToValue(id, configState),
    onChange: handleChange,
  };
};

function mapStateToValue(id: string, { items, activeItem }: ConfigState): string {
  // main panel item
  if (!activeItem) return items[id];

  // Dropbox
  if (activeItem.type === ITEM_TYPES.DROPBOX) {
    const dropboxState: DropboxState = items[activeItem.id] ?? INITIAL_DROPBOX_STATE;
    if (!activeItem.fieldName) return '';

    if (id === INDEX_FIELD_KEY) {
      return activeItem.fieldName;
    }

    return dropboxState.fields[activeItem.fieldName]?.[id] ?? '';
  }

  throw new Error(`Secondary Item type ${activeItem.type} not yet supported`);
}

function dispatchUpdateConfig(id: string, itemState: DropboxState | string, dispatch: Dispatch) {
  dispatch(
    updateConfigItemState({
      id,
      itemState,
    })
  );
}
