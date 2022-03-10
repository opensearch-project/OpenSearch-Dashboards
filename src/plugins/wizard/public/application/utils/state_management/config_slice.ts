/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WizardServices } from '../../../types';
import { CONTAINER_ID, MainItemContribution } from '../../contributions/containers/config_panel';

export interface ActiveItem {
  id: string;
  type: MainItemContribution['type'];
  fieldName?: string;
}

export interface ConfigState {
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
        state.activeItem = null;
        return;
      }

      state.activeItem = payload;
    },
  },
});

export const { reducer } = slice;
export const { updateConfigItemState, setActiveItem } = slice.actions;
