/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VisBuilderServices } from '../../../types';
import { DefaultViewState } from '../../../../../data_explorer/public';

export type UIStateState<T = any> = T;

const initialState = {} as UIStateState;

export const getPreloadedState = async (
  services: VisBuilderServices
): Promise<DefaultViewState<UIStateState>> => {
  const preloadedState: DefaultViewState<UIStateState> = {
    state: {
      ...initialState,
    },
  };
  return preloadedState;
};

export const uiStateSlice = createSlice({
  name: 'vbUi',
  initialState,
  reducers: {
    setState<T>(state: T, action: PayloadAction<UIStateState<T>>) {
      return action.payload;
    },
    updateState<T>(state: T, action: PayloadAction<Partial<UIStateState<T>>>) {
      state = {
        ...state,
        ...action.payload,
      };
    },
  },
});

// Exposing the state functions as generics
export const setState = uiStateSlice.actions.setState as <T>(payload: T) => PayloadAction<T>;
export const updateState = uiStateSlice.actions.updateState as <T>(
  payload: Partial<T>
) => PayloadAction<Partial<T>>;

export const { reducer } = uiStateSlice;
