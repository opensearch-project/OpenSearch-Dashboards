/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WizardServices } from '../../../types';

export interface MetadataState {
  editorState: {
    valid: {
      // Validity for each section in the editor
      [key: string]: boolean;
    };
  };
}

const initialState: MetadataState = {
  editorState: {
    valid: {},
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
    setValid: (state, action: PayloadAction<{ key: string; valid: boolean }>) => {
      const { key, valid } = action.payload;
      state.editorState.valid[key] = valid;
    },
    setState: (_state, action: PayloadAction<MetadataState>) => {
      return action.payload;
    },
  },
});

export const { reducer } = slice;
export const { setValid, setState } = slice.actions;
