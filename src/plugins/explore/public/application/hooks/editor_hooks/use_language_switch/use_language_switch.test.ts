/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { useDispatch } from 'react-redux';
import { useLanguageSwitch } from './use_language_switch';
import { EditorMode } from '../../../utils/state_management/types';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

describe('useLanguageSwitch', () => {
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
  });

  it('should return switchToAIMode function', () => {
    const { result } = renderHook(() =>
      useLanguageSwitch({
        editorRef: mockEditorRef as any,
      })
    );

    expect(result.current.switchToAIMode).toBeInstanceOf(Function);
  });

  it('should return switchToQueryMode function', () => {
    const { result } = renderHook(() =>
      useLanguageSwitch({
        editorRef: mockEditorRef as any,
      })
    );

    expect(result.current.switchToQueryMode).toBeInstanceOf(Function);
  });

  it('should dispatch setEditorMode to Prompt when switchToAIMode is called', () => {
    const { result } = renderHook(() =>
      useLanguageSwitch({
        editorRef: mockEditorRef as any,
      })
    );

    result.current.switchToAIMode();

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('setEditorMode'),
        payload: EditorMode.Prompt,
      })
    );
  });

  it('should dispatch setEditorMode to Query when switchToQueryMode is called', () => {
    const { result } = renderHook(() =>
      useLanguageSwitch({
        editorRef: mockEditorRef as any,
      })
    );

    result.current.switchToQueryMode();

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('setEditorMode'),
        payload: EditorMode.Query,
      })
    );
  });

  it('should select all text in editor when switching modes', () => {
    const { result } = renderHook(() =>
      useLanguageSwitch({
        editorRef: mockEditorRef as any,
      })
    );

    result.current.switchToAIMode();

    expect(mockEditorRef.current.getModel).toHaveBeenCalled();
    expect(mockEditorRef.current.setSelection).toHaveBeenCalledWith({ mock: 'range' });
  });
});
