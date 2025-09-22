/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, FC, MutableRefObject, useRef, useEffect } from 'react';
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
export const EditorContextProvider: FC = ({ children }) => {
  const editorRef = useRef<IStandaloneCodeEditor | null>(null);

  // Make editor reference globally available for MCP integration
  useEffect(() => {
    if (!(window as any).exploreServices) {
      (window as any).exploreServices = {};
    }
    (window as any).exploreServices.editorRef = editorRef;
    // eslint-disable-next-line no-console
    console.log('🎯 Editor reference made globally available for MCP integration');

    return () => {
      // Cleanup on unmount
      if ((window as any).exploreServices) {
        delete (window as any).exploreServices.editorRef;
      }
    };
  }, [editorRef]);

  return <EditorContext.Provider value={editorRef}>{children}</EditorContext.Provider>;
};
