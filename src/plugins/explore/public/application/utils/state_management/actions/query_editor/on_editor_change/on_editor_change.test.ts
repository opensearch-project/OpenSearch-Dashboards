/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { onEditorChangeActionCreator } from './on_editor_change';
import { setEditorMode } from '../../../slices';
import { EditorMode } from '../../../types';
import { DetectionResult, QueryTypeDetector } from './type_detection';
import { EditorLanguage } from './type_detection/constants';
import { EditorContextValue } from '../../../../../context';
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
  let mockEditorContext: EditorContextValue;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch = jest.fn();
    mockGetState = jest.fn();

    mockEditorContext = {
      editorText: 'current text',
      setEditorText: jest.fn(),
      clearEditors: jest.fn(),
      clearEditorsAndSetText: jest.fn(),
      setBottomEditorText: jest.fn(),
      query: 'current query',
      prompt: 'current prompt',
    };

    // Mock the return value of setEditorMode
    mockSetEditorMode.mockReturnValue({
      type: 'queryEditor/setEditorMode',
      payload: EditorMode.SingleQuery,
    });
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

      const actionCreator = onEditorChangeActionCreator(testText, mockEditorContext);
      actionCreator(mockDispatch, mockGetState);

      expect(mockEditorContext.setEditorText).toHaveBeenCalledWith(testText);
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

      const actionCreator = onEditorChangeActionCreator('test', mockEditorContext);
      actionCreator(mockDispatch, mockGetState);

      expect(mockGetState).toHaveBeenCalledTimes(1);
      expect(mockSelectPromptModeIsAvailable).toHaveBeenCalledWith(mockState);
    });

    it('should return early when promptModeIsAvailable is false', () => {
      const mockState = {
        queryEditor: {
          editorMode: EditorMode.SingleQuery,
          promptModeIsAvailable: false,
        },
      } as RootState;

      mockGetState.mockReturnValue(mockState);
      mockSelectPromptModeIsAvailable.mockReturnValue(false);

      const actionCreator = onEditorChangeActionCreator('test query', mockEditorContext);
      actionCreator(mockDispatch, mockGetState);

      expect(mockEditorContext.setEditorText).toHaveBeenCalledWith('test query');
      expect(mockSelectPromptModeIsAvailable).toHaveBeenCalledWith(mockState);
      expect(mockQueryTypeDetector).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
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

      const actionCreator = onEditorChangeActionCreator(testText, mockEditorContext);
      actionCreator(mockDispatch, mockGetState);

      expect(mockQueryTypeDetector).toHaveBeenCalledWith(testText);
    });

    it('should not change mode when inferred language is PPL', () => {
      mockQueryTypeDetector.mockReturnValue({ type: EditorLanguage.PPL } as DetectionResult);

      const actionCreator = onEditorChangeActionCreator('| where field="value"', mockEditorContext);
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorMode).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should change to SinglePrompt mode when inferred language is Natural', () => {
      mockQueryTypeDetector.mockReturnValue({ type: EditorLanguage.Natural } as DetectionResult);

      const actionCreator = onEditorChangeActionCreator(
        'Show me all users from last week',
        mockEditorContext
      );
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.SinglePrompt);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'queryEditor/setEditorMode',
        payload: EditorMode.SingleQuery,
      });
    });

    it('should handle unknown language types gracefully', () => {
      mockQueryTypeDetector.mockReturnValue({
        type: 'UNKNOWN' as EditorLanguage,
      } as DetectionResult);

      const actionCreator = onEditorChangeActionCreator('unknown text', mockEditorContext);
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorMode).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
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

      const actionCreator = onEditorChangeActionCreator(testText, mockEditorContext);
      actionCreator(mockDispatch, mockGetState);

      expect(mockQueryTypeDetector).toHaveBeenCalledWith(testText);
    });

    it('should change to SingleQuery mode when inferred language is PPL', () => {
      mockQueryTypeDetector.mockReturnValue({ type: EditorLanguage.PPL } as DetectionResult);

      const actionCreator = onEditorChangeActionCreator(
        '| where timestamp > now() - 1d',
        mockEditorContext
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
        mockEditorContext
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
      const actionCreator = onEditorChangeActionCreator('any text', mockEditorContext);
      actionCreator(mockDispatch, mockGetState);

      expect(mockQueryTypeDetector).not.toHaveBeenCalled();
    });

    it('should not dispatch any mode changes', () => {
      const actionCreator = onEditorChangeActionCreator('any text', mockEditorContext);
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorMode).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should still set editor text', () => {
      const testText = 'dual query text';
      const actionCreator = onEditorChangeActionCreator(testText, mockEditorContext);
      actionCreator(mockDispatch, mockGetState);

      expect(mockEditorContext.setEditorText).toHaveBeenCalledWith(testText);
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
      const actionCreator = onEditorChangeActionCreator('any text', mockEditorContext);
      actionCreator(mockDispatch, mockGetState);

      expect(mockQueryTypeDetector).not.toHaveBeenCalled();
    });

    it('should not dispatch any mode changes', () => {
      const actionCreator = onEditorChangeActionCreator('any text', mockEditorContext);
      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorMode).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should still set editor text', () => {
      const testText = 'dual prompt text';
      const actionCreator = onEditorChangeActionCreator(testText, mockEditorContext);
      actionCreator(mockDispatch, mockGetState);

      expect(mockEditorContext.setEditorText).toHaveBeenCalledWith(testText);
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

      mockEditorContext.setEditorText = jest.fn(() => {
        calls.push('setEditorText');
      });

      mockQueryTypeDetector.mockImplementation(() => {
        calls.push('typeDetection');
        return { type: EditorLanguage.Natural } as DetectionResult;
      });

      mockDispatch.mockImplementation(() => {
        calls.push('dispatch');
      });

      const actionCreator = onEditorChangeActionCreator('test text', mockEditorContext);
      actionCreator(mockDispatch, mockGetState);

      expect(calls).toEqual(['setEditorText', 'typeDetection', 'dispatch']);
    });
  });
});
