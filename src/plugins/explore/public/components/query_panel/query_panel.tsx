/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { monaco } from '@osd/monaco';
import { useDispatch, useSelector } from 'react-redux';
import { EuiPanel } from '@elastic/eui';
import { QueryPanelLayout } from './layout';
import { ExploreServices } from '../../types';
import { IndexPattern } from '../../../../data/common/index_patterns';
import { EditorStack } from './components/editor_stack';
import { QueryPanelFooter } from './components/footer';
import { RecentQueriesTable } from './components/footer/recent_query/table';
import { useEditorMode } from './hooks/useEditorMode';
import { QueryTypeDetector } from './utils/type_detection';
import { Query, TimeRange, LanguageType } from './types';

import {
  selectIsLoading,
  selectShowDataSetFields,
} from '../../application/utils/state_management/selectors';
import './index.scss';

import { getEffectiveLanguageForAutoComplete } from '../../../../data/public';
import {
  setQuery,
  setShowDatasetFields,
  clearResults,
} from '../../application/utils/state_management/slices';
import {
  beginTransaction,
  finishTransaction,
} from '../../application/utils/state_management/actions/transaction_actions';
import { ResultStatus, QueryStatus } from '../../application/utils/state_management/types';
import { executeQueries } from '../../application/utils/state_management/actions/query_actions';

export interface QueryPanelProps {
  services: ExploreServices;
  indexPattern: IndexPattern;
}

const QueryPanel: React.FC<QueryPanelProps> = ({ services, indexPattern }) => {
  const dispatch = useDispatch();
  const [isRecentQueryVisible, setIsRecentQueryVisible] = useState(false);

  const {
    isDualEditor,
    isEditorReadOnly,
    isPromptReadOnly,
    query,
    prompt,
    editorLanguageType,
    setEditorLanguageType,
    setIsDualEditor,
    setIsEditorReadOnly,
    setIsPromptReadOnly,
    resetEditorState,
  } = useEditorMode();

  // Use selectors to get state from Redux
  const isLoading = useSelector(selectIsLoading);
  const showDatasetFields = useSelector(selectShowDataSetFields);

  // Determine if DatePicker should be shown
  const showDatePicker = Boolean(indexPattern?.timeFieldName);

  // Get timefilter directly from services
  const timefilter = services?.data?.query?.timefilter?.timefilter;

  // Local state for editor
  const [localQuery, setLocalQuery] = useState(query.query);
  const [localPrompt, setLocalPrompt] = useState(prompt);

  // Handle time range changes
  const handleTimeChange = useCallback(
    ({ start, end }: { start: string; end: string }) => {
      const newTimeRange = { from: start, to: end };

      // Update timefilter - this will trigger re-render automatically
      if (timefilter) {
        timefilter.setTime(newTimeRange);
      }
    },
    [timefilter]
  );

  const handleRefreshChange = useCallback(
    ({ isPaused, refreshInterval: interval }: { isPaused: boolean; refreshInterval: number }) => {
      const newRefreshInterval = { pause: isPaused, value: interval };

      // Update timefilter - this will trigger re-render automatically
      if (timefilter) {
        timefilter.setRefreshInterval(newRefreshInterval);
      }
    },
    [timefilter]
  );

  // Execute query when run button is clicked
  const handleRun = useCallback(async () => {
    dispatch(beginTransaction());
    try {
      // Update query string in Redux
      dispatch(setQuery({ ...query, query: localQuery }));

      // EXPLICIT cache clear - separate cache logic
      dispatch(clearResults());

      // Execute queries - cache already cleared
      await dispatch(executeQueries({ services }));
    } finally {
      dispatch(finishTransaction());
    }
  }, [dispatch, localQuery, query, services]);

  // Real autocomplete implementation using the data plugin's autocomplete service
  const provideCompletionItems = useCallback(
    async (
      model: monaco.editor.ITextModel,
      position: monaco.Position,
      context: monaco.languages.CompletionContext,
      token: monaco.CancellationToken
    ): Promise<monaco.languages.CompletionList> => {
      if (token.isCancellationRequested) {
        return { suggestions: [], incomplete: false };
      }
      try {
        // Get the effective language for autocomplete (PPL -> PPL_Simplified for explore app)
        const effectiveLanguage = getEffectiveLanguageForAutoComplete(query.language, 'explore');

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

        const result = {
          suggestions: monacoSuggestions,
          incomplete: false,
        };

        return result;
      } catch (autocompleteError) {
        return { suggestions: [], incomplete: false };
      }
    },
    [query, services, indexPattern]
  );

  // TODO: Create query status overlay for progress indicator
  const queryStatus: QueryStatus = {
    status: isLoading ? ResultStatus.LOADING : ResultStatus.READY,
    elapsedMs: 0,
    startTime: Date.now(),
  };

  const detectLanguageType = useCallback(
    (inputQuery: string) => {
      const detector = new QueryTypeDetector();
      const result = detector.detect(inputQuery);
      setEditorLanguageType(result.type);

      return result.type;
    },
    [setEditorLanguageType]
  );

  const handleQueryChange = useCallback((value: string) => {
    setLocalQuery(value);
  }, []);

  const handlePromptChange = useCallback(
    (value: string) => {
      const isPPLQuery = detectLanguageType(value) === LanguageType.PPL;

      if (isPPLQuery) {
        setLocalQuery(value);
      } else {
        setLocalPrompt(value);
      }
    },
    [detectLanguageType]
  );

  const handleQueryRun = () => {
    handleRun();
    setIsPromptReadOnly(true);
  };

  const handlePromptRun = async (_?: string | { [key: string]: any }) => {
    // TODO: Implement the NL API call to generate PPL query

    if (editorLanguageType === LanguageType.Natural) {
      setLocalQuery('source = opensearch_dashboards_sample_data_ecommerce'); // TODO: Example query, Remove this once actual NL API intg
      handleRun(); // TODO: Call NL API to generate PPL query and uopdate

      setIsDualEditor(true);
      setIsEditorReadOnly(true);
      // setLocalQuery((prev) => prev ?? queryString); // TODO: update this once NL updates redux state for querystring
    } else {
      handleRun();
      setIsDualEditor(false);
    }
  };

  const handleClearEditor = () => {
    resetEditorState();
    setLocalPrompt('');
    setLocalQuery('');
    setEditorLanguageType(LanguageType.Natural);
  };

  const handlePromptEdit = () => {
    setIsEditorReadOnly(true);
    setIsPromptReadOnly(false);
  };

  const handleQueryEdit = () => {
    setIsEditorReadOnly(false);
    setIsPromptReadOnly(true);
  };

  const handleRunClick = () => {
    if (isDualEditor) {
      handleRun();
    } else {
      handlePromptRun();
    }
  };

  const handleRecentClick = () => {
    setIsRecentQueryVisible(!isRecentQueryVisible);
  };

  const onClickRecentQuery = (recentQuery: Query, timeRange?: TimeRange) => {
    setIsRecentQueryVisible(false);
    setLocalQuery(typeof recentQuery.query === 'string' ? recentQuery.query : '');
    setLocalPrompt(recentQuery.prompt ?? '');
    setIsDualEditor(true);
    handleQueryRun();
  };

  const handleShowFieldsToggle = (showField: boolean) => {
    dispatch(setShowDatasetFields(showField));
  };

  const noInput = useMemo(() => {
    return !localQuery?.trim() && !localPrompt?.trim();
  }, [localQuery, localPrompt]);

  return (
    <EuiPanel paddingSize="s" className="queryPanel__container">
      <QueryPanelLayout
        footer={
          <QueryPanelFooter
            isDualEditor={isDualEditor}
            isLoading={isLoading}
            showDatePicker={showDatePicker}
            languageType={editorLanguageType}
            noInput={noInput}
            showDatasetFields={showDatasetFields}
            services={services}
            timefilter={timefilter}
            onRunClick={handleRunClick}
            onRecentClick={handleRecentClick}
            onTimeChange={handleTimeChange}
            onRunQuery={handleRun}
            oneRefreshChange={handleRefreshChange}
            onShowFieldsToggle={handleShowFieldsToggle}
          />
        }
      >
        <EditorStack
          isDualEditor={isDualEditor}
          isPromptReadOnly={isPromptReadOnly}
          isEditorReadOnly={isEditorReadOnly}
          queryString={typeof localQuery === 'string' ? localQuery : ''}
          languageType={editorLanguageType}
          prompt={localPrompt || ''}
          onPromptChange={handlePromptChange}
          onQueryChange={handleQueryChange}
          onPromptEdit={handlePromptEdit}
          onQueryEdit={handleQueryEdit}
          onQueryRun={handleQueryRun}
          onPromptRun={handlePromptRun}
          onClearEditor={handleClearEditor}
          provideCompletionItems={provideCompletionItems}
        />
      </QueryPanelLayout>
      {isRecentQueryVisible && (
        <div className="queryPanel__recentQueries">
          <RecentQueriesTable
            isVisible={isRecentQueryVisible}
            onClickRecentQuery={onClickRecentQuery}
            languageType={query.language}
          />
        </div>
      )}
    </EuiPanel>
  );
};

export { QueryPanel };
