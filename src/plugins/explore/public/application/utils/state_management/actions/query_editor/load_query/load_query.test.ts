/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loadQueryActionCreator } from './load_query';
import { setEditorMode } from '../../../slices';
import { EditorMode } from '../../../types';
import { runQueryActionCreator } from '../run_query';
import { ExploreServices } from '../../../../../../types';
import { useClearEditorsAndSetText } from '../../../../../hooks';
import { AppDispatch, RootState } from '../../../store';

// Mock the dependencies
jest.mock('../../../slices', () => ({
  setEditorMode: jest.fn(),
}));

jest.mock('../run_query', () => ({
  runQueryActionCreator: jest.fn(),
}));

const mockSetEditorMode = setEditorMode as jest.MockedFunction<typeof setEditorMode>;
const mockRunQueryActionCreator = runQueryActionCreator as jest.MockedFunction<
  typeof runQueryActionCreator
>;

describe('loadQueryActionCreator', () => {
  let mockDispatch: jest.MockedFunction<AppDispatch>;
  let mockGetState: jest.MockedFunction<() => RootState>;
  let mockServices: ExploreServices;
  let mockClearEditorsAndSetText: jest.MockedFunction<ReturnType<typeof useClearEditorsAndSetText>>;
  const testQuery = '| where field="b"';

  beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch = jest.fn();

    mockGetState = jest.fn();

    mockServices = {
      data: {},
      uiSettings: {},
      savedObjects: {},
      indexPatterns: {},
    } as ExploreServices;

    mockClearEditorsAndSetText = jest.fn();

    // Mock return values
    mockSetEditorMode.mockReturnValue({ type: 'SET_EDITOR_MODE', payload: EditorMode.SingleQuery });
    mockRunQueryActionCreator.mockReturnValue(jest.fn());
  });

  describe('editorMode === SingleQuery', () => {
    beforeEach(() => {
      mockGetState.mockReturnValue({
        queryEditor: {
          editorMode: EditorMode.SingleQuery,
        },
      } as RootState);
    });

    it('should clear editors and set the query text', () => {
      const actionCreator = loadQueryActionCreator(
        mockServices,
        mockClearEditorsAndSetText,
        testQuery
      );

      actionCreator(mockDispatch, mockGetState);

      expect(mockClearEditorsAndSetText).toHaveBeenCalledWith(testQuery);
    });

    it('should not dispatch setEditorMode since already in SingleQuery mode', () => {
      const actionCreator = loadQueryActionCreator(
        mockServices,
        mockClearEditorsAndSetText,
        testQuery
      );

      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorMode).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalledWith({
        type: 'SET_EDITOR_MODE',
        payload: EditorMode.SingleQuery,
      });
    });

    it('should dispatch runQueryActionCreator with services and query', () => {
      const mockRunAction = jest.fn();
      mockRunQueryActionCreator.mockReturnValue(mockRunAction);

      const actionCreator = loadQueryActionCreator(
        mockServices,
        mockClearEditorsAndSetText,
        testQuery
      );

      actionCreator(mockDispatch, mockGetState);

      expect(mockRunQueryActionCreator).toHaveBeenCalledWith(mockServices, testQuery);
      expect(mockDispatch).toHaveBeenCalledWith(mockRunAction);
    });
  });

  describe('editorMode !== SingleQuery', () => {
    beforeEach(() => {
      mockGetState.mockReturnValue({
        queryEditor: {
          editorMode: EditorMode.DualQuery,
        },
      } as RootState);
    });

    it('should clear editors and set the query text', () => {
      const actionCreator = loadQueryActionCreator(
        mockServices,
        mockClearEditorsAndSetText,
        testQuery
      );

      actionCreator(mockDispatch, mockGetState);

      expect(mockClearEditorsAndSetText).toHaveBeenCalledWith(testQuery);
    });

    it('should dispatch setEditorMode to change to SingleQuery mode', () => {
      const actionCreator = loadQueryActionCreator(
        mockServices,
        mockClearEditorsAndSetText,
        testQuery
      );

      actionCreator(mockDispatch, mockGetState);

      expect(mockSetEditorMode).toHaveBeenCalledWith(EditorMode.SingleQuery);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_EDITOR_MODE',
        payload: EditorMode.SingleQuery,
      });
    });

    it('should dispatch runQueryActionCreator after setting editor mode', () => {
      const mockRunAction = jest.fn();
      mockRunQueryActionCreator.mockReturnValue(mockRunAction);

      const actionCreator = loadQueryActionCreator(
        mockServices,
        mockClearEditorsAndSetText,
        testQuery
      );

      actionCreator(mockDispatch, mockGetState);

      expect(mockRunQueryActionCreator).toHaveBeenCalledWith(mockServices, testQuery);
      expect(mockDispatch).toHaveBeenCalledWith(mockRunAction);
    });
  });
});
