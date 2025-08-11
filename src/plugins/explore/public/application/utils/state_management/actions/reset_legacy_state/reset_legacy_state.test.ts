/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resetLegacyStateActionCreator } from './reset_legacy_state';
import { setLegacyState } from '../../slices';
import { getPreloadedLegacyState } from '../../utils/redux_persistence';
import { createMockExploreServices } from '../../__mocks__';

jest.mock('../../slices', () => ({
  setLegacyState: jest.fn(),
}));

jest.mock('../../utils/redux_persistence', () => ({
  getPreloadedLegacyState: jest.fn(),
}));

const mockedSetLegacyState = setLegacyState as jest.MockedFunction<typeof setLegacyState>;
const mockedGetPreloadedLegacyState = getPreloadedLegacyState as jest.MockedFunction<
  typeof getPreloadedLegacyState
>;

describe('resetLegacyStateActionCreator', () => {
  let mockServices: ReturnType<typeof createMockExploreServices>;
  let mockDispatch: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServices = createMockExploreServices();
    mockDispatch = jest.fn();
  });

  it('should return a function that dispatches setLegacyState with preloaded state', () => {
    const mockLegacyState = {
      data: { some: 'data' },
      metadata: { test: 'metadata' },
    };

    mockedGetPreloadedLegacyState.mockReturnValue(mockLegacyState as any);
    mockedSetLegacyState.mockReturnValue({
      type: 'legacy/setLegacyState',
      payload: mockLegacyState,
    } as any);

    // Call the action creator to get the thunk function
    const thunkFunction = resetLegacyStateActionCreator(mockServices);

    // Verify it returns a function
    expect(typeof thunkFunction).toBe('function');

    // Call the thunk function with dispatch
    thunkFunction(mockDispatch);

    // Verify getPreloadedLegacyState was called with services
    expect(mockedGetPreloadedLegacyState).toHaveBeenCalledWith(mockServices);

    // Verify setLegacyState was called with the preloaded state
    expect(mockedSetLegacyState).toHaveBeenCalledWith(mockLegacyState);

    // Verify dispatch was called with the setLegacyState action
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'legacy/setLegacyState',
      payload: mockLegacyState,
    });
  });
});
