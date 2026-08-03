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
}
