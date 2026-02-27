/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getShiftEnterAction } from './shift_enter_action';
import { monaco } from '@osd/monaco';

describe('getShiftEnterAction', () => {
  let mockEditor: any;
  let mockPosition: any;

  beforeEach(() => {
    mockPosition = {
      lineNumber: 2,
      column: 5,
    };

    mockEditor = {
      hasTextFocus: jest.fn().mockReturnValue(true),
      getPosition: jest.fn().mockReturnValue(mockPosition),
      executeEdits: jest.fn(),
      setPosition: jest.fn(),
    };

    // Mock monaco.Range constructor
    jest.spyOn(monaco, 'Range').mockImplementation(
      (startLine, startCol, endLine, endCol) =>
        ({
          startLineNumber: startLine,
          startColumn: startCol,
          endLineNumber: endLine,
          endColumn: endCol,
        } as any)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should return correct action descriptor with proper id, label, and keybindings', () => {
    const action = getShiftEnterAction();
    // eslint-disable-next-line no-bitwise
    const expectedKeybinding = monaco.KeyMod.Shift | monaco.KeyCode.Enter;

    expect(action).toEqual({
      id: 'insert-new-line',
      label: 'Insert New Line',
      keybindings: [expectedKeybinding],
      run: expect.any(Function),
    });

    expect(action.id).toBe('insert-new-line');
    expect(action.label).toBe('Insert New Line');
    expect(action.keybindings).toEqual([expectedKeybinding]);
  });

  describe('run function', () => {
    it('should check if editor has text focus', () => {
      const action = getShiftEnterAction();

      action.run(mockEditor);

      expect(mockEditor.hasTextFocus).toHaveBeenCalledTimes(1);
    });

    it('should not execute if editor does not have text focus', () => {
      const action = getShiftEnterAction();
      mockEditor.hasTextFocus.mockReturnValue(false);

      action.run(mockEditor);

      expect(mockEditor.getPosition).not.toHaveBeenCalled();
      expect(mockEditor.executeEdits).not.toHaveBeenCalled();
      expect(mockEditor.setPosition).not.toHaveBeenCalled();
    });

    it('should get current position when editor has focus', () => {
      const action = getShiftEnterAction();

      action.run(mockEditor);

      expect(mockEditor.getPosition).toHaveBeenCalledTimes(1);
    });

    it('should execute edits with correct parameters when position exists', () => {
      const action = getShiftEnterAction();

      action.run(mockEditor);

      expect(mockEditor.executeEdits).toHaveBeenCalledWith('', [
        {
          range: {
            startLineNumber: 2,
            startColumn: 5,
            endLineNumber: 2,
            endColumn: 5,
          },
          text: '\n',
          forceMoveMarkers: true,
        },
      ]);
    });

    it('should create range with current position coordinates', () => {
      const action = getShiftEnterAction();

      action.run(mockEditor);

      expect(monaco.Range).toHaveBeenCalledWith(2, 5, 2, 5);
    });
  });
});
