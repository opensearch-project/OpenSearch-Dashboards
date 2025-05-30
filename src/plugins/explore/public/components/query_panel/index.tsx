/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { debounce } from 'lodash';
import { QueryPanelLayout } from './layout';
import { EditorStack } from './components/editor_stack';
import { QueryEditorFooter } from './components/footer/index';
import { LanguageType } from './components/editor_stack/shared';
import { RecentQueriesTable } from './components/footer/recent_query/table';
import { QueryTypeDetector } from './utils/type_detection';
import { Query, TimeRange } from './types';
import './index.scss';

const intitialQuery = (language: LanguageType, dataset: string) => ({
  query: '',
  prompt: '',
  language,
  dataset,
});

const QueryPanel = () => {
  const [lineCount, setLineCount] = useState<number | undefined>(undefined);
  const [isRecentQueryVisible, setIsRecentQueryVisible] = useState(false);
  const languageTypeRef = useRef<LanguageType>('nl'); // Default to PPL
  const [isDualEditor, setIsDualEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPromptReadOnly, setIsPromptReadOnly] = useState(false);
  const [isEditorReadOnly, setIsEditorReadOnly] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<Query>(
    intitialQuery(languageTypeRef.current, 'test')
  );

  const onQuerystringChange = (value: string, isPrompt: boolean) => {
    const query = {
      ...currentQuery,
    };
    if (isPrompt) {
      query.prompt = value;
    } else {
      query.query = value;
    }
    setCurrentQuery(query);
  };

  const detectLanguageType = debounce((query) => {
    const detector = new QueryTypeDetector();
    const result = detector.detect(query);
    languageTypeRef.current = result.type;

    setCurrentQuery((prevQuery) => ({
      ...prevQuery,
      language: result.type,
    }));
  }, 500); // Adjust debounce time as needed

  const onPromptChange = (value: string) => {
    detectLanguageType(value);
    onQuerystringChange(value, true);

    // If not dual editor and prompt contains PPL, set line count
    if (!isDualEditor && value.trim()) {
      const lines = value.split('\n').length;
      setLineCount(lines > 1 || value.trim() ? lines : undefined);
    } else if (!isDualEditor) {
      setLineCount(undefined);
    }
  };

  const onQueryChange = (value: string) => {
    onQuerystringChange(value, false);

    // In dual editor mode, use query editor's line count if there is PPL
    if (isDualEditor && value.trim()) {
      const lines = value.split('\n').length;
      setLineCount(lines > 1 || value.trim() ? lines : undefined);
    } else {
      setLineCount(undefined);
    }
  };

  const handleQueryRun = async (
    queryString?: string | { [key: string]: any },
    timeRange?: TimeRange
  ) => {
    onRun();
    setIsPromptReadOnly(true);
  };

  const onRun = async () => {
    // TODO: Implement the actual run logic here
    setIsLoading(true); // Set loading to true
    await new Promise((resolve) => setTimeout(resolve, 3000)); // 3-second delay mock
    setIsLoading(false);
  };

  const handleClearEditor = () => {
    setIsDualEditor(false);
    setIsEditorReadOnly(false);
    setIsPromptReadOnly(false);
    setCurrentQuery(intitialQuery('nl', 'test'));
  };

  const handlePromptRun = async (queryString?: string | { [key: string]: any }) => {
    onRun();
    const detectedLang = languageTypeRef.current;

    if (detectedLang === 'nl') {
      // TODO: Call NL API to generate PPL query

      setIsDualEditor(true);
      setCurrentQuery((prevQuery) => ({
        ...prevQuery,
        query: 'source=test\n| where state=CA and year=2023\n| sort=asc',
      }));
      // Todo: update query object with  generated ppl query
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
    <div className="query-container">
      <QueryPanelLayout
        footer={
          <QueryEditorFooter
            isDualEditor={isDualEditor}
            isLoading={isLoading}
            languageType={currentQuery.language}
            handleRunClick={handleRunClick}
            handleRecentClick={handleRecentClick}
            noInput={noInput}
            lineCount={lineCount}
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
          handlePromptEdit={handlePromptEdit}
          handleQueryEdit={handleQueryEdit}
          handleQueryRun={handleQueryRun}
          handlePromptRun={handlePromptRun}
          handleClearEditor={handleClearEditor}
        />
      </QueryPanelLayout>
      {isRecentQueryVisible && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 1000,
          }}
        >
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
