/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { monaco } from '@osd/monaco';
import { useDispatch, useSelector } from 'react-redux';
import { debounce } from 'lodash';
import { EuiPanel } from '@elastic/eui';
import { QueryPanelLayout } from './layout';
import { ExploreServices } from '../../types';
import { IndexPattern } from '../../../../data/common/index_patterns';
import { EditorStack } from './components/editor_stack';
import { QueryPanelFooter } from './components/footer';
import { RecentQueriesTable } from './components/footer/recent_query/table';
import { QueryTypeDetector } from './utils/type_detection';
import { Query, TimeRange, LanguageType } from './types';

import {
  selectQueryString,
  selectQueryLanguage,
  selectIsLoading,
  selectDataset,
} from '../../application/utils/state_management/selectors';
import './index.scss';

import { getEffectiveLanguageForAutoComplete } from '../../../../data/public';
import { setQueryString } from '../../application/utils/state_management/slices/query_slice';
import { clearResults } from '../../application/utils/state_management/slices/results_slice';
import {
  beginTransaction,
  finishTransaction,
} from '../../application/utils/state_management/actions/transaction_actions';
import { ResultStatus, QueryStatus } from '../../application/utils/state_management/types';
import { executeQueries } from '../../application/utils/state_management/actions/query_actions';

export interface QueryPanelProps {
  datePickerRef?: React.RefObject<HTMLDivElement>;
  services: ExploreServices;
  indexPattern: IndexPattern;
}

const QueryPanel: React.FC<QueryPanelProps> = ({ datePickerRef, services, indexPattern }) => {
  const dispatch = useDispatch();
  const [isRecentQueryVisible, setIsRecentQueryVisible] = useState(false);

  // We use useRef to track the latest detected language type immediately,
  // since setState is async and we're using a debounced detector.
  // This ensures accurate access to languageTypeRef.current without waiting for re-renders

  const [isDualEditor, setIsDualEditor] = useState(false);
  const [isPromptReadOnly, setIsPromptReadOnly] = useState(false);
  const [isEditorReadOnly, setIsEditorReadOnly] = useState(false);

  // Use selectors to get state from Redux
  const queryString = useSelector(selectQueryString);
  const queryLanguage = useSelector(selectQueryLanguage);
  const isLoading = useSelector(selectIsLoading);
  const dataset = useSelector(selectDataset);

  // Determine if DatePicker should be shown
  const showDatePicker = Boolean(indexPattern?.timeFieldName);

  // Get timefilter directly from services
  const timefilter = services?.data?.query?.timefilter?.timefilter;

  // Local state for editor
  const [localQuery, setLocalQuery] = useState(queryString);
  const [localPrompt, setLocalPrompt] = useState('');
  const [editorLanguageType, setEditorLanguageType] = useState(LanguageType.Natural); // Default to Natural

  // Update local state when Redux state changes
  useEffect(() => {
    setLocalQuery(queryString);
  }, [queryString]);

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
  const handleRunQuery = useCallback(async () => {
    dispatch(beginTransaction());
    try {
      // Update query string in Redux
      dispatch(setQueryString(localQuery));

      // EXPLICIT cache clear - separate cache logic
      dispatch(clearResults());

      // Execute queries - cache already cleared
      await dispatch(executeQueries({ services }) as any);
    } finally {
      dispatch(finishTransaction());
    }
  }, [dispatch, localQuery, services]);

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
        const effectiveLanguage = getEffectiveLanguageForAutoComplete(queryLanguage, 'explore');

        // Use centralized IndexPattern from context
        const suggestions = await services?.data?.autocomplete?.getQuerySuggestions({
          query: queryString ?? '',
          selectionStart: model.getOffsetAt(position),
          selectionEnd: model.getOffsetAt(position),
          language: effectiveLanguage,
          indexPattern: indexPattern as any,
          datasetType: dataset?.type,
          position,
          services: services as any, // ExploreServices now includes appName, compatible with IDataPluginServices
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
    [services, queryLanguage, indexPattern, dataset?.type, queryString]
  );

  // TODO: Create query status overlay for progress indicator
  const queryStatus: QueryStatus = {
    status: isLoading ? ResultStatus.LOADING : ResultStatus.READY,
    elapsedMs: 0,
    startTime: Date.now(),
  };

  const onQueryStringChange = React.useCallback((value: string, isPrompt: boolean) => {
    if (isPrompt) {
      setLocalPrompt(value);
    } else {
      setLocalQuery(value);
    }
  }, []);

  const detectLanguageType = useMemo(
    () =>
      debounce((query: string) => {
        const detector = new QueryTypeDetector();
        const result = detector.detect(query);
        setEditorLanguageType(result.type);
      }, 500),
    []
  ); // Adjust debounce time as needed

  useEffect(() => {
    return () => detectLanguageType.cancel();
  }, [detectLanguageType]);

  const onPromptChange = React.useCallback(
    (value: string) => {
      detectLanguageType(value);
      onQueryStringChange(value, true);
    },
    [detectLanguageType, onQueryStringChange]
  );

  const handleQueryChange = useCallback((value: string) => {
    setLocalQuery(value);
  }, []);

  const handleQueryRun = () => {
    handleRunQuery();
    setIsPromptReadOnly(true);
  };

  const handleClearEditor = () => {
    setIsDualEditor(false);
    setIsEditorReadOnly(false);
    setIsPromptReadOnly(false);
    setEditorLanguageType(LanguageType.Natural);
  };

  const handlePromptRun = async (_?: string | { [key: string]: any }) => {
    // TODO: Implement the NL API call to generate PPL query
    const detectedLang = editorLanguageType;

    if (detectedLang === LanguageType.Natural) {
      handleQueryRun(); // TODO: Call NL API to generate PPL query and uopdate

      setIsDualEditor(true);
      setIsEditorReadOnly(true);
      setLocalQuery(queryString); // TODO: remove this once NL updates redux state for querystring
    } else {
      handleQueryRun();
      setIsDualEditor(false);
    }
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
      handleRunQuery();
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

  const noInput = React.useMemo(() => !(localQuery ?? '').trim() && !(localPrompt ?? '').trim(), [
    localQuery,
    localPrompt,
  ]);

  return (
    <EuiPanel paddingSize="s" className="queryPanel__container">
      <QueryPanelLayout
        footer={
          <QueryPanelFooter
            isDualEditor={isDualEditor}
            isLoading={isLoading}
            showDatePicker={showDatePicker}
            languageType={editorLanguageType}
            onRunClick={handleRunClick}
            onRecentClick={handleRecentClick}
            noInput={noInput}
            datePickerRef={datePickerRef}
            services={services}
            timefilter={timefilter}
            handleTimeChange={handleTimeChange}
            handleRunQuery={handleRunQuery}
            handleRefreshChange={handleRefreshChange}
          />
        }
      >
        <EditorStack
          isDualEditor={isDualEditor}
          isPromptReadOnly={isPromptReadOnly}
          isEditorReadOnly={isEditorReadOnly}
          queryString={typeof queryString === 'string' ? queryString : ''}
          languageType={editorLanguageType}
          prompt={localPrompt || ''}
          onPromptChange={onPromptChange}
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
            languageType={editorLanguageType}
          />
        </div>
      )}
    </EuiPanel>
  );
};

export { QueryPanel };
