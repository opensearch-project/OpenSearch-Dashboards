/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { debounce } from 'lodash';
import { QueryPanelLayout } from './layout';
import { EditorStack } from './components/editor_stack';
import { QueryPanelFooter } from './components/footer';
import { RecentQueriesTable } from './components/footer/recent_query/table';
import { QueryTypeDetector } from './utils/type_detection';
import { Query, TimeRange, LanguageType } from './types';
import './index.scss';

const intitialQuery = (language: LanguageType, dataset: string) => ({
  query: '',
  prompt: '',
  language,
  dataset,
});

const QueryPanel = () => {
  const [isRecentQueryVisible, setIsRecentQueryVisible] = useState(false);

  // We use useRef to track the latest detected language type immediately,
  // since setState is async and we're using a debounced detector.
  // This ensures accurate access to languageTypeRef.current without waiting for re-renders
  const languageTypeRef = useRef<LanguageType>(LanguageType.Natural); // Default to Natural

  const [isDualEditor, setIsDualEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPromptReadOnly, setIsPromptReadOnly] = useState(false);
  const [isEditorReadOnly, setIsEditorReadOnly] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<Query>(
    intitialQuery(languageTypeRef.current, 'test') // TODO: Update this with dataset
  );

  const onQueryStringChange = React.useCallback((value: string, isPrompt: boolean) => {
    setCurrentQuery((prevQuery) => {
      const query = {
        ...prevQuery,
      };
      if (isPrompt) {
        query.prompt = value;
      } else {
        query.query = value;
      }
      return query;
    });
  }, []);

  const detectLanguageType = useMemo(
    () =>
      debounce((query: string) => {
        const detector = new QueryTypeDetector();
        const result = detector.detect(query);
        languageTypeRef.current = result.type;
        setCurrentQuery((prevQuery) => ({
          ...prevQuery,
          language: result.type,
        }));
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

  const onQueryChange = React.useCallback(
    (value: string) => {
      onQueryStringChange(value, false);
    },
    [onQueryStringChange]
  );

  const handleQueryRun = async (
    queryString?: string | { [key: string]: any },
    timeRange?: TimeRange
  ) => {
    // TODO: call query run with querystring and timerange when datetime and queryslice is integrated
    onRun();
    setIsPromptReadOnly(true);
  };

  const onRun = async () => {
    // TODO: Implement the actual run logic here when query actions ready
    setIsLoading(true); // Set loading to true
    await new Promise((resolve) => setTimeout(resolve, 3000)); // 3-second delay mock
    setIsLoading(false);
  };

  const handleClearEditor = () => {
    setIsDualEditor(false);
    setIsEditorReadOnly(false);
    setIsPromptReadOnly(false);
    setCurrentQuery(intitialQuery(LanguageType.Natural, 'test')); // TODO: Pass dataset name dynamically
  };

  const handlePromptRun = async (queryString?: string | { [key: string]: any }) => {
    onRun();
    const detectedLang = languageTypeRef.current;

    if (detectedLang === LanguageType.Natural) {
      // TODO: Call NL API to generate PPL query

      setIsDualEditor(true);
      setIsEditorReadOnly(true);
      setCurrentQuery((prevQuery) => ({
        ...prevQuery,
        query: 'source=test\n| where state=CA and year=2023\n| sort=asc',
      }));
      // TODO: Update query object with generated ppl query
    } else {
      setIsDualEditor(false);
      setCurrentQuery((prevQuery) => ({
        ...prevQuery,
        query: '',
      }));
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
      onRun();
    } else {
      handlePromptRun();
    }
  };

  const handleRecentClick = () => {
    setIsRecentQueryVisible(!isRecentQueryVisible);
  };

  const onClickRecentQuery = (recentQuery: Query, timeRange?: TimeRange) => {
    setIsRecentQueryVisible(false);
    setCurrentQuery(recentQuery);
    setIsDualEditor(true);
    handleQueryRun(recentQuery.query, timeRange);
  };

  const noInput = React.useMemo(
    () => !(currentQuery.query ?? '').trim() && !(currentQuery.prompt ?? '').trim(),
    [currentQuery.query, currentQuery.prompt]
  );

  return (
    <div className="queryPanel__container">
      <QueryPanelLayout
        footer={
          <QueryPanelFooter
            isDualEditor={isDualEditor}
            isLoading={isLoading}
            languageType={currentQuery.language}
            onRunClick={handleRunClick}
            onRecentClick={handleRecentClick}
            noInput={noInput}
          />
        }
      >
        <EditorStack
          isDualEditor={isDualEditor}
          isPromptReadOnly={isPromptReadOnly}
          isEditorReadOnly={isEditorReadOnly}
          queryString={typeof currentQuery.query === 'string' ? currentQuery.query : ''}
          languageType={languageTypeRef.current}
          prompt={currentQuery.prompt || ''}
          onPromptChange={onPromptChange}
          onQueryChange={onQueryChange}
          onPromptEdit={handlePromptEdit}
          onQueryEdit={handleQueryEdit}
          onQueryRun={handleQueryRun}
          onPromptRun={handlePromptRun}
          onClearEditor={handleClearEditor}
        />
      </QueryPanelLayout>
      {isRecentQueryVisible && (
        <div className="queryPanel__recentQueries">
          <RecentQueriesTable
            isVisible={isRecentQueryVisible}
            onClickRecentQuery={onClickRecentQuery}
            languageType={currentQuery.language}
          />
        </div>
      )}
    </div>
  );
};

export { QueryPanel };
