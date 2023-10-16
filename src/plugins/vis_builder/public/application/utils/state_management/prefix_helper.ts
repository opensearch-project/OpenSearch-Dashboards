/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PLUGIN_ID } from '../../../../common';
import {
  VisBuilderRootState,
  EditorState,
  StyleState,
  UIStateState,
  VisualizationState,
  VisBuilderRootStateKeys,
  PrefixedVisBuilderRootState,
} from '.';

// Mapping from VisBuilder View state keys to their respective state types. Limit to View state.
interface ValidStateTypesMapping {
  editor: EditorState;
  ui: UIStateState;
  visualization: VisualizationState;
  style: StyleState;
}

const validKeys = new Set([
  'vis-builder-editor',
  'vis-builder-ui',
  'vis-builder-visualization',
  'vis-builder-style',
  'metadata',
]);

/**
 * Retrieves a specific slice from the root state based on a given key.
 * The function dynamically constructs the key by adding the PLUGIN_ID prefix.
 *
 * @param {PrefixedVisBuilderRootState} rootState - The root state object with prefixed keys.
 * @param {K} stateKey - The key of the state slice to retrieve.
 * @returns {ValidStateTypesMapping[K]} - The state slice corresponding to the provided key.
 */
export const getViewSliceFromRoot = <K extends keyof ValidStateTypesMapping>(
  rootState: PrefixedVisBuilderRootState,
  stateKey: K
) => {
  const dynamicKey = `${PLUGIN_ID}-${stateKey}` as keyof PrefixedVisBuilderRootState;
  return rootState[dynamicKey] as ValidStateTypesMapping[K];
};

/**
 * Selector function to access a specific slice from the state.
 * This function creates a selector that can be used in components to select a part of the state.
 *
 * @param {VisBuilderRootStateKeys} stateKey - The key of the state slice to select.
 * @returns - A selector function for the specified state slice.
 */
export const getViewSliceFromSelector = (stateKey: VisBuilderRootStateKeys) => (
  state: PrefixedVisBuilderRootState
) => state[`${PLUGIN_ID}-${stateKey}`];

/**
 * Transforms the PrefixedVisBuilderRootState back into VisBuilderRootState.
 * This function iterates over the keys of the state and transforms them back to the original format.
 *
 * @param {PrefixedVisBuilderRootState} rootState - The prefixed root state object.
 * @returns {VisBuilderRootState} - The transformed root state with original keys.
 */
export const getVisBuilderRootState = (
  rootState: PrefixedVisBuilderRootState
): VisBuilderRootState => {
  const transformedState = {};

  Object.keys(rootState).forEach((prefixedKey) => {
    if (validKeys.has(prefixedKey)) {
      const key =
        prefixedKey === 'metadata' ? prefixedKey : prefixedKey.replace(`${PLUGIN_ID}-`, '');
      transformedState[key] = rootState[prefixedKey];
    }
  });

  return transformedState as VisBuilderRootState;
};
