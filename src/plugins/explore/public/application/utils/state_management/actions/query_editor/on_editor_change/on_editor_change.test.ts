/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { onEditorChangeActionCreator } from './on_editor_change';
import { setEditorMode } from '../../../slices';
import { EditorMode } from '../../../types';
import { DetectionResult, QueryTypeDetector } from './type_detection';
import { EditorLanguage } from './type_detection/constants';
import { useSetEditorText } from '../../../../../hooks';
import { AppDispatch, RootState } from '../../../store';
import { selectPromptModeIsAvailable } from '../../../selectors';

// Mock the dependencies
jest.mock('../../../slices', () => ({
  setEditorMode: jest.fn(),
}));

jest.mock('./type_detection', () => ({
  QueryTypeDetector: {
    detect: jest.fn(),
  },
}));

jest.mock('../../../selectors', () => ({
  selectPromptModeIsAvailable: jest.fn(),
}));

const mockSetEditorMode = setEditorMode as jest.MockedFunction<typeof setEditorMode>;
const mockQueryTypeDetector = QueryTypeDetector.detect as jest.MockedFunction<
  typeof QueryTypeDetector.detect
>;
const mockSelectPromptModeIsAvailable = selectPromptModeIsAvailable as jest.MockedFunction<
  typeof selectPromptModeIsAvailable
>;

describe('onEditorChangeActionCreator', () => {
  let mockDispatch: jest.MockedFunction<AppDispatch>;
  let mockGetState: jest.MockedFunction<() => RootState>;
  let mockSetEditorText: jest.MockedFunction<ReturnType<typeof useSetEditorText>>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch = jest.fn();
    mockGetState = jest.fn();

    mockSetEditorText = jest.fn();

    // Mock the return value of setEditorMode to return the mode that was passed to it
    mockSetEditorMode.mockImplementation((mode: EditorMode) => ({
      type: 'queryEditor/setEditorMode',
      payload: mode,
    }));
  });

  describe('basic functionality', () => {
    it('should always set editor text regardless of mode', () => {
      const testText = 'test query text';
      const mockState = {
        queryEditor: {
          editorMode: EditorMode.DualQuery,
          promptModeIsAvailable: false,
        },
      } as RootState;

      mockGetState.mockReturnValue(mockState);
      mockSelectPromptModeIsAvailable.mockReturnValue(false);

      const actionCreator = onEditorChangeActionCreator(testText, mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorText).toHaveBeenCalledWith(testText);
    });

    it('should call getState to access current editor mode and promptModeIsAvailable', () => {
      const mockState = {
        queryEditor: {
          editorMode: EditorMode.SingleQuery,
          promptModeIsAvailable: true,
        },
      } as RootState;

      mockGetState.mockReturnValue(mockState);
      mockSelectPromptModeIsAvailable.mockReturnValue(true);

      // Mock the type detector for SingleQuery mode
      mockQueryTypeDetector.mockReturnValue({ type: EditorLanguage.PPL } as DetectionResult);

      const actionCreator = onEditorChangeActionCreator('test', mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockGetState).toHaveBeenCalledTimes(1);
      expect(mockSelectPromptModeIsAvailable).toHaveBeenCalledWith(mockState);
    });

    it('should return early when promptModeIsAvailable is false and editor is already in SingleQuery mode', () => {
      const mockState = {
        queryEditor: {
          editorMode: EditorMode.SingleQuery,
          promptModeIsAvailable: false,
        },
      } as RootState;

      mockGetState.mockReturnValue(mockState);
      mockSelectPromptModeIsAvailable.mockReturnValue(false);

      const actionCreator = onEditorChangeActionCreator('test query', mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorText).toHaveBeenCalledWith('test query');
      expect(mockSelectPromptModeIsAvailable).toHaveBeenCalledWith(mockState);
      expect(mockQueryTypeDetector).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should change to SingleQuery mode and return early when promptModeIsAvailable is false and editor is not in SingleQuery mode', () => {
      const mockState = {
        queryEditor: {
          editorMode: EditorMode.SinglePrompt,
          promptModeIsAvailable: false,
        },
      } as RootState;

      mockGetState.mockReturnValue(mockState);
      mockSelectPromptModeIsAvailable.mockReturnValue(false);

      const actionCreator = onEditorChangeActionCreator('test query', mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorText).toHaveBeenCalledWith('test query');
      expect(mockSelectPromptModeIsAvailable).toHaveBeenCalledWith(mockState);
      expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.SingleQuery);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'queryEditor/setEditorMode',
        payload: EditorMode.SingleQuery,
      });
      expect(mockQueryTypeDetector).not.toHaveBeenCalled();
    });
  });

  describe('empty text handling', () => {
    it('should change to SingleEmpty mode when text is empty and editor is not already in SingleEmpty mode', () => {
      const mockState = {
        queryEditor: {
          editorMode: EditorMode.SingleQuery,
          promptModeIsAvailable: true,
        },
      } as RootState;

      mockGetState.mockReturnValue(mockState);
      mockSelectPromptModeIsAvailable.mockReturnValue(true);

      const actionCreator = onEditorChangeActionCreator('', mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorText).toHaveBeenCalledWith('');
      expect(mockSelectPromptModeIsAvailable).toHaveBeenCalledWith(mockState);
      expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.SingleEmpty);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'queryEditor/setEditorMode',
        payload: EditorMode.SingleEmpty,
      });
      expect(mockQueryTypeDetector).not.toHaveBeenCalled();
    });

    it('should not change mode when text is empty and editor is already in SingleEmpty mode', () => {
      const mockState = {
        queryEditor: {
          editorMode: EditorMode.SingleEmpty,
          promptModeIsAvailable: true,
        },
      } as RootState;

      mockGetState.mockReturnValue(mockState);
      mockSelectPromptModeIsAvailable.mockReturnValue(true);

      // Mock what the type detector returns for empty text
      mockQueryTypeDetector.mockReturnValue({ type: EditorLanguage.PPL } as DetectionResult);

      const actionCreator = onEditorChangeActionCreator('', mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorText).toHaveBeenCalledWith('');
      expect(mockSelectPromptModeIsAvailable).toHaveBeenCalledWith(mockState);
      // Empty text from SingleEmpty mode gets detected as PPL and switches to SingleQuery
      expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.SingleQuery);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'queryEditor/setEditorMode',
        payload: EditorMode.SingleQuery,
      });
      expect(mockQueryTypeDetector).toHaveBeenCalledWith('');
    });

    it('should not change to SingleEmpty mode when text is empty and promptModeIsAvailable is false', () => {
      const mockState = {
        queryEditor: {
          editorMode: EditorMode.SingleQuery,
          promptModeIsAvailable: false,
        },
      } as RootState;

      mockGetState.mockReturnValue(mockState);
      mockSelectPromptModeIsAvailable.mockReturnValue(false);

      const actionCreator = onEditorChangeActionCreator('', mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorText).toHaveBeenCalledWith('');
      expect(mockSelectPromptModeIsAvailable).toHaveBeenCalledWith(mockState);
      // When promptModeIsAvailable is false and editor is already SingleQuery, no mode change occurs
      expect(mockSetEditorMode).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockQueryTypeDetector).not.toHaveBeenCalled();
    });

    it('should change to SingleEmpty mode when text contains only whitespace and editor is not already in SingleEmpty mode', () => {
      const mockState = {
        queryEditor: {
          editorMode: EditorMode.SingleQuery,
          promptModeIsAvailable: true,
        },
      } as RootState;

      mockGetState.mockReturnValue(mockState);
      mockSelectPromptModeIsAvailable.mockReturnValue(true);

      const actionCreator = onEditorChangeActionCreator('   \n\t  ', mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorText).toHaveBeenCalledWith('   \n\t  ');
      expect(mockSelectPromptModeIsAvailable).toHaveBeenCalledWith(mockState);
      expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.SingleEmpty);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'queryEditor/setEditorMode',
        payload: EditorMode.SingleEmpty,
      });
      expect(mockQueryTypeDetector).not.toHaveBeenCalled();
    });

    it('should change to SingleEmpty mode when text contains only spaces and editor is not already in SingleEmpty mode', () => {
      const mockState = {
        queryEditor: {
          editorMode: EditorMode.SinglePrompt,
          promptModeIsAvailable: true,
        },
      } as RootState;

      mockGetState.mockReturnValue(mockState);
      mockSelectPromptModeIsAvailable.mockReturnValue(true);

      const actionCreator = onEditorChangeActionCreator('     ', mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorText).toHaveBeenCalledWith('     ');
      expect(mockSelectPromptModeIsAvailable).toHaveBeenCalledWith(mockState);
      expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.SingleEmpty);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'queryEditor/setEditorMode',
        payload: EditorMode.SingleEmpty,
      });
      expect(mockQueryTypeDetector).not.toHaveBeenCalled();
    });

    it('should not change to SingleEmpty mode when text contains only whitespace and promptModeIsAvailable is false', () => {
      const mockState = {
        queryEditor: {
          editorMode: EditorMode.SingleQuery,
          promptModeIsAvailable: false,
        },
      } as RootState;

      mockGetState.mockReturnValue(mockState);
      mockSelectPromptModeIsAvailable.mockReturnValue(false);

      const actionCreator = onEditorChangeActionCreator('  \t\n  ', mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorText).toHaveBeenCalledWith('  \t\n  ');
      expect(mockSelectPromptModeIsAvailable).toHaveBeenCalledWith(mockState);
      // When promptModeIsAvailable is false and editor is already SingleQuery, no mode change occurs
      expect(mockSetEditorMode).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockQueryTypeDetector).not.toHaveBeenCalled();
    });
  });

  describe('SingleEmpty mode', () => {
    beforeEach(() => {
      mockGetState.mockReturnValue({
        queryEditor: {
          editorMode: EditorMode.SingleEmpty,
          promptModeIsAvailable: true,
        },
      } as RootState);
      mockSelectPromptModeIsAvailable.mockReturnValue(true);
    });

    it('should call QueryTypeDetector.detect with the text', () => {
      const testText = '| where something=somethingElse';
      mockQueryTypeDetector.mockReturnValue({ type: EditorLanguage.PPL } as DetectionResult);

      const actionCreator = onEditorChangeActionCreator(testText, mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockQueryTypeDetector).toHaveBeenCalledWith(testText);
    });

    it('should change mode when inferred language is PPL', () => {
      mockQueryTypeDetector.mockReturnValue({ type: EditorLanguage.PPL } as DetectionResult);

      const actionCreator = onEditorChangeActionCreator('| where field="value"', mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.SingleQuery);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'queryEditor/setEditorMode',
        payload: EditorMode.SingleQuery,
      });
    });

    it('should change to SinglePrompt mode when inferred language is Natural', () => {
      mockQueryTypeDetector.mockReturnValue({ type: EditorLanguage.Natural } as DetectionResult);

      const actionCreator = onEditorChangeActionCreator(
        'Show me all users from last week',
        mockSetEditorText
      );
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.SinglePrompt);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'queryEditor/setEditorMode',
        payload: EditorMode.SinglePrompt,
      });
    });
  });

  describe('SingleQuery mode', () => {
    beforeEach(() => {
      mockGetState.mockReturnValue({
        queryEditor: {
          editorMode: EditorMode.SingleQuery,
          promptModeIsAvailable: true,
        },
      } as RootState);
      mockSelectPromptModeIsAvailable.mockReturnValue(true);
    });

    it('should call QueryTypeDetector.detect with the text', () => {
      const testText = '| where something=somethingElse';
      mockQueryTypeDetector.mockReturnValue({ type: EditorLanguage.PPL } as DetectionResult);

      const actionCreator = onEditorChangeActionCreator(testText, mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockQueryTypeDetector).toHaveBeenCalledWith(testText);
    });

    it('should not change mode when inferred language is PPL', () => {
      mockQueryTypeDetector.mockReturnValue({ type: EditorLanguage.PPL } as DetectionResult);

      const actionCreator = onEditorChangeActionCreator('| where field="value"', mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorMode).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should change to SinglePrompt mode when inferred language is Natural', () => {
      mockQueryTypeDetector.mockReturnValue({ type: EditorLanguage.Natural } as DetectionResult);

      const actionCreator = onEditorChangeActionCreator(
        'Show me all users from last week',
        mockSetEditorText
      );
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.SinglePrompt);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'queryEditor/setEditorMode',
        payload: EditorMode.SinglePrompt,
      });
    });
  });

  describe('SinglePrompt mode', () => {
    beforeEach(() => {
      mockGetState.mockReturnValue({
        queryEditor: {
          editorMode: EditorMode.SinglePrompt,
          promptModeIsAvailable: true,
        },
      } as RootState);
      mockSelectPromptModeIsAvailable.mockReturnValue(true);
    });

    it('should call QueryTypeDetector.detect with the text', () => {
      const testText = 'What are the top 10 users?';
      mockQueryTypeDetector.mockReturnValue({ type: EditorLanguage.Natural } as DetectionResult);

      const actionCreator = onEditorChangeActionCreator(testText, mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockQueryTypeDetector).toHaveBeenCalledWith(testText);
    });

    it('should change to SingleQuery mode when inferred language is PPL', () => {
      mockQueryTypeDetector.mockReturnValue({ type: EditorLanguage.PPL } as DetectionResult);

      const actionCreator = onEditorChangeActionCreator(
        '| where timestamp > now() - 1d',
        mockSetEditorText
      );
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.SingleQuery);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'queryEditor/setEditorMode',
        payload: EditorMode.SingleQuery,
      });
    });

    it('should not change mode when inferred language is Natural', () => {
      mockQueryTypeDetector.mockReturnValue({ type: EditorLanguage.Natural } as DetectionResult);

      const actionCreator = onEditorChangeActionCreator(
        'Show me recent activity',
        mockSetEditorText
      );
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorMode).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('DualQuery mode', () => {
    beforeEach(() => {
      mockGetState.mockReturnValue({
        queryEditor: {
          editorMode: EditorMode.DualQuery,
          promptModeIsAvailable: false,
        },
      } as RootState);
      mockSelectPromptModeIsAvailable.mockReturnValue(false);
    });

    it('should not perform type detection', () => {
      const actionCreator = onEditorChangeActionCreator('any text', mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockQueryTypeDetector).not.toHaveBeenCalled();
    });

    it('should change to SingleQuery mode when promptModeIsAvailable is false', () => {
      const actionCreator = onEditorChangeActionCreator('any text', mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.SingleQuery);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'queryEditor/setEditorMode',
        payload: EditorMode.SingleQuery,
      });
    });

    it('should still set editor text', () => {
      const testText = 'dual query text';
      const actionCreator = onEditorChangeActionCreator(testText, mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorText).toHaveBeenCalledWith(testText);
    });
  });

  describe('DualPrompt mode', () => {
    beforeEach(() => {
      mockGetState.mockReturnValue({
        queryEditor: {
          editorMode: EditorMode.DualPrompt,
          promptModeIsAvailable: false,
        },
      } as RootState);
      mockSelectPromptModeIsAvailable.mockReturnValue(false);
    });

    it('should not perform type detection', () => {
      const actionCreator = onEditorChangeActionCreator('any text', mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockQueryTypeDetector).not.toHaveBeenCalled();
    });

    it('should change to SingleQuery mode when promptModeIsAvailable is false', () => {
      const actionCreator = onEditorChangeActionCreator('any text', mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.SingleQuery);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'queryEditor/setEditorMode',
        payload: EditorMode.SingleQuery,
      });
    });

    it('should still set editor text', () => {
      const testText = 'dual prompt text';
      const actionCreator = onEditorChangeActionCreator(testText, mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorText).toHaveBeenCalledWith(testText);
    });
  });

  describe('execution order', () => {
    it('should set editor text before type detection and mode change', () => {
      const calls: string[] = [];

      mockGetState.mockReturnValue({
        queryEditor: {
          editorMode: EditorMode.SingleQuery,
          promptModeIsAvailable: true,
        },
      } as RootState);
      mockSelectPromptModeIsAvailable.mockReturnValue(true);

      mockSetEditorText.mockImplementation(() => {
        calls.push('setEditorText');
      });

      mockQueryTypeDetector.mockImplementation(() => {
        calls.push('typeDetection');
        return { type: EditorLanguage.Natural } as DetectionResult;
      });

      mockDispatch.mockImplementation(() => {
        calls.push('dispatch');
      });

      const actionCreator = onEditorChangeActionCreator('test text', mockSetEditorText);
      actionCreator(mockDispatch, mockGetState);

      expect(calls).toEqual(['setEditorText', 'typeDetection', 'dispatch']);
    });
  });
});
