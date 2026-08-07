/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { useTransformationService } from './use_transformation_service';
import { TransformationService } from './transformation_service';
import * as registerModule from './register_all_transformations';
import { getServices } from '../../services/services';

jest.mock('./register_all_transformations', () => ({
  registerAllTransformations: jest.fn(),
}));

jest.mock('../../services/services', () => ({
  getServices: jest.fn(() => ({
    osdUrlStateStorage: undefined,
  })),
}));

const mockGetServices = getServices as jest.MockedFunction<typeof getServices>;

const mockVisualizationBuilder = {
  setTransformationService: jest.fn(),
};

describe('useTransformationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a TransformationService instance', () => {
    const { result } = renderHook(() => useTransformationService(mockVisualizationBuilder as any));
    expect(result.current).toBeInstanceOf(TransformationService);
  });

  it('returns the same instance across re-renders', () => {
    const { result, rerender } = renderHook(() =>
      useTransformationService(mockVisualizationBuilder as any)
    );
    const firstInstance = result.current;
    rerender();
    expect(result.current).toBe(firstInstance);
  });

  it('calls setTransformationService on visualizationBuilder', () => {
    renderHook(() => useTransformationService(mockVisualizationBuilder as any));
    expect(mockVisualizationBuilder.setTransformationService).toHaveBeenCalledTimes(1);
    expect(mockVisualizationBuilder.setTransformationService).toHaveBeenCalledWith(
      expect.any(TransformationService)
    );
  });

  it('calls registerAllTransformations', () => {
    const spy = jest.spyOn(registerModule, 'registerAllTransformations');
    renderHook(() => useTransformationService(mockVisualizationBuilder as any));
    expect(spy).toHaveBeenCalledWith(expect.any(TransformationService));
  });

  it('destroys service on unmount', () => {
    const { result, unmount } = renderHook(() =>
      useTransformationService(mockVisualizationBuilder as any)
    );
    const destroySpy = jest.spyOn(result.current, 'destroy');
    unmount();
    expect(destroySpy).toHaveBeenCalled();
  });

  it('subscribes to pipeline$ when onPipelineChange is provided', () => {
    const onPipelineChange = jest.fn();
    const { result } = renderHook(() =>
      useTransformationService(mockVisualizationBuilder as any, { onPipelineChange })
    );
    result.current.pipeline$.next([]);
    expect(onPipelineChange).toHaveBeenCalled();
  });

  it('unsubscribes from pipeline$ on unmount', () => {
    const onPipelineChange = jest.fn();
    const { result, unmount } = renderHook(() =>
      useTransformationService(mockVisualizationBuilder as any, { onPipelineChange })
    );
    unmount();
    result.current.pipeline$.next([]);
    expect(onPipelineChange).toHaveBeenCalledTimes(1);
  });

  it('initializes URL sync when osdUrlStateStorage is available', () => {
    const mockUrlStateStorage = { get: jest.fn(), set: jest.fn() };
    mockGetServices.mockReturnValue({ osdUrlStateStorage: mockUrlStateStorage } as any);

    const { result } = renderHook(() => useTransformationService(mockVisualizationBuilder as any));
    expect(result.current).toBeInstanceOf(TransformationService);
  });
});
