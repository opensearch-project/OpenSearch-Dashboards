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
  editorRef: EditorRef;
  editorText: string;
  setEditorText: Dispatch<SetStateAction<string>>;
  editorIsFocused: boolean;
  setEditorIsFocused: Dispatch<SetStateAction<boolean>>;
}

/**
 * Provides editor refs as well as editor-related state
 *
 * You can access these values via the hooks in the hooks directory.
 * Why so many hooks? We have specific hooks that get specific parts of this only to maximize performance,
 * because text values frequently updates
 */
export const EditorContext = createContext<InternalEditorContextValue>({
  editorRef: { current: null },
  editorText: '',
  setEditorText: () => {},
  editorIsFocused: false,
  setEditorIsFocused: () => {},
});

/**
 * Editor Context Provider
 *
 * Globally manages the editors so that we have access to them throughout the page.
 * Since a ref is not serializable, we cannot store it in the Redux store.
 */
export const EditorContextProvider: FC = ({ children }) => {
  const queryString = useSelector(selectQueryString);
  const editorRef = useRef<IStandaloneCodeEditor | null>(null);
  const [editorText, setEditorText] = useState<string>(queryString);
  const [editorIsFocused, setEditorIsFocused] = useState<boolean>(false);

  const contextValue = useMemo(
    () => ({
      editorRef,
      editorText,
      setEditorText,
      editorIsFocused,
      setEditorIsFocused,
    }),
    [editorIsFocused, editorText]
  );

  return <EditorContext.Provider value={contextValue}>{children}</EditorContext.Provider>;
};
