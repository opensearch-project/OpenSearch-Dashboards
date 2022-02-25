/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WizardServices } from '../../../types';
import { CONTAINER_ID } from '../../contributions/containers/config_panel';

interface ConfigItems {
  [id: string]: any;
}
interface ConfigState {
  items: ConfigItems;
}

const initialState: ConfigState = {
  items: {},
};

export const getPreloadedState = async ({ types }: WizardServices): Promise<ConfigState> => {
  const preloadedState = { ...initialState };

  const defaultVisualizationType = types.all()[0];

  if (defaultVisualizationType) {
    preloadedState.items = defaultVisualizationType.contributions.items?.[CONTAINER_ID].filter(
      ({ id }) => !!id
    ).reduce((acc, { id }) => ({ ...acc, [id]: [] }), {});
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

      if (state.items[id]) {
        state.items[id] = itemState;
      }
    },
  },
});

export const { reducer } = slice;
export const { updateConfigItemState } = slice.actions;
