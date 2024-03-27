/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { TypedUseSelectorHook } from 'react-redux';
import { VisBuilderServices } from '../../../types';
import {
  AppDispatch,
  RootState,
  MetadataState,
  setIndexPattern as updateIndexPattern,
  useTypedDispatch,
  useTypedSelector as useSelector,
} from '../../../../../data_explorer/public';
import {
  EditorStatus,
  setState as setEditorState,
  slice as editorSlice,
  EditorState,
  getPreloadedState as getEditorSlicePreloadedState,
} from './editor_slice';
import {
  setState as setStyleState,
  styleSlice,
  StyleState,
  getPreloadedState as getStyleSlicePreloadedState,
} from './style_slice';
import {
  setState as setUIStateState,
  uiStateSlice,
  UIStateState,
  getPreloadedState as getUiStateSlicePreloadedState,
} from './ui_state_slice';
import {
  setState as setVisualizationState,
  slice as visualizationSlice,
  VisualizationState,
  getPreloadedState as getVisualizationSlicePreloadedState,
} from './visualization_slice';

export * from './handlers';
export * from './shared_actions';
export * from './prefix_helper';

export type VisBuilderRootStateKeys = 'editor' | 'ui' | 'visualization' | 'style';

export interface VisBuilderRootState extends RootState {
  editor: EditorState;
  style: StyleState;
  ui: UIStateState;
  visualization: VisualizationState;
}

// TODO: resolve prettier error
// export type PrefixedVisBuilderRootState = {
//   [K in VisBuilderRootStateKeys as `${typeof PLUGIN_ID}-${K}`]: VisBuilderRootState[K];
// } & {
//   metadata: VisBuilderRootState['metadata'];
// };

export interface PrefixedVisBuilderRootState {
  'vis-builder-editor': EditorState;
  'vis-builder-ui': UIStateState;
  'vis-builder-visualization': VisualizationState;
  'vis-builder-style': StyleState;
  metadata: MetadataState;
}

export const useTypedSelector: TypedUseSelectorHook<PrefixedVisBuilderRootState> = useSelector;
export {
  EditorStatus,
  editorSlice,
  styleSlice,
  uiStateSlice,
  visualizationSlice,
  getEditorSlicePreloadedState,
  getStyleSlicePreloadedState,
  getUiStateSlicePreloadedState,
  getVisualizationSlicePreloadedState,
  EditorState,
  StyleState,
  UIStateState,
  VisualizationState,
  setEditorState,
  setStyleState,
  setVisualizationState,
  setUIStateState,
  useTypedDispatch,
  updateIndexPattern,
  AppDispatch,
  MetadataState,
};

type RenderStateKeys = 'style' | 'ui' | 'visualization' | 'metadata';

export type RenderState = Pick<VisBuilderRootState, RenderStateKeys>;

export interface SliceProps {
  services: VisBuilderServices;
  savedVisBuilderState?: RenderState;
}
