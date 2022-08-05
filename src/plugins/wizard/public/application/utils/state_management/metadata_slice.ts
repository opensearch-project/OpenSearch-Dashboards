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
  };
}

const initialState: MetadataState = {
  editorState: {
    validity: {},
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
    setState: (_state, action: PayloadAction<MetadataState>) => {
      return action.payload;
    },
  },
});

export const { reducer } = slice;
export const { setValidity, setState } = slice.actions;
