/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDispatch, RootState } from '../../../store';
import { setEditorMode } from '../../../slices';
import { EditorMode } from '../../../types';
import { runQueryActionCreator } from '../run_query';
import { ExploreServices } from '../../../../../../types';
import { EditorContextValue } from '../../../../../context';

/**
 * This is called when you need to load a query
 */
export const loadQueryActionCreator = (
  services: ExploreServices,
  editorContext: EditorContextValue,
  query: string
) => (dispatch: AppDispatch, getState: () => RootState) => {
  const {
    queryEditor: { editorMode },
  } = getState();

  // When you load a query, it should always go to single query mode
  editorContext.clearEditorsAndSetText(query);
  if (editorMode !== EditorMode.SingleQuery) {
    dispatch(setEditorMode(EditorMode.SingleQuery));
  }

  dispatch(runQueryActionCreator(services, query));
};
