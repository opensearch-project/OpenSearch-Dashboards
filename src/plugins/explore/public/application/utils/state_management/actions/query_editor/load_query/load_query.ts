/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDispatch, RootState } from '../../../store';
import { setEditorMode } from '../../../slices';
import { EditorMode } from '../../../types';
import { runQueryActionCreator } from '../run_query';
import { ExploreServices } from '../../../../../../types';

/**
 * This is called when you need to load a query
 */
export const loadQueryActionCreator = (services: ExploreServices, query: string) => (
  dispatch: AppDispatch,
  getState: () => RootState
) => {
  const {
    queryEditor: { editorMode, topEditorRef, bottomEditorRef },
  } = getState();

  // When you load a query, it should always go to single query mode
  bottomEditorRef.current?.setValue('');
  topEditorRef.current?.setValue(query);
  if (editorMode !== EditorMode.SingleQuery) {
    dispatch(setEditorMode(EditorMode.SingleQuery));
  }

  dispatch(runQueryActionCreator(services));
};
