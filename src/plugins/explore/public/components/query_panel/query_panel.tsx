/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { useEditorMode } from './hooks/useEditorMode';
import { QueryTypeDetector } from './utils/type_detection';
import { Query, TimeRange, LanguageType } from './types';

import {
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

  const {
    isDualEditor,
    isEditorReadOnly,
    isPromptReadOnly,
    queryString,
    prompt,
    editorLanguageType,
    setEditorLanguageType,
    setIsDualEditor,
    setIsEditorReadOnly,
    setIsPromptReadOnly,
    resetEditorState,
  } = useEditorMode();

  // Use selectors to get state from Redux
  const { queryLanguage, isLoading, dataset } = useSelector((state: any) => ({
    queryLanguage: selectQueryLanguage(state),
    isLoading: selectIsLoading(state),
    dataset: selectDataset(state),
  }));

  // Determine if DatePicker should be shown
  const showDatePicker = Boolean(indexPattern?.timeFieldName);

  // Get timefilter directly from services
  const timefilter = services?.data?.query?.timefilter?.timefilter;

  // Local state for editor
  const [localQuery, setLocalQuery] = useState(queryString);
  const [localPrompt, setLocalPrompt] = useState(prompt);
  const languageTypeRef = React.useRef<LanguageType>(
    queryLanguage ? LanguageType.PPL : LanguageType.Natural
  ); // Default to Natural

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
  const handleRun = useCallback(async () => {
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

  const detectLanguageType = useMemo(
    () =>
      debounce((query: string) => {
        const detector = new QueryTypeDetector();
        const result = detector.detect(query);
        setEditorLanguageType(result.type);
        languageTypeRef.current = result.type;
      }, 300),
    [setEditorLanguageType, languageTypeRef]
  ); // Adjust debounce time as needed

  useEffect(() => {
    return () => detectLanguageType.cancel();
  }, [detectLanguageType]);

  const handleQueryChange = useCallback((value: string) => {
    setLocalQuery(value);
  }, []);

  const handlePromptChange = useCallback(
    (value: string) => {
      detectLanguageType(value);

      if (languageTypeRef.current === LanguageType.Natural) {
        // eslint-disable-next-line no-console
        console.log(value, 'nl value');
        // If detected as Natural Language, update prompt and set dual editor mode off
        setLocalPrompt(value);
        // languageTypeRef.current = LanguageType.Natural;
      } else {
        // If detected as PPL, update query and set dual editor mode off
        // eslint-disable-next-line no-console
        console.log(value, 'ppl value');
        setLocalPrompt('');
        setLocalQuery(value);
        setIsDualEditor(false);
        // languageTypeRef.current = LanguageType.PPL;
      }
    },
    [detectLanguageType, setIsDualEditor]
  );

  const handleQueryRun = () => {
    // eslint-disable-next-line no-console
    console.log('Running query:', localQuery);

    handleRun();
    setIsPromptReadOnly(true);
  };

  const handlePromptRun = async (_?: string | { [key: string]: any }) => {
    // TODO: Implement the NL API call to generate PPL query

    const detectedLang = languageTypeRef.current;

    // eslint-disable-next-line no-console
    console.log(detectedLang, 'detectedLang');

    if (detectedLang === LanguageType.Natural) {
      setLocalQuery('source = opensearch_dashboards_sample_data_ecommerce'); // TODO: Example query, Remove this once actual NL API intg
      // eslint-disable-next-line no-console
      console.log('nl call');
      handleRun(); // TODO: Call NL API to generate PPL query and uopdate

      setIsDualEditor(true);
      setIsEditorReadOnly(true);
      // setLocalQuery((prev) => prev ?? queryString); // TODO: update this once NL updates redux state for querystring
    } else {
      // eslint-disable-next-line no-console
      console.log('nppl call');
      handleRun();
      setIsDualEditor(false);
    }
  };

  const handleClearEditor = () => {
    resetEditorState();
    languageTypeRef.current = LanguageType.Natural; // Reset to Natural Language
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
            datePickerRef={datePickerRef}
            services={services}
            timefilter={timefilter}
            onRunClick={handleRunClick}
            onRecentClick={handleRecentClick}
            onTimeChange={handleTimeChange}
            onRunQuery={handleRun}
            oneRefreshChange={handleRefreshChange}
          />
        }
      >
        <EditorStack
          isDualEditor={isDualEditor}
          isPromptReadOnly={isPromptReadOnly}
          isEditorReadOnly={isEditorReadOnly}
          queryString={typeof localQuery === 'string' ? localQuery : ''}
          languageType={
            languageTypeRef.current === LanguageType.PPL ? LanguageType.PPL : LanguageType.Natural
          }
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
            languageType={editorLanguageType}
          />
        </div>
      )}
    </EuiPanel>
  );
};

export { QueryPanel };
