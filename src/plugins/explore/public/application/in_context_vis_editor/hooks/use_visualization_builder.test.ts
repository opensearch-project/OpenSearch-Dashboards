/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { getServices } from '../../../services/services';
import { useVisualizationBuilder } from './use_visualization_builder';
import { VisualizationBuilder } from '../../../components/visualizations/visualization_builder';

jest.mock('../../../services/services', () => ({
  getServices: jest.fn(),
}));

jest.mock('../../../components/visualizations/visualization_builder', () => ({
  VisualizationBuilder: jest.fn().mockImplementation((options: any) => ({
    init: jest.fn(),
    dispose: jest.fn(),
    reset: jest.fn(),
    setVisConfig: jest.fn(),
    visConfig$: { value: undefined },
    data$: { value: undefined },
    showRawTable$: { value: false },
    isVisDirty$: { value: false },
    setShowRawTable: jest.fn(),
    setIsVisDirty: jest.fn(),
    onChartTypeChange: jest.fn(),
    updateStyles: jest.fn(),
    setAxesMapping: jest.fn(),
    handleData: jest.fn(),
    options,
  })),
}));

const mockOsdUrlStateStorage = {
  get: jest.fn(),
  set: jest.fn(),
};

describe('useVisualizationBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (getServices as jest.Mock).mockReturnValue({
      osdUrlStateStorage: mockOsdUrlStateStorage,
    });
  });

  describe('singleton pattern', () => {
    it('creates a new VisualizationBuilder instance on first call', () => {
      const { result } = renderHook(() => useVisualizationBuilder());

      expect(VisualizationBuilder).toHaveBeenCalledTimes(1);
      expect(result.current.visualizationBuilderForEditor).toBeDefined();
    });

    it('returns the same instance on subsequent calls', () => {
      const { result: result1 } = renderHook(() => useVisualizationBuilder());
      const { result: result2 } = renderHook(() => useVisualizationBuilder());
      const { result: result3 } = renderHook(() => useVisualizationBuilder());

      expect(result1.current.visualizationBuilderForEditor).toBe(
        result2.current.visualizationBuilderForEditor
      );
      expect(result2.current.visualizationBuilderForEditor).toBe(
        result3.current.visualizationBuilderForEditor
      );
      expect(result1.current.visualizationBuilderForEditor).toBe(
        result3.current.visualizationBuilderForEditor
      );
    });

    it('returned visualizationBuilderForEditor has expected property', () => {
      const { result } = renderHook(() => useVisualizationBuilder());

      expect(result.current.visualizationBuilderForEditor).toHaveProperty('init');
      expect(result.current.visualizationBuilderForEditor).toHaveProperty('dispose');
      expect(result.current.visualizationBuilderForEditor).toHaveProperty('reset');
      expect(result.current.visualizationBuilderForEditor).toHaveProperty('setVisConfig');
      expect(result.current.visualizationBuilderForEditor).toHaveProperty('visConfig$');
      expect(result.current.visualizationBuilderForEditor).toHaveProperty('data$');
      expect(result.current.visualizationBuilderForEditor).toHaveProperty('showRawTable$');
      expect(result.current.visualizationBuilderForEditor).toHaveProperty('isVisDirty$');
    });
  });
});
