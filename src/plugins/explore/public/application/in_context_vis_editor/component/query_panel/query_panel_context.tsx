/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext } from 'react';
import { monaco } from '@osd/monaco';
import { useEditorOperations } from '../../hooks/use_editor_operations';
import type { DataPublicPluginStart } from '../../../../../../data/public';
import type {
  NotificationsStart,
  KeyboardShortcutStart,
  Capabilities,
} from '../../../../../../../core/public';
import {
  QueryState,
  QueryEditorState,
  SupportLanguageType,
} from '../../query_builder/query_builder';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;

type PartialQueryEditorState = Omit<QueryEditorState, 'userInitiatedQuery' | 'queryStatus'> &
  Partial<Pick<QueryEditorState, 'queryStatus'>>;

export interface QueryPanelProps {
  // Services
  services: {
    keyboardShortcut?: KeyboardShortcutStart;
    data: DataPublicPluginStart;
    notifications: NotificationsStart;
    appName: string;
    capabilities: Capabilities;
  };

  // Query states
  queryState: QueryState;
  queryEditorState: PartialQueryEditorState;

  // Main Methods
  onQuerySubmit: () => Promise<void>;
  handleQueryChange: (updates: Partial<QueryState>) => void;
  handleEditorChange: (updates: Partial<PartialQueryEditorState>) => void;

  // language Toggle
  showLanguageToggle: boolean;
  handleLanguageTypeChange?: (languageType: SupportLanguageType | undefined) => void;

  // dataset select
  showDatasetSelect: boolean;

  // Save Query button
  showSaveQueryButton: boolean;

  // Editor — the parent owns the editor ref (e.g. QueryBuilder)
  getEditor: () => IStandaloneCodeEditor | null;
  setEditor: (editor: IStandaloneCodeEditor | null) => void;

  // dataset supported types
  supportedTypes?: string[];
}

export interface QueryPanelFullProps extends QueryPanelProps {
  editorOperations: ReturnType<typeof useEditorOperations>;
}

const QueryPanelContext = createContext<QueryPanelFullProps | null>(null);

/**
 * Provider for QueryPanel context
 */
export const QueryPanelProvider: React.FC<{
  value: QueryPanelProps;
  children: React.ReactNode;
}> = ({ value, children }) => {
  const editorOperations = useEditorOperations({
    getEditor: value.getEditor,
    setEditor: value.setEditor,
  });
  return (
    <QueryPanelContext.Provider value={{ ...value, editorOperations }}>
      {children}
    </QueryPanelContext.Provider>
  );
};

export const useQueryPanelContext = (): QueryPanelFullProps => {
  const context = useContext(QueryPanelContext);
  if (!context) {
    throw new Error('useQueryPanelContext must be used within QueryPanelProvider');
  }
  return context;
};
