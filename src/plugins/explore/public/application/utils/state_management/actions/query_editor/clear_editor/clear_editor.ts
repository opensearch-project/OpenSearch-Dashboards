/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDispatch } from '../../../store';
import { resetEditorMode } from '../../../slices';
import { EditorContextValue } from '../../../../../context';

export const clearEditorActionCreator = (editorContext: EditorContextValue) => (
  dispatch: AppDispatch
) => {
  editorContext.clearEditors();
  dispatch(resetEditorMode());
};
