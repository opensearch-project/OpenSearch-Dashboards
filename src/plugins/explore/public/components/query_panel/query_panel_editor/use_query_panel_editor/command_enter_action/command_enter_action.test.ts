/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCommandEnterAction } from './command_enter_action';
import { monaco } from '@osd/monaco';

describe('getCommandEnterAction', () => {
  let mockHandleRun: jest.Mock;
  let mockEditor: any;

  beforeEach(() => {
    mockHandleRun = jest.fn();
    mockEditor = {
      trigger: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct action descriptor', () => {
    const action = getCommandEnterAction(mockHandleRun);

    expect(action).toEqual({
      id: 'run-on-enter',
      label: 'Run',
      // eslint-disable-next-line no-bitwise
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: expect.any(Function),
    });
  });

  describe('run function', () => {
    it('should call editor.trigger to hide suggest widget', () => {
      const action = getCommandEnterAction(mockHandleRun);

      action.run(mockEditor);

      expect(mockEditor.trigger).toHaveBeenCalledWith('keyboard', 'hideSuggestWidget', {});
    });

    it('should call handleRun callback', () => {
      const action = getCommandEnterAction(mockHandleRun);

      action.run(mockEditor);

      expect(mockHandleRun).toHaveBeenCalledTimes(1);
    });
  });
});
