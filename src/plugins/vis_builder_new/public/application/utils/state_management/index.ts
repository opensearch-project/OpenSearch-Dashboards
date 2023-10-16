/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TypedUseSelectorHook } from 'react-redux';
import { RootState, useTypedDispatch, useTypedSelector } from '../../../../../data_explorer/public';
import { slice as editorSlice, EditorState } from './editor_slice';
import { styleSlice, StyleState } from './style_slice';
import { uiStateSlice, UIStateState } from './ui_state_slice';
import { slice as visualizationSlice, VisualizationState } from './visualization_slice';

export * from './preload';
export * from './handlers';

export const useEditorSelector: TypedUseSelectorHook<EditorState> = useTypedSelector;
export const useStyleSelector: TypedUseSelectorHook<StyleState> = useTypedSelector;
export const useUiSelector: TypedUseSelectorHook<UIStateState> = useTypedSelector;
export const useVisualizationSelector: TypedUseSelectorHook<VisualizationState> = useTypedSelector;
export const useDispatch = useTypedDispatch;
export { editorSlice, styleSlice, uiStateSlice, visualizationSlice };
