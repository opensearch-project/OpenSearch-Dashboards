/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { setStatus } from '../editor_slice';
import { Store } from '../../../../../../data_explorer/public';
import { PrefixedVisBuilderRootState, getVisBuilderRootState } from '..';
import { VisBuilderViewServices } from '../../../../types';

export const handlerEditorState = (
  store: Store,
  state: PrefixedVisBuilderRootState,
  previousState: PrefixedVisBuilderRootState,
  services: VisBuilderViewServices
) => {
  const rootState = getVisBuilderRootState(state);
  const previousRootState = getVisBuilderRootState(previousState);
  const editor = rootState.editor;
  const prevEditor = previousRootState.editor;
  const renderState = {
    style: rootState.style,
    ui: rootState.ui,
    visualization: rootState.visualization,
  };
  const prevRenderState = {
    style: previousRootState.style,
    ui: previousRootState.ui,
    visualization: previousRootState.visualization,
  };

  // Need to make sure the editorStates are in the clean states(not the initial states) to indicate the viz finished loading
  // Because when loading a saved viz from saved object, the previousStore will differ from
  // the currentStore even tho there is no changes applied ( aggParams will
  // first be empty, and it then will change to not empty once the viz finished loading)
  if (
    prevEditor.status === 'clean' &&
    editor.status === 'clean' &&
    JSON.stringify(renderState) !== JSON.stringify(prevRenderState)
  ) {
    store.dispatch(setStatus({ status: 'dirty' }));
  }
};
