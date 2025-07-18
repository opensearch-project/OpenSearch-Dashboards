/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getTabAction } from './tab_action';
import { monaco } from '@osd/monaco';

describe('getTabAction', () => {
  let mockEditor: any;

  beforeEach(() => {
    mockEditor = {
      trigger: jest.fn(),
    };

    // Mock setTimeout
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should return correct action descriptor with proper id, label, and keybindings', () => {
    const action = getTabAction();

    expect(action).toEqual({
      id: 'handle-tab-suggest',
      label: 'Select the next suggestion',
      keybindings: [monaco.KeyCode.Tab],
      run: expect.any(Function),
    });

    expect(action.id).toBe('handle-tab-suggest');
    expect(action.label).toBe('Select the next suggestion');
    expect(action.keybindings).toEqual([monaco.KeyCode.Tab]);
  });

  describe('run function', () => {
    it('should call acceptSelectedSuggestion first', () => {
      const action = getTabAction();

      action.run(mockEditor);

      expect(mockEditor.trigger).toHaveBeenCalledWith('keyboard', 'acceptSelectedSuggestion', {});
    });

    it('should call triggerSuggest after timeout', () => {
      const action = getTabAction();

      action.run(mockEditor);

      // Fast-forward time
      jest.advanceTimersByTime(100);

      expect(mockEditor.trigger).toHaveBeenCalledWith(
        'keyboard',
        'editor.action.triggerSuggest',
        {}
      );
    });

    it('should call triggers in correct order', () => {
      const action = getTabAction();
      const callOrder: string[] = [];

      mockEditor.trigger.mockImplementation((source: string, command: string) => {
        callOrder.push(command);
      });

      action.run(mockEditor);
      jest.advanceTimersByTime(100);

      expect(callOrder).toEqual(['acceptSelectedSuggestion', 'editor.action.triggerSuggest']);
    });
  });
});
