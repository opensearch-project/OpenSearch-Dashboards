/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDispatch, RootState } from '../../../store';
import { clearBottomEditor, clearTopEditor, resetEditorMode } from '../../../slices';

export const clearEditorActionCreator = () => (
  dispatch: AppDispatch,
  getState: () => RootState
) => {
  const {
    queryEditor: { promptModeIsAvailable },
  } = getState();

  dispatch(clearTopEditor());
  if (promptModeIsAvailable) {
    dispatch(clearBottomEditor());
  }
  dispatch(resetEditorMode());
};
