/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { useTransformationService } from './use_transformation_service';
import { getServices } from '../../services/services';

jest.mock('../../services/services', () => ({
  getServices: jest.fn(() => ({
    osdUrlStateStorage: undefined,
  })),
}));

const mockGetServices = getServices as jest.MockedFunction<typeof getServices>;

// The builder owns the service; the hook starts and stops it for the editor.
const createBuilder = () => {
  const service = {
    pipeline$: { subscribe: jest.fn((cb) => ({ unsubscribe: jest.fn(), cb })) },
  };
  return {
    service,
    getTransformationService: jest.fn(() => service),
    startTransformations: jest.fn(),
    stopTransformations: jest.fn(),
  };
};

describe('useTransformationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServices.mockReturnValue({ osdUrlStateStorage: undefined } as any);
  });

  it("returns the builder's own service, the same across re-renders", () => {
    const builder = createBuilder();
    const { result, rerender } = renderHook(() => useTransformationService(builder as any));
    expect(result.current).toBe(builder.service);
    rerender();
    expect(result.current).toBe(builder.service);
  });

  it('starts the transformations once, with the URL state storage', () => {
    const urlStateStorage = { get: jest.fn(), set: jest.fn() };
    mockGetServices.mockReturnValue({ osdUrlStateStorage: urlStateStorage } as any);
    const builder = createBuilder();

    const { rerender } = renderHook(() => useTransformationService(builder as any));
    rerender();

    expect(builder.startTransformations).toHaveBeenCalledTimes(1);
    expect(builder.startTransformations).toHaveBeenCalledWith(urlStateStorage);
  });

  it('stops them on unmount, without destroying the builder-owned service', () => {
    const builder = createBuilder();
    const { unmount } = renderHook(() => useTransformationService(builder as any));
    expect(builder.stopTransformations).not.toHaveBeenCalled();

    unmount();
    expect(builder.stopTransformations).toHaveBeenCalledTimes(1);
  });

  // The hook no longer follows the pipeline (the builder's getIsDirty$ does):
  // it('follows the pipeline while onPipelineChange is given, until unmount', () => {
  //   const builder = createBuilder();
  //   const onPipelineChange = jest.fn();
  //   const { unmount } = renderHook(() =>
  //     useTransformationService(builder as any, { onPipelineChange })
  //   );

  //   const [[callback]] = builder.service.pipeline$.subscribe.mock.calls;
  //   expect(callback).toBe(onPipelineChange);
  //   const subscription = builder.service.pipeline$.subscribe.mock.results[0].value;
  //   unmount();
  //   expect(subscription.unsubscribe).toHaveBeenCalled();
  // });
});
