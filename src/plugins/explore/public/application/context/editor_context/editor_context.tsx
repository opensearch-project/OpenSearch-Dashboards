/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, FC, MutableRefObject, useMemo, useRef, useState } from 'react';
import type { monaco } from '@osd/monaco';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
type EditorRef = MutableRefObject<IStandaloneCodeEditor | null>;

interface EditorContextValue {
  topEditorRef: EditorRef;
  bottomEditorRef: EditorRef;
  topEditorText: string;
  bottomEditorText: string;
}

const EditorContext = createContext<EditorContextValue>();

/**
 * Editor Context Provider
 *
 * Globally manages the dual editors so that we have access to them throughout the page
 */
export const EditorContextProvider: FC = ({ children }) => {
  const topEditorRef = useRef<IStandaloneCodeEditor | null>(null);
  const bottomEditorRef = useRef<IStandaloneCodeEditor | null>(null);
  const [topEditorText, setTopEditorText] = useState<string>('');
  const [bottomEditorText, setBottomEditorText] = useState<string>('');

  const contextValue = useMemo(() => ({
    topEditorRef,
    bottomEditorRef,
    topEditorText,
    bottomEditorText,
  }));
};
