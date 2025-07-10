/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dispatch } from 'redux';
import { setEditorMode } from '../../../slices';
import { useClearEditors } from '../../../../../hooks';
import { RootState } from '../../../store';
import { EditorMode } from '../../../types';

export const clearEditorActionCreator = (clearEditors: ReturnType<typeof useClearEditors>) => (
  dispatch: Dispatch,
  getState: () => RootState
) => {
  const {
    queryEditor: { promptModeIsAvailable },
  } = getState();
  clearEditors();
  if (promptModeIsAvailable) {
    dispatch(setEditorMode(EditorMode.SingleEmpty));
  } else {
    dispatch(setEditorMode(EditorMode.SingleQuery));
  }
};
