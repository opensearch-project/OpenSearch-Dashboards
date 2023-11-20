/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TypedUseSelectorHook } from 'react-redux';
import {
  RootState,
  setIndexPattern as updateIndexPattern,
  useTypedDispatch,
  useTypedSelector,
} from '../../../../../data_explorer/public';
import {
  slice as editorSlice,
  EditorState,
  getPreloadedState as getEditorSlicePreloadedState,
} from './editor_slice';
import {
  styleSlice,
  StyleState,
  getPreloadedState as getStyleSlicePreloadedState,
} from './style_slice';
import {
  uiStateSlice,
  UIStateState,
  getPreloadedState as getUiStateSlicePreloadedState,
} from './ui_state_slice';
import {
  slice as visualizationSlice,
  VisualizationState,
  getPreloadedState as getVisualizationSlicePreloadedState,
} from './visualization_slice';

export * from './handlers';

export interface VisBuilderRootState extends RootState {
  vbEditor: EditorState;
  vbStyle: StyleState;
  vbUi: UIStateState;
  vbVisualization: VisualizationState;
}

export const useSelector: TypedUseSelectorHook<VisBuilderRootState> = useTypedSelector;
export {
  editorSlice,
  styleSlice,
  uiStateSlice,
  visualizationSlice,
  getEditorSlicePreloadedState,
  getStyleSlicePreloadedState,
  getUiStateSlicePreloadedState,
  getVisualizationSlicePreloadedState,
};
export { updateIndexPattern, useTypedDispatch };
