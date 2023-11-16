/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { setEditorState } from '../editor_slice';
import { RootState, Store } from '../../../../../../data_explorer/public';

export const handlerEditorState = (store: Store, state: RootState, previousState: RootState) => {
  const editor = state.vbEditor;
  const prevEditor = previousState.vbEditor;
  const renderState = {
    vbStyle: state.vbStyle,
    vbUi: state.vbUi,
    vbVisualization: state.vbVisualization,
  }
  const prevRenderState = {
    vbStyle: previousState.vbStyle,
    vbUi: previousState.vbUi,
    vbVisualization: previousState.vbVisualization,
  }

  // Need to make sure the editorStates are in the clean states(not the initial states) to indicate the viz finished loading
  // Because when loading a saved viz from saved object, the previousStore will differ from
  // the currentStore even tho there is no changes applied ( aggParams will
  // first be empty, and it then will change to not empty once the viz finished loading)
  if (
    prevEditor.status === 'clean' &&
    editor.status === 'clean' &&
    JSON.stringify(renderState) !== JSON.stringify(prevRenderState)
  ) {
    store.dispatch(setEditorState({ state: 'dirty' }));
  }
};
