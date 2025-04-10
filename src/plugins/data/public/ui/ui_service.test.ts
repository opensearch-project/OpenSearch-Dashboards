/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UiService } from './ui_service';
import { coreMock } from '../../../../core/public/mocks';
import { dataPluginMock } from '../mocks';
import { uiActionsPluginMock } from 'src/plugins/ui_actions/public/mocks';
import { DataStorage } from '../../../../plugins/data/common';
import { createSearchBar } from './search_bar/create_search_bar';

jest.mock('./search_bar/create_search_bar', () => ({
  createSearchBar: jest.fn(() => 'MockedSearchBar'),
}));

jest.mock('./index_pattern_select', () => ({
  createIndexPatternSelect: jest.fn(() => 'MockedIndexPatternSelect'),
}));

describe('UiService', () => {
  let uiService: UiService;
  let mockInitializerContext: any;
  let mockCoreSetup: ReturnType<typeof coreMock.createSetup>;
  let mockCoreStart: ReturnType<typeof coreMock.createStart>;
  let mockDataServices: ReturnType<typeof dataPluginMock.createStartContract>;
  let mockUiActionsStart: ReturnType<typeof uiActionsPluginMock.createStartContract>;
  const mockStorage = new DataStorage(window.localStorage, 'opensearchDashboards.');

  beforeEach(() => {
    mockInitializerContext = {
      config: {
        get: jest.fn().mockReturnValue({ enhancements: {} }),
      },
    };

    mockCoreSetup = coreMock.createSetup();
    mockCoreStart = coreMock.createStart();
    mockDataServices = dataPluginMock.createStartContract();
    uiService = new UiService(mockInitializerContext);
    mockUiActionsStart = uiActionsPluginMock.createStartContract();
  });

  describe('#constructor', () => {
    it('should set enhancementsConfig from initializerContext', () => {
      const testEnhancements = { someConfig: true };
      mockInitializerContext.config.get.mockReturnValue({ enhancements: testEnhancements });

      const service = new UiService(mockInitializerContext);

      expect(service.enhancementsConfig).toEqual(testEnhancements);
    });
  });

  describe('#setup', () => {
    it('should return abortControllerRef', () => {
      const setup = uiService.setup(mockCoreSetup);

      expect(setup).toEqual({
        abortControllerRef: expect.any(Object),
      });
      expect(setup.abortControllerRef.current).toBeUndefined();
    });
  });

  describe('#start', () => {
    it('should return correct contract', () => {
      const start = uiService.start(mockCoreStart, {
        dataServices: mockDataServices,
        storage: mockStorage,
        uiActions: mockUiActionsStart,
      });

      expect(start).toEqual({
        IndexPatternSelect: 'MockedIndexPatternSelect',
        SearchBar: 'MockedSearchBar',
        SuggestionsComponent: expect.any(Function),
      });
    });

    it('should create SearchBar with correct dependencies', () => {
      uiService.start(mockCoreStart, {
        dataServices: mockDataServices,
        storage: mockStorage,
        uiActions: mockUiActionsStart,
      });

      expect(createSearchBar).toHaveBeenCalledWith({
        core: mockCoreStart,
        data: mockDataServices,
        storage: mockStorage,
        uiActions: mockUiActionsStart,
        abortControllerRef: expect.any(Object),
      });
    });
  });
});
