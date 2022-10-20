/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WizardServices } from '../../../types';

/*
 * Initial state: default state when opening wizard plugin
 * Clean state: when viz finished loading and ready to be edited
 * Dirty state: when there are changes applied to the viz after it finished loading
 */
type EditorState = 'loading' | 'clean' | 'dirty';

export interface MetadataState {
  editor: {
    validity: {
      // Validity for each section in the editor
      [key: string]: boolean;
    };
    state: EditorState;
  };
}

const initialState: MetadataState = {
  editor: {
    validity: {},
    state: 'loading',
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
      state.editor.validity[key] = valid;
    },
    setEditorState: (state, action: PayloadAction<{ state: EditorState }>) => {
      state.editor.state = action.payload.state;
    },
    setState: (_state, action: PayloadAction<MetadataState>) => {
      return action.payload;
    },
  },
});

export const { reducer } = slice;
export const { setValidity, setEditorState, setState } = slice.actions;
