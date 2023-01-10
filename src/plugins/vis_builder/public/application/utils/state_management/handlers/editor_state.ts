/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { setEditorState } from '../metadata_slice';
import { RootState, Store } from '../store';

export const handlerEditorState = (store: Store, state: RootState, previousState: RootState) => {
  const { metadata, ...renderState } = state;
  const { metadata: prevMetadata, ...prevRenderState } = previousState;

  // Need to make sure the editorStates are in the clean states(not the initial states) to indicate the viz finished loading
  // Because when loading a saved viz from saved object, the previousStore will differ from
  // the currentStore even tho there is no changes applied ( aggParams will
  // first be empty, and it then will change to not empty once the viz finished loading)
  if (
    prevMetadata.editor.state === 'clean' &&
    metadata.editor.state === 'clean' &&
    JSON.stringify(renderState) !== JSON.stringify(prevRenderState)
  ) {
    store.dispatch(setEditorState({ state: 'dirty' }));
  }
};
