/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getEscapeAction } from './escape_action';
import { monaco } from '@osd/monaco';
import { MutableRefObject } from 'react';

describe('getEscapeAction', () => {
  let mockHandleEscape: jest.Mock;
  let isPromptModeRef: MutableRefObject<boolean>;
  let mockEditor: any;

  beforeEach(() => {
    mockHandleEscape = jest.fn();
    isPromptModeRef = { current: false };
    mockEditor = {
      trigger: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct action descriptor with proper id, label, and keybindings', () => {
    const action = getEscapeAction(isPromptModeRef, mockHandleEscape);

    expect(action).toEqual({
      id: 'escape-action',
      label: 'Escape Action',
      keybindings: [monaco.KeyCode.Escape],
      run: expect.any(Function),
    });

    expect(action.id).toBe('escape-action');
    expect(action.label).toBe('Escape Action');
    expect(action.keybindings).toEqual([monaco.KeyCode.Escape]);
  });

  it('should have Escape key as keybinding', () => {
    const action = getEscapeAction(isPromptModeRef, mockHandleEscape);

    expect(action.keybindings).toContain(monaco.KeyCode.Escape);
    expect(action.keybindings).toHaveLength(1);
  });

  describe('run function', () => {
    describe('when in Prompt mode', () => {
      beforeEach(() => {
        isPromptModeRef.current = true;
      });

      it('should call handleEscape', () => {
        const action = getEscapeAction(isPromptModeRef, mockHandleEscape);

        action.run(mockEditor);

        expect(mockHandleEscape).toHaveBeenCalledTimes(1);
      });
    });

    describe('when not in Prompt mode', () => {
      beforeEach(() => {
        isPromptModeRef.current = false;
      });

      it('should not call handleEscape', () => {
        const action = getEscapeAction(isPromptModeRef, mockHandleEscape);

        action.run(mockEditor);

        expect(mockHandleEscape).not.toHaveBeenCalled();
      });

      it('should trigger hideSuggestWidget for default behavior', () => {
        const action = getEscapeAction(isPromptModeRef, mockHandleEscape);

        action.run(mockEditor);

        expect(mockEditor.trigger).toHaveBeenCalledWith('editor', 'hideSuggestWidget', []);
      });
    });
  });
});
