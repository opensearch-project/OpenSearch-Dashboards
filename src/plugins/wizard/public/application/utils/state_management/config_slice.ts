/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WizardServices } from '../../../types';
import {
  CONTAINER_ID,
  DropboxField,
  ITEM_TYPES,
  MainItemContribution,
} from '../../contributions/containers/config_panel';
import { DropBoxState } from '../../contributions/containers/config_panel/items/use/use_dropbox';

export interface ActiveItem {
  id: string;
  type: MainItemContribution['type'];
  fieldName?: string;
}

interface ConfigState {
  items: {
    [id: string]: any;
  };
  activeItem: ActiveItem | null;
}

const initialState: ConfigState = {
  items: {},
  activeItem: null,
};

export const getPreloadedState = async ({ types }: WizardServices): Promise<ConfigState> => {
  const preloadedState = { ...initialState };

  const defaultVisualizationType = types.all()[0];

  if (defaultVisualizationType) {
    preloadedState.items = defaultVisualizationType.contributions.items?.[CONTAINER_ID].filter(
      ({ id }) => !!id
    ).reduce((acc, { id, type }) => ({ ...acc, [id]: null }), {});
  }

  return preloadedState;
};

interface UpdateConfigPayload {
  id: string;
  itemState: any;
}

export const slice = createSlice({
  name: 'configuration',
  initialState,
  reducers: {
    updateConfigItemState: (state, action: PayloadAction<UpdateConfigPayload>) => {
      const { id, itemState } = action.payload;

      if (state.items.hasOwnProperty(id)) {
        state.items[id] = itemState;
      }
    },
    setActiveItem: (state, { payload }: PayloadAction<ActiveItem | null>) => {
      // On closing secondary menu
      if (!payload) {
        // TODO: Make this more generic
        // Handle saving new field data from dropbox
        if (state.activeItem && state.activeItem.type === ITEM_TYPES.DROPBOX) {
          const dropboxId = state.activeItem.id;
          const dropboxState: DropBoxState = state.items[dropboxId] ?? {};
          const fieldName = dropboxState.draft?.field;

          if (fieldName) {
            // Get new field
            const newField: DropBoxState['fields'][0] = {
              ...dropboxState.draft,
            };
            state.items[dropboxId].fields[fieldName] = newField;
          }

          delete dropboxState.draft;
        }

        state.activeItem = null;
        return;
      }

      state.activeItem = payload;
    },
  },
});

export const { reducer } = slice;
export const { updateConfigItemState, setActiveItem } = slice.actions;
