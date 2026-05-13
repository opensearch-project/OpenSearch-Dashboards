/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderHook } from '@testing-library/react';
import { QueryPanelProvider, useQueryPanelContext, QueryPanelProps } from './query_panel_context';
import { EditorMode } from '../../../utils/state_management/types';

jest.mock('../../query_builder/query_builder', () => ({
  SupportLanguageType: { ppl: 'PPL', promQL: 'PROMQL', ai: 'AI' },
}));

const mockGetEditor = jest.fn();
const mockSetEditor = jest.fn();

const buildProps = (overrides: Partial<QueryPanelProps> = {}): QueryPanelProps => ({
  services: {
    data: {} as any,
    notifications: { toasts: { addError: jest.fn() } } as any,
    appName: 'explore',
  },
  queryState: { query: '', language: 'PPL', dataset: undefined },
  queryEditorState: {
    editorMode: EditorMode.Query,
    promptModeIsAvailable: false,
    promptToQueryIsLoading: false,
    isQueryEditorDirty: false,
    dateRange: undefined,
    languageType: 'PPL' as any,
  },
  onQuerySubmit: jest.fn(),
  handleQueryChange: jest.fn(),
  handleEditorChange: jest.fn(),
  showLanguageToggle: true,
  showDatasetSelect: true,
  showSaveQueryButton: false,
  getEditor: mockGetEditor,
  setEditor: mockSetEditor,
  ...overrides,
});

describe('QueryPanelContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEditor.mockReturnValue(null);
  });

  describe('useQueryPanelContext', () => {
    it('returns context value ', () => {
      const props = buildProps();
      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <QueryPanelProvider value={props}>{children}</QueryPanelProvider>
      );

      const { result } = renderHook(() => useQueryPanelContext(), { wrapper });

      expect(result.current.queryState).toEqual(props.queryState);
      expect(result.current.queryEditorState).toEqual(props.queryEditorState);
      expect(result.current.showLanguageToggle).toBe(true);
      expect(result.current.showDatasetSelect).toBe(true);
      expect(result.current.showSaveQueryButton).toBe(false);
    });

    it('provides editorOperations derived from getEditor/setEditor', () => {
      const props = buildProps();
      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <QueryPanelProvider value={props}>{children}</QueryPanelProvider>
      );

      const { result } = renderHook(() => useQueryPanelContext(), { wrapper });

      expect(result.current.editorOperations).toBeDefined();
      expect(typeof result.current.editorOperations.getEditorRef).toBe('function');
      expect(typeof result.current.editorOperations.setEditorRef).toBe('function');
      expect(typeof result.current.editorOperations.focusEditor).toBe('function');
      expect(typeof result.current.editorOperations.getEditorText).toBe('function');
      expect(typeof result.current.editorOperations.setEditorText).toBe('function');
      expect(typeof result.current.editorOperations.clearEditor).toBe('function');
      expect(typeof result.current.editorOperations.switchEditorMode).toBe('function');
    });
  });

  it('getEditorRef delegates to getEditor callback', () => {
    const mockEditor = { getValue: jest.fn() } as any;
    mockGetEditor.mockReturnValue(mockEditor);

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <QueryPanelProvider value={buildProps()}>{children}</QueryPanelProvider>
    );

    const { result } = renderHook(() => useQueryPanelContext(), { wrapper });
    const editor = result.current.editorOperations.getEditorRef();

    expect(mockGetEditor).toHaveBeenCalled();
    expect(editor).toBe(mockEditor);
  });

  it('setEditorRef delegates to setEditor callback', () => {
    const mockEditor = {} as any;
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <QueryPanelProvider value={buildProps()}>{children}</QueryPanelProvider>
    );

    const { result } = renderHook(() => useQueryPanelContext(), { wrapper });
    result.current.editorOperations.setEditorRef(mockEditor);
    expect(mockSetEditor).toHaveBeenCalledWith(mockEditor);
  });
  it('passes services through context', () => {
    const props = buildProps({
      services: { data: { test: true } as any, notifications: {} as any, appName: 'test-app' },
    });
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <QueryPanelProvider value={props}>{children}</QueryPanelProvider>
    );

    const { result } = renderHook(() => useQueryPanelContext(), { wrapper });
    expect(result.current.services.appName).toBe('test-app');
  });

  it('passes supportedTypes through context', () => {
    const props = buildProps({ supportedTypes: ['INDEX_PATTERN', 'PROMETHEUS'] });
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <QueryPanelProvider value={props}>{children}</QueryPanelProvider>
    );

    const { result } = renderHook(() => useQueryPanelContext(), { wrapper });
    expect(result.current.supportedTypes).toEqual(['INDEX_PATTERN', 'PROMETHEUS']);
  });

  it('passes callback props through context', () => {
    const onQuerySubmit = jest.fn();
    const handleQueryChange = jest.fn();
    const handleEditorChange = jest.fn();
    const props = buildProps({ onQuerySubmit, handleQueryChange, handleEditorChange });
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <QueryPanelProvider value={props}>{children}</QueryPanelProvider>
    );

    const { result } = renderHook(() => useQueryPanelContext(), { wrapper });
    expect(result.current.onQuerySubmit).toBe(onQuerySubmit);
    expect(result.current.handleQueryChange).toBe(handleQueryChange);
    expect(result.current.handleEditorChange).toBe(handleEditorChange);
  });
});
