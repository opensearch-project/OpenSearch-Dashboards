/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  Dispatch,
  FC,
  MutableRefObject,
  SetStateAction,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { monaco } from '@osd/monaco';
import { useSelector } from 'react-redux';
import { selectQueryString } from '../../utils/state_management/selectors';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
type EditorRef = MutableRefObject<IStandaloneCodeEditor | null>;

export interface InternalEditorContextValue {
  topEditorRef: EditorRef;
  bottomEditorRef: EditorRef;
  topEditorText: string;
  setTopEditorText: Dispatch<SetStateAction<string>>;
  bottomEditorText: string;
  setBottomEditorText: Dispatch<SetStateAction<string>>;
}

/**
 * Provides the text values, setText functions, as well as the refs of the queryEditors
 *
 * You can access these values via the hooks in the hooks directory.
 * Why so many hooks? We have specific hooks that get specific parts of this only to maximize performance,
 * because text values frequently updates
 */
export const EditorContext = createContext<InternalEditorContextValue>({
  topEditorRef: { current: null },
  bottomEditorRef: { current: null },
  topEditorText: '',
  setTopEditorText: () => {},
  bottomEditorText: '',
  setBottomEditorText: () => {},
});

/**
 * Editor Context Provider
 *
 * Globally manages the dual editors so that we have access to them throughout the page
 */
export const EditorContextProvider: FC = ({ children }) => {
  const queryString = useSelector(selectQueryString);
  const topEditorRef = useRef<IStandaloneCodeEditor | null>(null);
  const bottomEditorRef = useRef<IStandaloneCodeEditor | null>(null);
  const [topEditorText, setTopEditorText] = useState<string>(queryString);
  const [bottomEditorText, setBottomEditorText] = useState<string>('');

  const contextValue = useMemo(
    () => ({
      topEditorRef,
      bottomEditorRef,
      topEditorText,
      bottomEditorText,
      setTopEditorText,
      setBottomEditorText,
    }),
    [topEditorText, bottomEditorText]
  );

  return <EditorContext.Provider value={contextValue}>{children}</EditorContext.Provider>;
};
