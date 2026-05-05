/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { useErrorDecorations } from './use_error_decorations';
import { QueryExecutionStatus } from '../../../../application/utils/state_management/types';

// Mock monaco module
jest.mock('@osd/monaco', () => ({
  monaco: {
    editor: {
      MinimapPosition: {
        Inline: 1,
      },
      OverviewRulerLane: {
        Full: 7,
      },
    },
    languages: {
      CompletionItemKind: {
        Function: 1,
        Operator: 2,
        Module: 3,
        Keyword: 4,
      },
    },
    Range: jest.fn().mockImplementation(function (startLine, startCol, endLine, endCol) {
      this.startLineNumber = startLine;
      this.startColumn = startCol;
      this.endLineNumber = endLine;
      this.endColumn = endCol;
    }),
  },
}));

// Mock monaco editor
const mockCreateDecorationsCollection = jest.fn();
const mockClear = jest.fn();
const mockGetValue = jest.fn();

const createMockEditor = () => ({
  createDecorationsCollection: mockCreateDecorationsCollection.mockReturnValue({
    clear: mockClear,
    set: jest.fn(),
  }),
  getModel: jest.fn().mockReturnValue({
    getValue: mockGetValue,
    findMatches: jest.fn().mockReturnValue([
      {
        range: {
          startLineNumber: 1,
          startColumn: 15,
          endLineNumber: 1,
          endColumn: 28,
        },
      },
    ]),
  }),
});

// Create mock store with query status
const createMockStore = (queryStatus: any) =>
  configureStore({
    reducer: {
      queryEditor: () => ({
        overallQueryStatus: queryStatus,
        queryStatusMap: {},
      }),
    },
  });

describe('useErrorDecorations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetValue.mockReturnValue('SELECT * FROM logs');
  });

  it('should clear decorations when there is no error', () => {
    const store = createMockStore({
      status: QueryExecutionStatus.SUCCESS,
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(Provider, { store }, children);

    const { result } = renderHook(() => useErrorDecorations(), { wrapper });
    const editor = createMockEditor();

    result.current.updateErrorDecorations(editor as any);

    expect(mockClear).toHaveBeenCalled();
  });

  it('should clear decorations when error has no position context', () => {
    const store = createMockStore({
      status: QueryExecutionStatus.ERROR,
      error: {
        message: {
          reason: 'Query failed',
          details: 'Syntax error',
        },
        errorBody: {
          error: {
            type: 'SyntaxCheckException',
            reason: 'Syntax error',
          },
        },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(Provider, { store }, children);

    const { result } = renderHook(() => useErrorDecorations(), { wrapper });
    const editor = createMockEditor();

    result.current.updateErrorDecorations(editor as any);

    expect(mockClear).toHaveBeenCalled();
  });

  it('should handle null editor gracefully', () => {
    const store = createMockStore({
      status: QueryExecutionStatus.ERROR,
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(Provider, { store }, children);

    const { result } = renderHook(() => useErrorDecorations(), { wrapper });

    expect(() => result.current.updateErrorDecorations(null)).not.toThrow();
  });

  it('should create decorations when error has position context', () => {
    const store = createMockStore({
      status: QueryExecutionStatus.ERROR,
      error: {
        message: {
          reason: 'Field not found',
          details: 'Unknown field: invalid_field',
        },
        errorBody: {
          error: {
            type: 'SemanticCheckException',
            reason: 'Field not found',
            context: {
              query_pos: {
                line: 1,
                column: 15,
              },
              requested_field: 'invalid_field',
              available_fields: ['field1', 'field2'],
            },
          },
        },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(Provider, { store }, children);

    mockGetValue.mockReturnValue('SELECT invalid_field FROM logs');

    const { result } = renderHook(() => useErrorDecorations(), { wrapper });
    const editor = createMockEditor();

    result.current.updateErrorDecorations(editor as any);

    expect(mockCreateDecorationsCollection).toHaveBeenCalled();
    expect(mockClear).not.toHaveBeenCalled();
  });

  it('should reuse decoration collection for the same editor', () => {
    const store = createMockStore({
      status: QueryExecutionStatus.ERROR,
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(Provider, { store }, children);

    const { result } = renderHook(() => useErrorDecorations(), { wrapper });
    const editor = createMockEditor();

    result.current.updateErrorDecorations(editor as any);
    result.current.updateErrorDecorations(editor as any);

    expect(mockCreateDecorationsCollection).toHaveBeenCalledTimes(1);
  });

  it('should create new collection when editor changes', () => {
    const store = createMockStore({
      status: QueryExecutionStatus.ERROR,
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(Provider, { store }, children);

    const { result } = renderHook(() => useErrorDecorations(), { wrapper });
    const editor1 = createMockEditor();
    const editor2 = createMockEditor();

    result.current.updateErrorDecorations(editor1 as any);
    result.current.updateErrorDecorations(editor2 as any);

    expect(mockCreateDecorationsCollection).toHaveBeenCalledTimes(2);
  });
});
