/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { monaco } from '@osd/monaco';
import { QueryPanelLayout } from './layout';
import { EditorStack } from './components/editor_stack';
import { QueryEditorFooter } from './components/footer/index';
import { LanguageType } from './components/editor_stack/shared';
import { debounce } from 'lodash';
import { QueryTypeDetector } from './utils/typeDetection';
import { Query } from './types';
import './index.scss';

const intitialQuery = (language: LanguageType, dataset: string) => ({
  query: '',
  prompt: '',
  language: language,
  dataset: dataset,
});

const QueryPanel = () => {
  const [lineCount, setLineCount] = useState<number | undefined>(undefined);
  // const [isRecentQueryVisible, setIsRecentQueryVisible] = useState(false);
  const inputQueryRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
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
    console.log(query, 'query');
    const detector = new QueryTypeDetector();
    const result = detector.detect(query);
    languageTypeRef.current = result.type;
    console.log('language changed:', result.type);
    setCurrentQuery((prevQuery) => ({
      ...prevQuery,
      language: result.type,
    }));
  }, 500); // Adjust debounce time as needed

  const onPromptChange = (value: string) => {
    // console.log('Prompt changed:', value);
    detectLanguageType(value);
    onQuerystringChange(value, true);
  };

  const onQueryChange = (value: string) => {
    // console.log('Query changed:', value);
    onQuerystringChange(value, false);
    if (!inputQueryRef.current) return;

    const currentLineCount = inputQueryRef.current.getModel()?.getLineCount();
    if (lineCount === currentLineCount) return;
    setLineCount(currentLineCount);
  };

  const handleQueryRun = async (querystring?: string | undefined) => {
    // console.log('Running queryString when enter:', querystring);
    setIsLoading(true); // Set loading to true
    await new Promise((resolve) => setTimeout(resolve, 3000)); // 3-second delay mock
    // Add logic to run the query
    setIsPromptReadOnly(true);
    setIsLoading(false);
  };

  const handleClearEditor = () => {
    setIsDualEditor(false);
    setIsEditorReadOnly(false);
    setIsPromptReadOnly(false);
    setCurrentQuery(intitialQuery('nl', 'test'));
  };

  const handlePromptRun = async (querystring?: string | undefined) => {
    // console.log(querystring, 'querystring');
    setIsLoading(true); // Set loading to true
    await new Promise((resolve) => setTimeout(resolve, 3000)); // 3-second delay mock

    const detectedLang = languageTypeRef.current;

    if (detectedLang === 'nl') {
      // console.log('Detected NL, calling NL API...');

      // Call NL Api
      // on successful ppl generated

      setIsDualEditor(true);
      setCurrentQuery((prevQuery) => ({
        ...prevQuery,
        query: 'source=test\n| where state=CA and year=2023\n| sort=asc',
      }));
      // update query object with  generated ppl query
    } else {
      setIsDualEditor(false);
      setCurrentQuery((prevQuery) => ({
        ...prevQuery,
        query: '',
      }));
    }
    setIsLoading(false); // Set loading to false after the delay
  };

  const handlePromptEdit = () => {
    setIsEditorReadOnly(true);
    setIsPromptReadOnly(false);
  };

  const handleQueryEdit = () => {
    setIsEditorReadOnly(false);
  };

  const handleRunClick = () => {
    if (isDualEditor) {
      handleQueryRun(currentQuery.query);
    } else {
      handlePromptRun(currentQuery.prompt);
    }
  };

  return (
    <QueryPanelLayout
      footer={
        <QueryEditorFooter
          isDualEditor={isDualEditor}
          isLoading={isLoading}
          languageType={currentQuery.language}
          handleRunClick={handleRunClick}
          noInput={!currentQuery.query && !currentQuery.prompt}
        />
      }
    >
      <EditorStack
        isDualEditor={isDualEditor}
        isPromptReadOnly={isPromptReadOnly}
        isEditorReadOnly={isEditorReadOnly}
        queryString={currentQuery.query}
        languageType={languageTypeRef.current}
        prompt={currentQuery.prompt}
        onPromptChange={onPromptChange}
        onQueryChange={onQueryChange}
        handlePromptEdit={handlePromptEdit}
        handleQueryEdit={handleQueryEdit}
        handleQueryRun={handleQueryRun}
        handlePromptRun={handlePromptRun}
        handleClearEditor={handleClearEditor}
      />
    </QueryPanelLayout>
  );
};

export { QueryPanel };
