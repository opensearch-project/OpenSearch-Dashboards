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

const QueryPanel = () => {
  const [lineCount, setLineCount] = useState<number | undefined>(undefined);
  // const [isRecentQueryVisible, setIsRecentQueryVisible] = useState(false);
  const inputQueryRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const languageTypeRef = useRef<LanguageType>('ppl'); // Default to PPL
  const [isDualEditor, setIsDualEditor] = useState(false); // Default to PPL
  const [currentQuery, setCurrentQuery] = useState<Query>({
    query: '',
    prompt: '',
    language: languageTypeRef.current,
    dataset: 'test',
  });

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
    console.log('Detected:', result.type, result.confidence.toFixed(2));
    languageTypeRef.current = result.type;
    setCurrentQuery((prevQuery) => ({
      ...prevQuery,
      language: result.type,
    }));
  }, 300); // Adjust debounce time as needed

  const onPromptChange = (value: string) => {
    console.log('Prompt changed:', value);
    detectLanguageType(value);
    onQuerystringChange(value, true);
  };

  const onQueryChange = (value: string) => {
    console.log('Query changed:', value);
    onQuerystringChange(value, false);
    if (!inputQueryRef.current) return;

    const currentLineCount = inputQueryRef.current.getModel()?.getLineCount();
    if (lineCount === currentLineCount) return;
    setLineCount(currentLineCount);
  };

  const handleQueryRun = (querystring?: string | undefined) => {
    console.log('Running queryString when enter:', querystring);
    console.log('Running query:', currentQuery.query);
    // Add logic to run the query
  };

  const handlePromptRun = (querystring?: string | undefined) => {
    const detectedLang = languageTypeRef.current;

    if (detectedLang === 'nl') {
      console.log('Detected NL, calling NL API...');
      // Call NL Api
      // on successful ppl gene3rated
      setIsDualEditor(true);
      setCurrentQuery((prevQuery) => ({
        ...prevQuery,
        query: 'source=test | where state=CA and year=2023 | sort=asc',
      }));
      // update query object with ppl query
    } else {
      setIsDualEditor(false);
      handleQueryRun(querystring);
    }
    // Add logic to run the query
  };

  return (
    <QueryPanelLayout
      footer={
        <QueryEditorFooter
          isDualEditor={isDualEditor}
          languageType={languageTypeRef.current}
          handleQueryRun={handleQueryRun}
        />
      }
    >
      <EditorStack
        onPromptChange={onPromptChange}
        onQueryChange={onQueryChange}
        languageType={languageTypeRef.current}
        isDualEditor={isDualEditor}
        handleQueryRun={handleQueryRun}
        handlePromptRun={handlePromptRun}
        queryString={currentQuery.query}
        prompt={currentQuery.prompt}
      />
    </QueryPanelLayout>
  );
};

export { QueryPanel };
