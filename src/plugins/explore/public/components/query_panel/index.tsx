/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { debounce } from 'lodash';
import { QueryPanelLayout } from './layout';
import { EditorStack } from './components/editor_stack';
import { QueryEditorFooter } from './components/footer/index';
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
  const [lineCount, setLineCount] = useState<number | undefined>(undefined);
  const [isRecentQueryVisible, setIsRecentQueryVisible] = useState(false);
  const languageTypeRef = useRef<LanguageType>(LanguageType.Natural); // Default to PPL
  const [isDualEditor, setIsDualEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPromptReadOnly, setIsPromptReadOnly] = useState(false);
  const [isEditorReadOnly, setIsEditorReadOnly] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<Query>(
    intitialQuery(languageTypeRef.current, 'test')
  );

  const onQuerystringChange = React.useCallback((value: string, isPrompt: boolean) => {
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

  const detectLanguageType = debounce((query) => {
    const detector = new QueryTypeDetector();
    const result = detector.detect(query);
    languageTypeRef.current = result.type;

    setCurrentQuery((prevQuery) => ({
      ...prevQuery,
      language: result.type,
    }));
  }, 500); // Adjust debounce time as needed

  const onPromptChange = React.useCallback(
    (value: string) => {
      detectLanguageType(value);
      onQuerystringChange(value, true);

      // If not dual editor and prompt contains PPL, set line count
      if (!isDualEditor && value.trim()) {
        const lines = value.split('\n').length;
        setLineCount(lines > 1 || value.trim() ? lines : undefined);
      } else if (!isDualEditor) {
        setLineCount(undefined);
      }
    },
    [isDualEditor, detectLanguageType, onQuerystringChange]
  );

  const onQueryChange = React.useCallback(
    (value: string) => {
      onQuerystringChange(value, false);

      // In dual editor mode, use query editor's line count if there is PPL
      if (isDualEditor && value.trim()) {
        const lines = value.split('\n').length;
        setLineCount(lines > 1 || value.trim() ? lines : undefined);
      } else {
        setLineCount(undefined);
      }
    },
    [isDualEditor, onQuerystringChange]
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
    setLineCount(undefined);
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
      // TODO: Update query object with  generated ppl query
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
    <div className="queryContainer">
      <QueryPanelLayout
        footer={
          <QueryEditorFooter
            isDualEditor={isDualEditor}
            isLoading={isLoading}
            languageType={currentQuery.language}
            onRunClick={handleRunClick}
            onRecentClick={handleRecentClick}
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
          onPromptEdit={handlePromptEdit}
          onQueryEdit={handleQueryEdit}
          onQueryRun={handleQueryRun}
          onPromptRun={handlePromptRun}
          onClearEditor={handleClearEditor}
        />
      </QueryPanelLayout>
      {isRecentQueryVisible && (
        <div className="recentQueriesContainer">
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
