/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo } from 'react';
import { useObservable } from 'react-use';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { useMultiQueryBuilder } from '../multi_query_builder/multi_query_builder_context';
import { useVisualizationBuilder } from './use_visualization_builder';

/**
 * Whether the editor has changes to save: the queries or the vis differ from their saved
 * baselines, each tracked by its own builder. Changing something and changing it back is clean
 * again.
 */
export const useEditorDirty = () => {
  const container = useMultiQueryBuilder();
  const { visualizationBuilderForEditor } = useVisualizationBuilder();
  const isDirty$ = useMemo(
    () =>
      combineLatest([container.getIsDirty$(), visualizationBuilderForEditor.getIsDirty$()]).pipe(
        map(([queriesDirty, visDirty]) => queriesDirty || visDirty)
      ),
    [container, visualizationBuilderForEditor]
  );
  const isDirty = useObservable(isDirty$, false);

  const confirmSave = useCallback(() => {
    container.confirmSaveSnapshot();
    visualizationBuilderForEditor.confirmSaveSnapshot();
  }, [container, visualizationBuilderForEditor]);

  return { isDirty, confirmSave };
};
