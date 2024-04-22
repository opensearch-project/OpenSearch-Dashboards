/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VisBuilderServices } from '../../../types';
import { DefaultViewState } from '../../../../../data_explorer/public';

/*
 * Initial state: default state when opening visBuilder plugin
 * Clean state: when viz finished loading and ready to be edited
 * Dirty state: when there are changes applied to the viz after it finished loading
 */
export type EditorStatus = 'loading' | 'loaded' | 'clean' | 'dirty';

export interface EditorState {
  errors: {
    // Errors for each section in the editor
    [key: string]: boolean;
  };
  status: EditorStatus;
  savedVisBuilderId: string;
}

const initialState: EditorState = {
  errors: {},
  status: 'loading',
  savedVisBuilderId: '',
};

export const getPreloadedState = async (
  services: VisBuilderServices
): Promise<DefaultViewState<EditorState>> => {
  const preloadedState: DefaultViewState<EditorState> = {
    state: {
      ...initialState,
    },
  };
  return preloadedState;
};

export const slice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setError: (state, action: PayloadAction<{ key: string; error: boolean }>) => {
      const { key, error } = action.payload;
      state.errors[key] = error;
    },
    setStatus: (state, action: PayloadAction<{ status: EditorStatus }>) => {
      state.status = action.payload.status;
    },
    setSavedVisBuilderId(state, action: PayloadAction<string>) {
      return {
        ...state,
        savedVisBuilderId: action.payload,
      };
    },
    setState: (_state, action: PayloadAction<EditorState>) => {
      return action.payload;
    },
  },
});

export const { reducer } = slice;
export const { setError, setStatus, setSavedVisBuilderId, setState } = slice.actions;
