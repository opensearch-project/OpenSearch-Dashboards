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

interface Query {
  query: string; // The query string value
  prompt: string;
  language: string; // The language of the query (e.g., 'ppl', 'natural-language', etc.)
  dataset: string;
}

const QueryPanel = () => {
  const [lineCount, setLineCount] = useState<number | undefined>(undefined);
  const [isRecentQueryVisible, setIsRecentQueryVisible] = useState(false);
  const inputQueryRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [languageType, setLanguageType] = useState<LanguageType>('ppl'); // Default to PPL
  const [isDualEditor, setIsDualEditor] = useState(false); // Default to PPL
  const [currentQuery, setCurrentQuery] = useState<Query>({
    query: '',
    prompt: '',
    language: languageType,
    dataset: 'test',
  });

  const onQueryStringChange = (value: string, isPrompt: boolean) => {
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
    setLanguageType(result.type);
    // Update UI with result.type or set state
  }, 300); // Adjust debounce time as needed

  const onPromptChange = (value: string) => {
    console.log('Prompt changed:', value);
    detectLanguageType(value);
    onQueryStringChange(value, true);
  };

  const onQueryChange = (value: string) => {
    console.log('Query changed:', value);
    onQueryStringChange(value, false);
    if (!inputQueryRef.current) return;

    const currentLineCount = inputQueryRef.current.getModel()?.getLineCount();
    if (lineCount === currentLineCount) return;
    setLineCount(currentLineCount);
  };

  const handleQueryRun = () => {
    console.log('Running query:', currentQuery.query);
    // Add logic to run the query
  };

  return (
    <QueryPanelLayout
      footer={
        <QueryEditorFooter
          isDualEditor={isDualEditor}
          languageType={languageType}
          handleQueryRun={handleQueryRun}
        />
      }
    >
      <EditorStack
        onPromptChange={onPromptChange}
        onQueryChange={onQueryChange}
        languageType={languageType}
        isDualEditor={isDualEditor}
      />
    </QueryPanelLayout>
  );
};

export { QueryPanel };
