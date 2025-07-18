/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { useDispatch } from 'react-redux';
import { resetEditorMode } from '../../../utils/state_management/slices';
import { useSetEditorText } from '../use_set_editor_text';
import { useClearEditors } from './use_clear_editors';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('../use_set_editor_text', () => ({
  useSetEditorText: jest.fn(),
}));

jest.mock('../../../utils/state_management/slices', () => ({
  resetEditorMode: jest.fn(),
}));

describe('useClearEditors', () => {
  const mockDispatch = jest.fn();
  const mockSetEditorText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSetEditorText as jest.Mock).mockReturnValue(mockSetEditorText);
    ((resetEditorMode as unknown) as jest.Mock).mockReturnValue({
      type: 'queryEditor/resetEditorMode',
    });
  });

  it('should clear editor text and reset editor mode when called', () => {
    const { result } = renderHook(() => useClearEditors());
    const clearEditors = result.current;

    clearEditors();

    expect(mockSetEditorText).toHaveBeenCalledWith('');
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'queryEditor/resetEditorMode' });

    expect(mockSetEditorText).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });
});
