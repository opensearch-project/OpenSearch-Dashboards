/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  detectAndSetOptimalTab,
  canResultsBeVisualized,
  determineOptimalTab,
} from './detect_optimal_tab';
import { setActiveTab } from '../../slices';
import { ExploreServices } from '../../../../../types';
import { defaultPrepareQueryString } from '../query_actions';
import { VisualizationRegistry } from '../../../../../components/visualizations/visualization_registry';

jest.mock('../../slices');
jest.mock('../query_actions');
jest.mock('../../../../../components/visualizations/utils/use_visualization_types');

const mockSetActiveTab = setActiveTab as jest.MockedFunction<typeof setActiveTab>;
const mockDefaultPrepareQueryString = defaultPrepareQueryString as jest.MockedFunction<
  typeof defaultPrepareQueryString
>;

describe('detect_optimal_tab', () => {
  let mockServices: ExploreServices;
  let mockDispatch: jest.Mock;
  let mockGetState: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch = jest.fn();
    mockGetState = jest.fn();

    // Mock services
    mockServices = {
      tabRegistry: {
        getTab: jest.fn(),
        getAllTabs: jest.fn().mockReturnValue([
          { id: 'logs', label: 'Logs' },
          { id: 'explore_visualization_tab', label: 'Visualization' },
        ]),
      },
    } as any;

    // Mock store state
    const mockState = {
      query: {
        query: 'SELECT * FROM logs',
      },
      results: {
        'test-cache-key': {
          hits: {
            hits: [
              { _source: { timestamp: '2023-01-01', level: 'info' } },
              { _source: { timestamp: '2023-01-02', level: 'error' } },
            ],
          },
          fieldSchema: [
            { name: 'timestamp', type: 'date' },
            { name: 'level', type: 'keyword' },
          ],
        },
      },
    };

    mockGetState.mockReturnValue(mockState);

    // Mock tab registry
    (mockServices.tabRegistry!.getTab as jest.Mock).mockReturnValue({
      prepareQuery: jest.fn().mockReturnValue('test-cache-key'),
    });

    mockDefaultPrepareQueryString.mockReturnValue('test-cache-key');
  });

  describe('canResultsBeVisualized', () => {
    it('should return false when results are null or undefined', () => {
      expect(canResultsBeVisualized(null)).toBe(false);
      expect(canResultsBeVisualized(undefined)).toBe(false);
    });

    it('should return false when hits are empty', () => {
      const results = {
        hits: { hits: [] },
        fieldSchema: [{ name: 'test', type: 'string' }],
      };
      expect(canResultsBeVisualized(results)).toBe(false);
    });

    it('should return false when fieldSchema is missing', () => {
      const results = {
        hits: { hits: [{ _source: { test: 'value' } }] },
      };
      expect(canResultsBeVisualized(results)).toBe(false);
    });

    it('should return false when no rule vis match', () => {
      const spy = jest
        .spyOn(VisualizationRegistry.prototype, 'findBestMatch')
        .mockReturnValue(null);

      const results = {
        hits: { hits: [{ _source: { test: 'value' } }] },
        fieldSchema: [{ name: 'test', type: 'string' }],
      };

      expect(canResultsBeVisualized(results)).toBe(false);
      spy.mockRestore();
    });

    it('should return true when getVisualizationType returns a visualization type', () => {
      const spy = jest.spyOn(VisualizationRegistry.prototype, 'findBestMatch').mockReturnValue({
        chartType: { type: 'line', name: 'line', priority: 0, icon: '' },
        rule: {
          id: 'rule-id',
          name: 'rule-name',
          matches: jest.fn(),
          chartTypes: [],
        },
      });

      const results = {
        hits: { hits: [{ _source: { test: 'value' } }] },
        fieldSchema: [{ name: 'test', type: 'string' }],
      };

      expect(canResultsBeVisualized(results)).toBe(true);
      spy.mockRestore();
    });
  });

  describe('determineOptimalTab', () => {
    it('should return visualization tab when results can be visualized', () => {
      const spy = jest.spyOn(VisualizationRegistry.prototype, 'findBestMatch').mockReturnValue({
        chartType: { type: 'line', name: 'line', priority: 0, icon: '' },
        rule: {
          id: 'rule-id',
          name: 'rule-name',
          matches: jest.fn(),
          chartTypes: [],
        },
      });

      const results = {
        hits: { hits: [{ _source: { test: 'value' } }] },
        fieldSchema: [{ name: 'test', type: 'string' }],
      };

      expect(determineOptimalTab(results, mockServices)).toBe('explore_visualization_tab');
      spy.mockRestore();
    });

    it('should return logs tab when results cannot be visualized', () => {
      const spy = jest
        .spyOn(VisualizationRegistry.prototype, 'findBestMatch')
        .mockReturnValue(null);

      const results = {
        hits: { hits: [{ _source: { test: 'value' } }] },
        fieldSchema: [{ name: 'test', type: 'string' }],
      };

      expect(determineOptimalTab(results, mockServices)).toBe('logs');
      spy.mockRestore();
    });
  });

  describe('detectAndSetOptimalTab', () => {
    it('should detect optimal tab when results are available', async () => {
      const spy = jest.spyOn(VisualizationRegistry.prototype, 'findBestMatch').mockReturnValue({
        chartType: { type: 'line', name: 'line', priority: 0, icon: '' },
        rule: {
          id: 'rule-id',
          name: 'rule-name',
          matches: jest.fn(),
          chartTypes: [],
        },
      });

      const mockAction = { type: 'setActiveTab', payload: 'explore_visualization_tab' };
      mockSetActiveTab.mockReturnValue(mockAction);

      const thunk = detectAndSetOptimalTab({
        services: mockServices,
      });

      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockServices.tabRegistry!.getTab).toHaveBeenCalledWith('explore_visualization_tab');
      expect(mockSetActiveTab).toHaveBeenCalledWith('explore_visualization_tab');
      expect(mockDispatch).toHaveBeenCalledWith(mockAction);
      spy.mockRestore();
    });

    it('should not set tab when no results are available', async () => {
      const mockStateWithoutResults = {
        query: { query: 'SELECT * FROM logs' },
        results: {},
      };
      mockGetState.mockReturnValue(mockStateWithoutResults);

      const thunk = detectAndSetOptimalTab({
        services: mockServices,
      });

      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockSetActiveTab).not.toHaveBeenCalled();
    });

    it('should not set tab when results have no hits', async () => {
      const mockStateWithEmptyResults = {
        query: { query: 'SELECT * FROM logs' },
        results: {
          'test-cache-key': {
            hits: { hits: [] },
            fieldSchema: [{ name: 'test', type: 'string' }],
          },
        },
      };
      mockGetState.mockReturnValue(mockStateWithEmptyResults);

      const thunk = detectAndSetOptimalTab({
        services: mockServices,
      });

      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockSetActiveTab).not.toHaveBeenCalled();
    });

    it('should use defaultPrepareQueryString when tab has no prepareQuery function', async () => {
      (mockServices.tabRegistry!.getTab as jest.Mock).mockReturnValue({
        prepareQuery: undefined,
      });

      const spy = jest.spyOn(VisualizationRegistry.prototype, 'findBestMatch').mockReturnValue({
        chartType: { type: 'line', name: 'line', priority: 0, icon: '' },
        rule: {
          id: 'rule-id',
          name: 'rule-name',
          matches: jest.fn(),
          chartTypes: [],
        },
      });

      const mockAction = { type: 'setActiveTab', payload: 'explore_visualization_tab' };
      mockSetActiveTab.mockReturnValue(mockAction);

      const thunk = detectAndSetOptimalTab({
        services: mockServices,
      });

      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockDefaultPrepareQueryString).toHaveBeenCalledWith({
        query: 'SELECT * FROM logs',
      });
      expect(mockSetActiveTab).toHaveBeenCalledWith('explore_visualization_tab');
      spy.mockRestore();
    });

    it('should set logs tab when results cannot be visualized', async () => {
      const spy = jest
        .spyOn(VisualizationRegistry.prototype, 'findBestMatch')
        .mockReturnValue(null);

      const mockAction = { type: 'setActiveTab', payload: 'logs' };
      mockSetActiveTab.mockReturnValue(mockAction);

      const thunk = detectAndSetOptimalTab({
        services: mockServices,
      });

      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockSetActiveTab).toHaveBeenCalledWith('logs');
      expect(mockDispatch).toHaveBeenCalledWith(mockAction);
      spy.mockRestore();
    });
  });
});
