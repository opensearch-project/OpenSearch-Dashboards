/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VisBuilderServices } from '../../../types';

/*
 * Initial state: default state when opening visBuilder plugin
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
  originatingApp?: string;
}

const initialState: MetadataState = {
  editor: {
    validity: {},
    state: 'loading',
  },
  originatingApp: undefined,
};

export const getPreloadedState = async ({
  types,
  data,
  embeddable,
  scopedHistory,
}: VisBuilderServices): Promise<MetadataState> => {
  const { originatingApp } =
    embeddable
      .getStateTransfer(scopedHistory)
      .getIncomingEditorState({ keysToRemoveAfterFetch: ['id', 'input'] }) || {};
  const preloadedState = { ...initialState, originatingApp };

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
    setOriginatingApp: (state, action: PayloadAction<{ state?: string }>) => {
      state.originatingApp = action.payload.state;
    },
    setState: (_state, action: PayloadAction<MetadataState>) => {
      return action.payload;
    },
  },
});

export const { reducer } = slice;
export const { setValidity, setEditorState, setOriginatingApp, setState } = slice.actions;
