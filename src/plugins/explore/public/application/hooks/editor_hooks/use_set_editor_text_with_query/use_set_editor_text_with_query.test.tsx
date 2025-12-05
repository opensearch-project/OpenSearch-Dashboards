/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';

const mockSetEditorText = jest.fn();
const mockDispatch = jest.fn();

jest.mock('../use_set_editor_text', () => ({
  useSetEditorText: () => mockSetEditorText,
}));

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock('../../../utils/state_management/slices', () => ({
  setEditorMode: jest.fn((mode) => ({ type: 'SET_EDITOR_MODE', payload: mode })),
}));

jest.mock('../../../utils/state_management/types', () => ({
  EditorMode: {
    Query: 'query',
  },
}));

import { useSetEditorTextWithQuery } from './use_set_editor_text_with_query';
import { EditorMode } from '../../../utils/state_management/types';
import { setEditorMode } from '../../../utils/state_management/slices';

describe('useSetEditorTextWithQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set editor text and dispatch editor mode with string value', () => {
    const { result } = renderHook(() => useSetEditorTextWithQuery());
    const setEditorTextWithQuery = result.current;

    const testText = 'new query text';
    setEditorTextWithQuery(testText);

    expect(mockSetEditorText).toHaveBeenCalledWith(testText);
    expect(mockDispatch).toHaveBeenCalledWith(setEditorMode(EditorMode.Query));

    expect(mockSetEditorText).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it('should set editor text and dispatch editor mode with callback function', () => {
    const { result } = renderHook(() => useSetEditorTextWithQuery());
    const setEditorTextWithQuery = result.current;

    const callbackFn = (prev: string) => `${prev} modified`;
    setEditorTextWithQuery(callbackFn);

    expect(mockSetEditorText).toHaveBeenCalledWith(callbackFn);
    expect(mockDispatch).toHaveBeenCalledWith(setEditorMode(EditorMode.Query));

    expect(mockSetEditorText).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });
});
