/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { useDispatch } from 'react-redux';
import { useSwitchLanguage } from './use_switch_language';
import { EditorMode } from '../../../utils/state_management/types';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

import { useEditorRef } from '../use_editor_ref';

jest.mock('../use_editor_ref', () => ({
  useEditorRef: jest.fn(),
}));

const mockUseEditorRef = useEditorRef as jest.MockedFunction<typeof useEditorRef>;

describe('useSwitchLanguage', () => {
  const mockDispatch = jest.fn();
  const mockEditorRef = {
    current: {
      getModel: jest.fn(() => ({
        getFullModelRange: jest.fn(() => ({ mock: 'range' })),
      })),
      setSelection: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    mockUseEditorRef.mockReturnValue(mockEditorRef as any);
  });

  it('should return a function', () => {
    const { result } = renderHook(() => useSwitchLanguage());

    expect(result.current).toBeInstanceOf(Function);
  });

  it('should dispatch setEditorMode to Prompt when called with Prompt mode', () => {
    const { result } = renderHook(() => useSwitchLanguage());

    result.current(EditorMode.Prompt);

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('setEditorMode'),
        payload: EditorMode.Prompt,
      })
    );
  });

  it('should dispatch setEditorMode to Query when called with Query mode', () => {
    const { result } = renderHook(() => useSwitchLanguage());

    result.current(EditorMode.Query);

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('setEditorMode'),
        payload: EditorMode.Query,
      })
    );
  });

  it('should select all text in editor when switching modes', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useSwitchLanguage());

    result.current(EditorMode.Prompt);

    expect(mockEditorRef.current.getModel).toHaveBeenCalled();

    // Fast-forward timers to trigger the setTimeout
    jest.advanceTimersByTime(300);

    expect(mockEditorRef.current.setSelection).toHaveBeenCalledWith({ mock: 'range' });

    jest.useRealTimers();
  });
});
