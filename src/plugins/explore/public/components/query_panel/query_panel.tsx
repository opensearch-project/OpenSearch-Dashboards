/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { monaco } from '@osd/monaco';
import { useDispatch, useSelector } from 'react-redux';
import { EuiPanel } from '@elastic/eui';

import { useGenerateQuery } from '../../../../query_enhancements/public';
import { QueryPanelLayout } from './layout';
import { ExploreServices } from '../../types';

import { IndexPattern } from '../../../../data/common/index_patterns';
import { EditorStack } from './components/editor_stack';
import { QueryPanelFooter } from './components/footer';
import { RecentQueriesTable, SavedQuery } from '../../../../data/public';
import { useEditorMode } from './hooks/useEditorMode';
import { QueryTypeDetector } from './utils/type_detection';
import { LanguageType, Query, TimeRange } from './types';

import {
  selectIsLoading,
  selectShowDataSetFields,
} from '../../application/utils/state_management/selectors';
import './index.scss';

import { ResultStatus, QueryStatus } from '../../application/utils/state_management/types';
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

import { executeQueries } from '../../application/utils/state_management/actions/query_actions';
import { setSavedQuery } from '../../application/utils/state_management/slices';
import { AgentError, ProhibitedQueryError } from './utils/error';
import { PromptParameters } from './components/editor_stack/types';

export interface QueryPanelProps {
  services: ExploreServices;
  indexPattern: IndexPattern;
}

const QueryPanel: React.FC<QueryPanelProps> = ({ services, indexPattern }) => {
  const dispatch = useDispatch();

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
  // Retrieve the current dataset from Query Service
  const dataset = services?.data?.query?.queryString?.getQuery()?.dataset;

  // Local state for editor
  const [localQuery, setLocalQuery] = useState(query.query);
  const [localPrompt, setLocalPrompt] = useState(prompt);
  const [isRecentQueryVisible, setIsRecentQueryVisible] = useState(false);

  const { generateQuery, loading: isPromptLoading } = useGenerateQuery(services.uiActions);
  const [agentError, setAgentError] = useState<AgentError>();

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

  const queryStatus: QueryStatus = {
    status: isLoading ? ResultStatus.LOADING : ResultStatus.READY,
    elapsedMs: 0,
    startTime: Date.now(),
  };

  // Execute query when run button is clicked
  const handleRun = useCallback(
    async (paramQuery?: string) => {
      const queryToRun = paramQuery ?? localQuery;
      const nextQuery = { ...query, query: queryToRun };

      dispatch(beginTransaction());
      try {
        dispatch(setQuery(nextQuery));
        dispatch(clearResults());
        dispatch(executeQueries({ services }));

        // Use nextQuery here, not query!
        services.data.query.queryString.addToQueryHistory(nextQuery, timefilter.getTime());
      } finally {
        dispatch(finishTransaction());
      }
    },
    [dispatch, localQuery, query, services, timefilter]
  );

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
        setIsDualEditor(false);
      } else {
        setLocalPrompt(value);
      }
    },
    [detectLanguageType, setIsDualEditor]
  );

  const handleQueryRun = () => {
    handleRun();
    setIsPromptReadOnly(true);
  };

  const handleAgentCall = async () => {
    const promptParam = localPrompt?.trim();
    if (!promptParam) {
      services.notifications.toasts.addWarning(
        'Enter a natural language question to automatically generate a query to view results'
      );
      return;
    }
    if (!dataset) {
      services.notifications.toasts.addWarning('Select a data source or index to ask a question');
      return;
    }
    // setAgentError(undefined); TODO: Handle agent error display

    // Prepare parameters for the API
    const params: PromptParameters = {
      question: promptParam,
      index: dataset.title,
      language: query.language,
      dataSourceId: dataset?.dataSource?.id,
    };
    const { response, error } = await generateQuery(params); // Call the NL API

    if (error) {
      if (error instanceof ProhibitedQueryError) {
        services.notifications.toasts.addError(error, {
          title: 'I am unable to respond to this query. Try another question',
        });
      } else if (error instanceof AgentError) {
        services.notifications.toasts.addError(error, {
          title: 'I am unable to respond to this query. Try another question',
        });
        setAgentError(error);
      } else {
        services.notifications.toasts.addError(error, { title: 'Failed to generate results' });
      }

      setLocalQuery(''); // Clear query on error
    } else if (response) {
      // Update local state with the generated query
      setLocalQuery(response.query);

      // Run the generated query
      handleRun(response.query);

      setIsDualEditor(true);
      setIsEditorReadOnly(true);

      if (response.timeRange) services.data.query.timefilter.timefilter.setTime(response.timeRange);
    }
  };

  const handlePromptRun = async () => {
    if (editorLanguageType === LanguageType.Natural) {
      handleAgentCall();
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

  const onClickRecentQuery = (currentQuery: Query, timeRange?: TimeRange) => {
    const updatedQuery = typeof currentQuery.query === 'string' ? currentQuery.query : '';
    setIsRecentQueryVisible(false);
    handlePromptChange(updatedQuery);
    handleRun(updatedQuery);
    if (timeRange) handleTimeChange({ start: timeRange.from, end: timeRange.to });
  };

  const handleShowFieldsToggle = (showField: boolean) => {
    dispatch(setShowDatasetFields(showField));
  };

  const noInput = useMemo(() => {
    return !localQuery?.trim() && !localPrompt?.trim();
  }, [localQuery, localPrompt]);

  const handleClearQuery = () => {
    dispatch(setSavedQuery(undefined));
    dispatch(setQuery({ ...query, query: '' }));
    setLocalQuery('');
  };

  const handleLoadSavedQuery = (savedQuery: SavedQuery) => {
    if (!savedQuery || typeof savedQuery === 'string') {
      return;
    }
    const savedQueryAttributes = savedQuery.attributes.query;
    dispatch(setQuery({ ...savedQueryAttributes, dataset: query.dataset }));
    setLocalQuery(savedQueryAttributes.query);
    updateSavedQueryId(savedQuery.id);
  };

  const updateSavedQueryId = (newSavedQueryId: string | undefined) => {
    dispatch(setSavedQuery(newSavedQueryId));
  };

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
            query={query}
            timefilter={timefilter}
            onRunClick={handleRunClick}
            onRecentClick={handleRecentClick}
            onTimeChange={handleTimeChange}
            onRunQuery={handleRun}
            onRefreshChange={handleRefreshChange}
            onShowFieldsToggle={handleShowFieldsToggle}
            onClearQuery={handleClearQuery}
            onLoadSavedQuery={handleLoadSavedQuery}
            onSavedQuery={updateSavedQueryId}
          />
        }
      >
        <EditorStack
          isDualEditor={isDualEditor}
          isPromptLoading={isPromptLoading}
          isQueryLoading={isLoading}
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
            queryString={services.data.query.queryString}
            onClickRecentQuery={onClickRecentQuery}
          />
        </div>
      )}
    </EuiPanel>
  );
};

export { QueryPanel };
