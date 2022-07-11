/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { htmlIdGenerator } from '@elastic/eui';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WizardServices } from '../../../types';
import {
  ConfigItemState,
  DATA_TAB_ID,
  InstanceState,
  MainItemContribution,
} from '../../contributions';

// TODO: Move this into contributions and register the slice from there for better code splitting
// TODO: Reorganize slice for better readability
export interface ActiveItem {
  id: string;
  type: MainItemContribution['type'];
  instanceId: string;
}

export interface ConfigState {
  items: {
    [id: string]: ConfigItemState;
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
    preloadedState.items = defaultVisualizationType.contributions.items?.[DATA_TAB_ID].filter(
      ({ id }) => !!id
    ).reduce((acc, { id, type }) => ({ ...acc, [id]: null }), {});
  }

  return preloadedState;
};

interface UpdateConfigPayload {
  id: string;
  itemState: any;
}

interface AddInstancePayload extends ActiveItem {
  properties?: any;
  setActive: boolean;
}

interface UpdateInstancePayload {
  id: string;
  instanceId: string;
  instanceState: any;
}

interface ReorderInstancePayload {
  id: string;
  reorderedInstanceIds: string[];
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
    addInstance: {
      reducer: (state, action: PayloadAction<AddInstancePayload>) => {
        const { id, instanceId, properties, setActive } = action.payload;

        if (!state.items.hasOwnProperty(id)) return;

        if (!state.items[id]) {
          state.items[id] = {
            instances: [],
          };
        }

        (state.items[id] as InstanceState<unknown>).instances.push({
          id: instanceId,
          properties: properties ?? {},
        });

        if (setActive) {
          state.activeItem = action.payload;
        }
      },
      prepare: (
        id: string,
        type: MainItemContribution['type'],
        setActive: boolean = true,
        properties?: any
      ) => {
        const instanceId = htmlIdGenerator()();

        return {
          payload: {
            id,
            type,
            instanceId,
            properties,
            setActive,
          },
        };
      },
    },
    updateInstance: (state, action: PayloadAction<UpdateInstancePayload>) => {
      const { id: parentItemId, instanceId, instanceState } = action.payload;
      if (!state.items.hasOwnProperty(parentItemId)) return;

      // Typescript complains if we use state.items[parentItemId] directly since it cannot resolve the type correctly
      const configItem = state.items[parentItemId];
      if (!configItem || typeof configItem === 'string') return;

      const instanceIndex = configItem.instances.findIndex(({ id }) => id === instanceId);

      if (instanceIndex < 0) return;

      if (instanceState === null) {
        configItem.instances.splice(instanceIndex, 1);
        return;
      }

      configItem.instances[instanceIndex].properties = instanceState;
    },
    reorderInstances: (state, action: PayloadAction<ReorderInstancePayload>) => {
      const { id: parentItemId, reorderedInstanceIds } = action.payload;

      if (!state.items.hasOwnProperty(parentItemId)) return;

      // Typescript complains if we use state.items[parentItemId] directly since it cannot resolve the type correctly
      const configItem = state.items[parentItemId];
      if (!configItem || typeof configItem === 'string') return;

      const orderDict: { [id: string]: number } = {};
      reorderedInstanceIds.forEach((instanceId, index) => {
        orderDict[instanceId] = index;
      });

      configItem.instances.sort((a, b) => orderDict[a.id] - orderDict[b.id]);
    },
  },
});

export const { reducer } = slice;
export const {
  updateConfigItemState,
  setActiveItem,
  addInstance,
  updateInstance,
  reorderInstances,
} = slice.actions;
