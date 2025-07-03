/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useMemo } from 'react';
import { monaco } from '@osd/monaco';
import { useDispatch, useSelector } from 'react-redux';
import { getEffectiveLanguageForAutoComplete } from '../../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import {
  selectEditorMode,
  selectQueryLanguage,
  selectQueryString,
} from '../../../../application/utils/state_management/selectors';
import { useIndexPatternContext } from '../../../../application/components/index_pattern_context';
import { useSharedEditor } from '../use_shared_editor';
import { setTopEditorRef } from '../../../../application/utils/state_management/slices';
import { promptEditorOptions, queryEditorOptions } from '../editor_options';
import { UseEditorReturnType } from '../types';
import { EditorMode } from '../../../query_panel/types';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;

export const useTopEditor = (): UseEditorReturnType => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { indexPattern } = useIndexPatternContext();
  const dispatch = useDispatch();
  const queryLanguage = useSelector(selectQueryLanguage);
  const editorMode = useSelector(selectEditorMode);
  const query = useSelector(selectQueryString);
  const isQueryModeForTopEditor = editorMode === EditorMode.SingleQuery;

  // Real autocomplete implementation using the data plugin's autocomplete service
  const provideCompletionItems = useCallback(
    async (
      model: monaco.editor.ITextModel,
      position: monaco.Position,
      _: monaco.languages.CompletionContext,
      token: monaco.CancellationToken
    ): Promise<monaco.languages.CompletionList> => {
      if (token.isCancellationRequested) {
        return { suggestions: [], incomplete: false };
      }
      try {
        // Get the effective language for autocomplete (PPL -> PPL_Simplified for explore app)
        const effectiveLanguage = getEffectiveLanguageForAutoComplete(queryLanguage, 'explore');

        // Get the current dataset from Query Service to avoid stale closure values
        const currentDataset = services?.data?.query?.queryString?.getQuery().dataset;

        // Get the current indexPattern from services to avoid stale closure values
        let currentIndexPattern = indexPattern;
        if (currentDataset) {
          try {
            currentIndexPattern = await services?.indexPatterns?.get(
              currentDataset.id,
              currentDataset.type !== 'INDEX_PATTERN'
            );
          } catch (error) {
            // Fallback to the prop indexPattern if fetching fails
            currentIndexPattern = indexPattern;
          }
        }

        // Use the current IndexPattern to avoid stale data
        const suggestions = await services?.data?.autocomplete?.getQuerySuggestions({
          query: model.getValue(), // Use the current editor content, using the local query results in a race condition where we can get stale query data
          selectionStart: model.getOffsetAt(position),
          selectionEnd: model.getOffsetAt(position),
          language: effectiveLanguage,
          indexPattern: currentIndexPattern as any,
          datasetType: currentDataset?.type,
          position,
          services: services as any, // ExploreServices storage type incompatible with IDataPluginServices.DataStorage
        });

        // current completion item range being given as last 'word' at pos
        const wordUntil = model.getWordUntilPosition(position);

        const defaultRange = new monaco.Range(
          position.lineNumber,
          wordUntil.startColumn,
          position.lineNumber,
          wordUntil.endColumn
        );

        const filteredSuggestions = suggestions?.filter((s) => 'detail' in s) || [];

        const monacoSuggestions = filteredSuggestions.map((s: any) => ({
          label: s.text,
          kind: s.type as monaco.languages.CompletionItemKind,
          insertText: s.insertText ?? s.text,
          insertTextRules: s.insertTextRules ?? undefined,
          range: defaultRange,
          detail: s.detail,
          sortText: s.sortText,
        }));

        return {
          suggestions: monacoSuggestions,
          incomplete: false,
        };
      } catch (autocompleteError) {
        return { suggestions: [], incomplete: false };
      }
    },
    [queryLanguage, services, indexPattern]
  );

  // TODO: Do i need to update options when top editor switches to code mode?

  const setEditorRef = useCallback(
    (editor: IStandaloneCodeEditor) => {
      dispatch(setTopEditorRef(editor));
    },
    [dispatch]
  );

  const sharedProps = useSharedEditor({ provideCompletionItems, setEditorRef });

  // TODO: Ugly fix
  const options = useMemo(
    () => (isQueryModeForTopEditor ? queryEditorOptions : promptEditorOptions),
    [isQueryModeForTopEditor]
  );

  return {
    ...sharedProps,
    languageId: queryLanguage,
    options,
    defaultValue: query,
    triggerSuggestOnFocus: isQueryModeForTopEditor,
  };
};
