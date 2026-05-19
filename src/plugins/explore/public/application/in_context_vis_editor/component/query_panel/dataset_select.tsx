/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo, useRef } from 'react';
import { Dataset, DEFAULT_DATA, EMPTY_QUERY } from '../../../../../../data/common';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../../../../common';
import { SupportLanguageType } from '../../query_builder/query_builder';
import { getRequiredSignalType } from '../../query_builder/utils';
import { useQueryPanelContext } from './query_panel_context';
import '../../visualization_editor.scss';
import { EditorMode } from '../../../utils/state_management/types';

export const DatasetSelectWidget = () => {
  const {
    services,
    supportedTypes: inputSupportedTypes,
    queryEditorState,
    handleQueryChange,
    handleEditorChange,
    editorOperations: { clearEditor },
  } = useQueryPanelContext();

  const {
    data: {
      ui: { DatasetSelect },
      query: { queryString },
    },
    notifications,
  } = services;

  const containerRef = useRef<HTMLDivElement>(null);

  const handleDatasetSelect = useCallback(
    async (dataset: Dataset | undefined) => {
      try {
        if (!dataset) {
          // Clear dataset - reset to empty query state with explore default language
          handleQueryChange({
            query: EMPTY_QUERY.QUERY,
            language: EXPLORE_DEFAULT_LANGUAGE,
            dataset: undefined,
          });

          handleEditorChange({ isQueryEditorDirty: true, editorMode: EditorMode.Query });
          clearEditor();

          return;
        }

        const initialQuery = queryString.getInitialQueryByDataset(dataset);
        handleQueryChange({
          ...initialQuery,
          query: EMPTY_QUERY.QUERY,
          dataset,
        });
        handleEditorChange({ isQueryEditorDirty: true, editorMode: EditorMode.Query });
        clearEditor();
      } catch (error) {
        notifications?.toasts.addError(error, {
          title: 'Error selecting dataset',
        });
      }
    },
    [queryString, clearEditor, handleEditorChange, handleQueryChange, notifications?.toasts]
  );

  const supportedTypes = useMemo(() => {
    if (queryEditorState.languageType === SupportLanguageType.promQL) return ['PROMETHEUS'];

    return (
      inputSupportedTypes || [DEFAULT_DATA.SET_TYPES.INDEX, DEFAULT_DATA.SET_TYPES.INDEX_PATTERN]
    );
  }, [queryEditorState.languageType, inputSupportedTypes]);

  const signalTypes = useMemo(() => getRequiredSignalType(queryEditorState.languageType), [
    queryEditorState.languageType,
  ]);

  return (
    <div ref={containerRef} className="exploreDatasetSelectWrapper">
      <DatasetSelect
        onSelect={handleDatasetSelect}
        appName="explore"
        supportedTypes={supportedTypes}
        signalType={signalTypes}
        showNonTimeFieldDatasets={false}
      />
    </div>
  );
};
