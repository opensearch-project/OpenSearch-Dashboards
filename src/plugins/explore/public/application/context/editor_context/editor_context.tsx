/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, FC, MutableRefObject, useRef } from 'react';
import type { monaco } from '@osd/monaco';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
type EditorRef = MutableRefObject<IStandaloneCodeEditor | null>;

export type InternalEditorContextValue = EditorRef;

/**
 * Provides editor refs as well as editor-related state
 *
 * You can access these values via the hooks in the hooks directory.
 */
export const EditorContext = createContext<InternalEditorContextValue>({
  current: null,
});

/**
 * Editor Context Provider
 *
 * Globally manages the editors so that we have access to them throughout the page.
 * Since a ref is not serializable, we cannot store it in the Redux store.
 */
// @ts-expect-error TS2339 TODO(ts-error): fixme
export const EditorContextProvider: FC = ({ children }) => {
  const editorRef = useRef<IStandaloneCodeEditor | null>(null);

  return <EditorContext.Provider value={editorRef}>{children}</EditorContext.Provider>;
};
