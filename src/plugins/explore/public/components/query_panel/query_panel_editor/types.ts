/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { MutableRefObject } from 'react';
import { CoreStart } from 'src/core/public';
import './query_panel_editor.scss';

import type { DataPublicPluginStart } from '../../../../../data/public';
import type {
  NotificationsStart,
  KeyboardShortcutStart,
  Capabilities,
  IUiSettingsClient,
} from '../../../../../../core/public';
import {
  QueryState,
  QueryEditorState,
} from '../../../application/in_context_vis_editor/query_builder/query_builder';
import { EditorMode } from '../../../application/utils/state_management/types';

export type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;

/**
 * A consumer-provided completion extension. Each extension contributes its own trigger
 * characters and completion items, which are merged into the editor's built-in query
 * suggestions. This keeps the shared editor agnostic of any specific feature.
 */
export interface EditorCompletionProvider {
  /** Extra characters that should (re)trigger completion for this extension. */
  triggerCharacters?: string[];
  /**
   * Contribute completion items for the current Monaco context. Called at completion
   * time, so implementations may read the latest external state directly.
   */
  provideCompletionItems: (
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext,
    token: monaco.CancellationToken
  ) => monaco.languages.CompletionItem[] | Promise<monaco.languages.CompletionItem[]>;
}

export type PartialQueryEditorState = Pick<
  QueryEditorState,
  'isQueryEditorDirty' | 'editorMode' | 'promptModeIsAvailable'
>;

export interface QueryPanelRequiredServices {
  keyboardShortcut?: KeyboardShortcutStart;
  data: DataPublicPluginStart;
  notifications: NotificationsStart;
  appName: string;
  capabilities: Capabilities;
  uiSettings: IUiSettingsClient;
  http: CoreStart['http'];
}

export interface QueryEditorProps {
  // Services
  services: QueryPanelRequiredServices;

  // states
  queryState: QueryState;
  queryEditorState: PartialQueryEditorState;

  // Main Methods
  onRun: (queryString: string) => void;
  // onSwitchMode:
  switchEditorMode: (editorMode: EditorMode) => void;
  handleEditorChange: (updates: Partial<PartialQueryEditorState>) => void; // edit mode change

  // Editor ref
  editorRef: MutableRefObject<IStandaloneCodeEditor | null>;

  focusShortcutId?: string;

  // compute editor container height
  getEditorContainerHeight?: (domNode: HTMLElement | null) => number;

  /**
   * Optional completion extensions. Each contributes its own trigger characters and
   * completion items, merged into the editor's built-in suggestions. Lets consumers
   * inject domain-specific completions without the shared editor knowing about any
   * particular feature.
   */
  completionProviders?: EditorCompletionProvider[];
}
