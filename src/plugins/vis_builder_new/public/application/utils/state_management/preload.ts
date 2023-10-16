/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisBuilderServices } from '../../..';
import { StyleState, getPreloadedState as getPreloadedStyleState } from './style_slice';
import {
  VisualizationState,
  getPreloadedState as getPreloadedVisualizationState,
} from './visualization_slice';
import { EditorState, getPreloadedState as getPreloadedEditorState } from './editor_slice';
import { UIStateState, getPreloadedState as getPreloadedUIState } from './ui_state_slice';
import { RootState, DefaultViewState } from '../../../../../data_explorer/public';

export interface VisBuilderState {
  vbEditor: EditorState;
  vbStyle: StyleState;
  vbUi: UIStateState;
  vbVisualization: VisualizationState;
}

export const getPreloadedState = async (
  services: VisBuilderServices
): Promise<DefaultViewState<VisBuilderState>> => {
  const styleState = await getPreloadedStyleState(services);
  const visualizationState = await getPreloadedVisualizationState(services);
  const editorState = await getPreloadedEditorState(services);
  const uiStateState = await getPreloadedUIState(services);
  const initialState = {
    vbStyle: styleState,
    vbVisualization: visualizationState,
    vbEditor: editorState,
    vbUi: uiStateState,
  };

  const preloadedState: DefaultViewState<VisBuilderState> = {
    state: {
      ...initialState,
    },
  };

  return preloadedState;
};

export type RenderState = Omit<VisBuilderState, 'vbEditor'>;
