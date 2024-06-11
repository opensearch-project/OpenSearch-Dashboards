/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VisBuilderServices } from '../../../types';

export type UIStateState<T = any> = T;

const initialState = {} as UIStateState;

export const getPreloadedState = async ({
  types,
  data,
}: VisBuilderServices): Promise<UIStateState> => {
  return initialState;
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
