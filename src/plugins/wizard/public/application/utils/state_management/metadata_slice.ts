/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WizardServices } from '../../../types';

export interface MetadataState {
  editorState: {
    validity: {
      // Validity for each section in the editor
      [key: string]: boolean;
    };
    hasChange: boolean;
    finishLoading: boolean;
  };
}

const initialState: MetadataState = {
  editorState: {
    validity: {},
    hasChange: false,
    finishLoading: false,
  },
};

export const getPreloadedState = async ({
  types,
  data,
}: WizardServices): Promise<MetadataState> => {
  const preloadedState = { ...initialState };

  return preloadedState;
};

export const slice = createSlice({
  name: 'metadata',
  initialState,
  reducers: {
    setValidity: (state, action: PayloadAction<{ key: string; valid: boolean }>) => {
      const { key, valid } = action.payload;
      state.editorState.validity[key] = valid;
    },
    setHasChange: (state, action: PayloadAction<{ hasChange: boolean }>) => {
      state.editorState.hasChange = action.payload.hasChange;
    },
    setFinishLoading: (state, action: PayloadAction<{ finishLoading: boolean }>) => {
      state.editorState.finishLoading = action.payload.finishLoading;
    },
    setState: (_state, action: PayloadAction<MetadataState>) => {
      return action.payload;
    },
  },
});

export const { reducer } = slice;
export const { setValidity, setHasChange, setFinishLoading, setState } = slice.actions;
