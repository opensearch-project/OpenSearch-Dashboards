/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { matchPath } from 'react-router-dom';
import { PLUGIN_ID } from '../common';
import { getStateFromOsdUrl, setStateToOsdUrl } from '../../opensearch_dashboards_utils/public';
import {
  EditorState,
  UIStateState,
  VisualizationState,
  StyleState,
  EditorStatus,
} from './application/utils/state_management';

interface VisBuilderParams {
  id?: string;
}

interface LegacyMetadataState {
  editor: {
    errors: {
      // Errors for each section in the editor
      [key: string]: boolean;
    };
    state: EditorStatus;
  };
  originatingApp?: string;
}

interface LegacyVisualizationState extends VisualizationState {
  indexPattern?: string;
}

export interface LegacyVisBuilderState {
  metadata: LegacyMetadataState;
  style: StyleState;
  ui: UIStateState;
  visualization: LegacyVisualizationState;
}

// TODO: Write unit tests once all routes have been migrated.
/**
 * Migrates legacy URLs to the current URL format.
 * @param oldPath The legacy hash that contains the state.
 * @param newPath The new base path.
 */
export function migrateUrlState(oldPath: string, newPath = '/'): string {
  let path = newPath;
  const pathPatterns = [
    {
      pattern: '/edit/:id',
      extraState: {},
      path: `savedVisBuilder`,
    },
    { pattern: '#/', extraState: {}, path: `vis-builder` },
  ];

  // Get the first matching path pattern.
  const matchingPathPattern = pathPatterns.find((pathPattern) =>
    matchPath(oldPath, { path: pathPattern.pattern, strict: false })
  );

  if (!matchingPathPattern) {
    return path;
  }

  // Migrate the path.
  switch (matchingPathPattern.path) {
    case `vis-builder`:
    case `savedVisBuilder`:
      const params = matchPath<VisBuilderParams>(oldPath, {
        path: matchingPathPattern.pattern,
      })!.params;

      // if there is a saved search id, use the saved search path
      if (params.id) {
        path = `${path}edit/${params.id}`;
      }

      const appState = getStateFromOsdUrl<LegacyVisBuilderState>('_a', oldPath);
      const _q = getStateFromOsdUrl<any>('_q', oldPath);
      const _g = getStateFromOsdUrl<any>('_g', oldPath);

      if (!appState) return path;

      const { metadata, style, ui, visualization } = appState;

      // transform vis builder metadata state to editor state
      const transformedEditorState: EditorState = {
        errors: metadata.editor.errors,
        status: metadata.editor.state as EditorStatus,
        savedVisBuilderId: params.id || '',
      };

      // remove index pattern from vis builder visualization state
      const transformedVisualizationState = { ...visualization };
      delete transformedVisualizationState.indexPattern;

      // contstruct new state
      const newState = {
        'vis-builder-editor': transformedEditorState,
        'vis-builder-style': style,
        'vis-builder-ui': ui,
        'vis-builder-visualization': transformedVisualizationState,
      };

      const _a = {
        ...newState,
        metadata: {
          indexPattern: visualization.indexPattern,
          view: `${PLUGIN_ID}`,
        },
      };

      path = setStateToOsdUrl('_a', _a, { useHash: false }, path);
      path = setStateToOsdUrl('_q', _q, { useHash: false }, path);
      path = setStateToOsdUrl('_g', _g, { useHash: false }, path);

      break;
  }

  return path;
}
