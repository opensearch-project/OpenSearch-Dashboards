/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSpacebarAction } from './spacebar_action';
import { monaco } from '@osd/monaco';
import { MutableRefObject } from 'react';

describe('getSpacebarAction', () => {
  let mockSetToPromptMode: jest.Mock;
  let promptModeIsAvailableRef: MutableRefObject<boolean>;
  let isPromptModeRef: MutableRefObject<boolean>;
  let textRef: MutableRefObject<string>;
  let mockEditor: any;

  beforeEach(() => {
    mockSetToPromptMode = jest.fn();
    promptModeIsAvailableRef = { current: true };
    isPromptModeRef = { current: false };
    textRef = { current: '' };
    mockEditor = {
      trigger: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct action descriptor with proper id, label, and keybindings', () => {
    const action = getSpacebarAction(
      promptModeIsAvailableRef,
      isPromptModeRef,
      textRef,
      mockSetToPromptMode
    );

    expect(action).toEqual({
      id: 'spacebar-action',
      label: 'Spacebar Action',
      keybindings: [monaco.KeyCode.Space],
      run: expect.any(Function),
    });

    expect(action.id).toBe('spacebar-action');
    expect(action.label).toBe('Spacebar Action');
    expect(action.keybindings).toEqual([monaco.KeyCode.Space]);
  });

  it('should have Space key as keybinding', () => {
    const action = getSpacebarAction(
      promptModeIsAvailableRef,
      isPromptModeRef,
      textRef,
      mockSetToPromptMode
    );

    expect(action.keybindings).toContain(monaco.KeyCode.Space);
    expect(action.keybindings).toHaveLength(1);
  });

  describe('run function', () => {
    describe('when in Query mode with empty text and prompt mode is available', () => {
      beforeEach(() => {
        promptModeIsAvailableRef.current = true;
        isPromptModeRef.current = false;
        textRef.current = '';
      });

      it('should call setToPromptMode', () => {
        const action = getSpacebarAction(
          promptModeIsAvailableRef,
          isPromptModeRef,
          textRef,
          mockSetToPromptMode
        );

        action.run(mockEditor);

        expect(mockSetToPromptMode).toHaveBeenCalledTimes(1);
      });

      it('should not trigger default spacebar behavior', () => {
        const action = getSpacebarAction(
          promptModeIsAvailableRef,
          isPromptModeRef,
          textRef,
          mockSetToPromptMode
        );

        action.run(mockEditor);

        expect(mockEditor.trigger).not.toHaveBeenCalled();
      });
    });

    describe('when in Query mode with empty text but prompt mode is not available', () => {
      beforeEach(() => {
        promptModeIsAvailableRef.current = false;
        isPromptModeRef.current = false;
        textRef.current = '';
      });

      it('should not call setToPromptMode', () => {
        const action = getSpacebarAction(
          promptModeIsAvailableRef,
          isPromptModeRef,
          textRef,
          mockSetToPromptMode
        );

        action.run(mockEditor);

        expect(mockSetToPromptMode).not.toHaveBeenCalled();
      });

      it('should trigger default spacebar behavior', () => {
        const action = getSpacebarAction(
          promptModeIsAvailableRef,
          isPromptModeRef,
          textRef,
          mockSetToPromptMode
        );

        action.run(mockEditor);

        expect(mockEditor.trigger).toHaveBeenCalledWith('keyboard', 'type', { text: ' ' });
      });
    });

    describe('when in Query mode with text present', () => {
      beforeEach(() => {
        isPromptModeRef.current = false;
        textRef.current = 'some query text';
      });

      it('should not call setToPromptMode', () => {
        const action = getSpacebarAction(
          promptModeIsAvailableRef,
          isPromptModeRef,
          textRef,
          mockSetToPromptMode
        );

        action.run(mockEditor);

        expect(mockSetToPromptMode).not.toHaveBeenCalled();
      });

      it('should trigger default spacebar behavior', () => {
        const action = getSpacebarAction(
          promptModeIsAvailableRef,
          isPromptModeRef,
          textRef,
          mockSetToPromptMode
        );

        action.run(mockEditor);

        expect(mockEditor.trigger).toHaveBeenCalledWith('keyboard', 'type', { text: ' ' });
      });
    });

    describe('when in Prompt mode with empty text', () => {
      beforeEach(() => {
        isPromptModeRef.current = true;
        textRef.current = '';
      });

      it('should not call setToPromptMode', () => {
        const action = getSpacebarAction(
          promptModeIsAvailableRef,
          isPromptModeRef,
          textRef,
          mockSetToPromptMode
        );

        action.run(mockEditor);

        expect(mockSetToPromptMode).not.toHaveBeenCalled();
      });

      it('should trigger default spacebar behavior', () => {
        const action = getSpacebarAction(
          promptModeIsAvailableRef,
          isPromptModeRef,
          textRef,
          mockSetToPromptMode
        );

        action.run(mockEditor);

        expect(mockEditor.trigger).toHaveBeenCalledWith('keyboard', 'type', { text: ' ' });
      });
    });

    describe('when in Prompt mode with text present', () => {
      beforeEach(() => {
        isPromptModeRef.current = true;
        textRef.current = 'some prompt text';
      });

      it('should not call setToPromptMode', () => {
        const action = getSpacebarAction(
          promptModeIsAvailableRef,
          isPromptModeRef,
          textRef,
          mockSetToPromptMode
        );

        action.run(mockEditor);

        expect(mockSetToPromptMode).not.toHaveBeenCalled();
      });

      it('should trigger default spacebar behavior', () => {
        const action = getSpacebarAction(
          promptModeIsAvailableRef,
          isPromptModeRef,
          textRef,
          mockSetToPromptMode
        );

        action.run(mockEditor);

        expect(mockEditor.trigger).toHaveBeenCalledWith('keyboard', 'type', { text: ' ' });
      });
    });
  });
});
