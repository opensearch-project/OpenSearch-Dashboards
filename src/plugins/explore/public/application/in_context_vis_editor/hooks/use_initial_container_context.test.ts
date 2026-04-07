/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { useInitialContainerContext } from './use_initial_container_context';
import { getServices } from '../../../services/services';
import { CONTAINER_URL_KEY } from '../utils';

jest.mock('../../../services/services');

const mockOsdUrlStateStorage = {
  set: jest.fn(),
  get: jest.fn(),
};

const mockGetIncomingEditorState = jest.fn();

const mockServices = {
  osdUrlStateStorage: mockOsdUrlStateStorage,
  embeddable: {
    getStateTransfer: jest.fn().mockReturnValue({
      getIncomingEditorState: mockGetIncomingEditorState,
    }),
  },
  scopedHistory: {},
};

beforeEach(() => {
  jest.clearAllMocks();
  (getServices as jest.Mock).mockReturnValue(mockServices);
});

describe('useInitialContainerContext', () => {
  it('returns default context when no incoming state and no URL state', () => {
    mockGetIncomingEditorState.mockReturnValue(undefined);
    mockOsdUrlStateStorage.get.mockReturnValue(null);

    const { result } = renderHook(() => useInitialContainerContext());

    expect(result.current.context).toEqual({
      originatingApp: undefined,
      containerInfo: undefined,
    });
  });

  it('uses incoming state transfer when available and updates URL', () => {
    const incomingState = {
      originatingApp: 'dashboards',
      containerInfo: { containerName: 'My Dashboard', containerId: '123' },
    };
    mockGetIncomingEditorState.mockReturnValue(incomingState);

    const { result } = renderHook(() => useInitialContainerContext());

    expect(result.current.context).toEqual({
      originatingApp: 'dashboards',
      containerInfo: { containerName: 'My Dashboard', containerId: '123' },
    });
    expect(mockOsdUrlStateStorage.set).toHaveBeenCalledWith(CONTAINER_URL_KEY, incomingState, {
      replace: true,
    });
  });

  it('falls back to URL state when no incoming state', () => {
    mockGetIncomingEditorState.mockReturnValue(undefined);
    const urlState = { originatingApp: 'dashboards', containerInfo: undefined };
    mockOsdUrlStateStorage.get.mockReturnValue(urlState);

    const { result } = renderHook(() => useInitialContainerContext());

    expect(result.current.context).toEqual(urlState);
    expect(mockOsdUrlStateStorage.set).not.toHaveBeenCalled();
  });

  it('does not update URL when osdUrlStateStorage is undefined', () => {
    const incomingState = { originatingApp: 'dashboards', containerInfo: undefined };
    mockGetIncomingEditorState.mockReturnValue(incomingState);
    (getServices as jest.Mock).mockReturnValue({ ...mockServices, osdUrlStateStorage: undefined });

    const { result } = renderHook(() => useInitialContainerContext());

    expect(result.current.context.originatingApp).toBe('dashboards');
    expect(mockOsdUrlStateStorage.set).not.toHaveBeenCalled();
  });
});
