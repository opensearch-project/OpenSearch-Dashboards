/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getEnterAction } from './enter_action';
import { monaco } from '@osd/monaco';

describe('getEnterAction', () => {
  let mockHandleRun: jest.Mock;
  let mockEditor: any;
  let mockContextKeyService: any;

  beforeEach(() => {
    mockHandleRun = jest.fn();
    mockContextKeyService = {
      getContextKeyValue: jest.fn(),
    };
    mockEditor = {
      trigger: jest.fn(),
      _contextKeyService: mockContextKeyService,
    };

    // Mock setTimeout
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should return correct action descriptor with proper id, label, and keybindings', () => {
    const action = getEnterAction(mockHandleRun);

    expect(action).toEqual({
      id: 'suggest-or-run-on-enter',
      label: 'Select the suggestion or run',
      keybindings: [monaco.KeyCode.Enter],
      run: expect.any(Function),
    });

    expect(action.id).toBe('suggest-or-run-on-enter');
    expect(action.label).toBe('Select the suggestion or run');
    expect(action.keybindings).toEqual([monaco.KeyCode.Enter]);
  });

  describe('run function', () => {
    describe('when suggest widget is visible', () => {
      beforeEach(() => {
        mockContextKeyService.getContextKeyValue.mockReturnValue(true);
      });

      it('should check for suggest widget visibility', () => {
        const action = getEnterAction(mockHandleRun);

        action.run(mockEditor);

        expect(mockContextKeyService.getContextKeyValue).toHaveBeenCalledWith(
          'suggestWidgetVisible'
        );
      });

      it('should accept selected suggestion', () => {
        const action = getEnterAction(mockHandleRun);

        action.run(mockEditor);

        expect(mockEditor.trigger).toHaveBeenCalledWith('keyboard', 'acceptSelectedSuggestion', {});
      });

      it('should trigger suggest after timeout', () => {
        const action = getEnterAction(mockHandleRun);

        action.run(mockEditor);
        jest.advanceTimersByTime(100);

        expect(mockEditor.trigger).toHaveBeenCalledWith(
          'keyboard',
          'editor.action.triggerSuggest',
          {}
        );
      });

      it('should not call handleRun', () => {
        const action = getEnterAction(mockHandleRun);

        action.run(mockEditor);
        jest.advanceTimersByTime(100);

        expect(mockHandleRun).not.toHaveBeenCalled();
      });
    });

    describe('when suggest widget is not visible', () => {
      beforeEach(() => {
        mockContextKeyService.getContextKeyValue.mockReturnValue(false);
      });

      it('should call handleRun', () => {
        const action = getEnterAction(mockHandleRun);

        action.run(mockEditor);

        expect(mockHandleRun).toHaveBeenCalledTimes(1);
      });

      it('should not call editor.trigger', () => {
        const action = getEnterAction(mockHandleRun);

        action.run(mockEditor);

        expect(mockEditor.trigger).not.toHaveBeenCalled();
      });
    });

    describe('when contextKeyService is not available', () => {
      beforeEach(() => {
        mockEditor._contextKeyService = undefined;
      });

      it('should call handleRun when no context key service', () => {
        const action = getEnterAction(mockHandleRun);

        action.run(mockEditor);

        expect(mockHandleRun).toHaveBeenCalledTimes(1);
      });

      it('should not call editor.trigger when no context key service', () => {
        const action = getEnterAction(mockHandleRun);

        action.run(mockEditor);

        expect(mockEditor.trigger).not.toHaveBeenCalled();
      });
    });
  });
});
