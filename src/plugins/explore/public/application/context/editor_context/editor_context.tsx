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
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { monaco } from '@osd/monaco';
import { useSelector } from 'react-redux';
import { selectEditorMode, selectQueryString } from '../../utils/state_management/selectors';
import { EditorMode } from '../../utils/state_management/types';

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
 * Return type for useEditorContext()
 */
export interface EditorContextValue {
  /**
   * Context-sensitive currently focused editor text
   */
  editorText: string;
  /**
   * Context-sensitive set currently focused editor text
   */
  setEditorText: Dispatch<SetStateAction<string>>;
  /**
   * Clears both editors
   */
  clearEditors: Dispatch<SetStateAction<void>>;
  /**
   * Clears bottom editor and sets top editor. Used when you want to go from dual editor to single
   */
  clearEditorsAndSetText: Dispatch<SetStateAction<string>>;
  /**
   * This is only used when you enter a prompt and want to get the received query into the bottom editor.
   */
  setBottomEditorText: Dispatch<SetStateAction<string>>;
  /**
   * Gives the query string. Only used when you want to run query
   */
  query: string;
  /**
   * Gives the prompt string
   */
  prompt: string;
}

const EditorContext = createContext<InternalEditorContextValue>({
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

export const useEditorContext = (): EditorContextValue => {
  const context = useContext(EditorContext);
  const editorMode = useSelector(selectEditorMode);

  if (!context) {
    throw new Error('useEditorContext must be used within an EditorContextProvider');
  }
  const { bottomEditorText, topEditorText, setBottomEditorText, setTopEditorText } = context;

  const editorText = useMemo(() => {
    if (editorMode === EditorMode.DualQuery) {
      return bottomEditorText;
    }
    return topEditorText;
  }, [editorMode, bottomEditorText, topEditorText]);

  const setEditorText = useMemo(() => {
    if (editorMode === EditorMode.DualQuery) {
      return setBottomEditorText;
    }
    return setTopEditorText;
  }, [editorMode, setBottomEditorText, setTopEditorText]);

  const clearEditors = useCallback(() => {
    setBottomEditorText('');
    setTopEditorText('');
  }, [setBottomEditorText, setTopEditorText]);

  const clearEditorsAndSetText = useCallback(
    (textOrCallback: SetStateAction<string>) => {
      setBottomEditorText('');
      setTopEditorText(textOrCallback);
    },
    [setBottomEditorText, setTopEditorText]
  );

  const query = useMemo(() => {
    if (editorMode === EditorMode.SingleQuery) {
      return topEditorText;
    }

    return bottomEditorText;
  }, [editorMode, topEditorText, bottomEditorText]);

  const prompt = useMemo(() => {
    if (editorMode === EditorMode.SingleQuery) {
      return '';
    }

    return topEditorText;
  }, [editorMode, topEditorText]);

  return useMemo(
    () => ({
      editorText,
      setEditorText,
      clearEditors,
      clearEditorsAndSetText,
      setBottomEditorText,
      query,
      prompt,
    }),
    [
      editorText,
      setEditorText,
      clearEditors,
      clearEditorsAndSetText,
      setBottomEditorText,
      query,
      prompt,
    ]
  );
};

// This is a hook that should only be used by TopEditor and BottomEditor
export const useEditorContextByEditorComponent = (): InternalEditorContextValue => {
  const context = useContext(EditorContext);

  if (!context) {
    throw new Error('useEditorContext must be used within an EditorContextProvider');
  }

  return context;
};
