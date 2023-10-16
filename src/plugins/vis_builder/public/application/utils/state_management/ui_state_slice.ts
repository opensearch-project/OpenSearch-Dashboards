/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DefaultViewState } from '../../../../../data_explorer/public';
import { SliceProps } from './index';

export type UIStateState<T = any> = T;

const initialState = {} as UIStateState;

export const getPreloadedState = async ({
  services,
  savedVisBuilderState,
}: SliceProps): Promise<DefaultViewState<UIStateState>> => {
  const preloadedState: DefaultViewState<UIStateState> = {
    state: savedVisBuilderState?.ui || initialState,
  };
  return preloadedState;
};

export const uiStateSlice = createSlice({
  name: 'ui',
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
