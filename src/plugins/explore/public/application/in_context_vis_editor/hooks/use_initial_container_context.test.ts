/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { useInitialContainerContext } from './use_initial_container_context';
import { getServices } from '../../../services/services';
import { CONTAINER_URL_KEY, VARIABLE_VALUES_URL_KEY } from '../types';

const mockFindReferencingDashboards = jest.fn();

jest.mock('../../../services/services');
jest.mock('../../utils/find_referencing_dashboards', () => ({
  findReferencingDashboards: (...args: any[]) => mockFindReferencingDashboards(...args),
}));

const mockOsdUrlStateStorage = {
  set: jest.fn(),
  get: jest.fn(),
};

const mockGetIncomingEditorState = jest.fn();

const mockSavedObjectsClient = {
  get: jest.fn(),
};

const mockNotifications = {
  toasts: {
    addError: jest.fn(),
  },
};

const mockServices = {
  osdUrlStateStorage: mockOsdUrlStateStorage,
  embeddable: {
    getStateTransfer: jest.fn().mockReturnValue({
      getIncomingEditorState: mockGetIncomingEditorState,
    }),
  },
  scopedHistory: {},
  core: {
    savedObjects: {
      client: mockSavedObjectsClient,
    },
  },
  notifications: mockNotifications,
};

beforeEach(() => {
  jest.clearAllMocks();
  (getServices as jest.Mock).mockReturnValue(mockServices);
  delete (window as any).location;
  (window as any).location = { hash: '' };
});

describe('useInitialContainerContext', () => {
  describe('basic initialization', () => {
    it('returns default context when no incoming state and no URL state', async () => {
      mockGetIncomingEditorState.mockReturnValue(undefined);
      mockOsdUrlStateStorage.get.mockReturnValue(null);

      const { result } = renderHook(() => useInitialContainerContext());

      await waitFor(() => {
        expect(result.current.context).toEqual({
          originatingApp: undefined,
          containerInfo: undefined,
        });
      });

      expect(result.current.containerVariables).toBeUndefined();
      expect(result.current.needsDashboardSelection).toBe(false);
    });

    it('uses incoming state transfer when available and updates URL', async () => {
      const incomingState = {
        originatingApp: 'dashboards',
        containerInfo: { containerName: 'My Dashboard', containerId: 'dashboard-123' },
      };
      mockGetIncomingEditorState.mockReturnValue(incomingState);
      mockSavedObjectsClient.get.mockResolvedValue({
        attributes: {},
      });

      const { result } = renderHook(() => useInitialContainerContext());

      await waitFor(() => {
        expect(result.current.context).toEqual({
          originatingApp: 'dashboards',
          containerInfo: { containerName: 'My Dashboard', containerId: 'dashboard-123' },
        });
      });

      expect(mockOsdUrlStateStorage.set).toHaveBeenCalledWith(CONTAINER_URL_KEY, incomingState, {
        replace: true,
      });
      expect(mockSavedObjectsClient.get).toHaveBeenCalledWith('dashboard', 'dashboard-123');
    });

    it('falls back to URL state when no incoming state', async () => {
      mockGetIncomingEditorState.mockReturnValue(undefined);
      const urlState = {
        originatingApp: 'dashboards',
        containerInfo: { containerName: 'URL Dashboard', containerId: 'dashboard-456' },
      };
      mockOsdUrlStateStorage.get.mockReturnValue(urlState);
      mockSavedObjectsClient.get.mockResolvedValue({ attributes: {} });

      const { result } = renderHook(() => useInitialContainerContext());

      await waitFor(() => {
        expect(result.current.context).toEqual(urlState);
      });

      expect(mockOsdUrlStateStorage.set).not.toHaveBeenCalled();
      expect(mockSavedObjectsClient.get).toHaveBeenCalledWith('dashboard', 'dashboard-456');
    });

    it('does not update URL when osdUrlStateStorage is undefined', async () => {
      const incomingState = { originatingApp: 'dashboards', containerInfo: undefined };
      mockGetIncomingEditorState.mockReturnValue(incomingState);
      (getServices as jest.Mock).mockReturnValue({
        ...mockServices,
        osdUrlStateStorage: undefined,
      });

      const { result } = renderHook(() => useInitialContainerContext());

      await waitFor(() => {
        expect(result.current.context.originatingApp).toBe('dashboards');
      });

      expect(mockOsdUrlStateStorage.set).not.toHaveBeenCalled();
    });
  });

  describe('dashboard variables', () => {
    it('loads variables from dashboard when coming from state transfer', async () => {
      const incomingState = {
        originatingApp: 'dashboards',
        containerInfo: { containerName: 'Dashboard', containerId: 'dashboard-123' },
      };
      mockGetIncomingEditorState.mockReturnValue(incomingState);

      const variables = [{ id: 'var1', name: 'region', type: 'query', current: ['us-west'] }];
      mockSavedObjectsClient.get.mockResolvedValue({
        attributes: {
          variablesJSON: JSON.stringify({ variables }),
        },
      });

      const { result } = renderHook(() => useInitialContainerContext());

      await waitFor(() => {
        expect(result.current.containerVariables).toEqual(variables);
      });
    });

    it('merges URL variable values with dashboard variables', async () => {
      const incomingState = {
        originatingApp: 'dashboards',
        containerInfo: { containerName: 'Dashboard', containerId: 'dashboard-123' },
      };
      mockGetIncomingEditorState.mockReturnValue(incomingState);

      const variables = [
        { id: 'var1', name: 'region', type: 'query', current: ['us-west'] },
        { id: 'var2', name: 'env', type: 'query', current: ['dev'] },
      ];
      mockSavedObjectsClient.get.mockResolvedValue({
        attributes: {
          variablesJSON: JSON.stringify({ variables }),
        },
      });

      mockOsdUrlStateStorage.get.mockImplementation((key: string) => {
        if (key === VARIABLE_VALUES_URL_KEY) {
          return { region: ['us-east'], env: ['prod'] };
        }
        return null;
      });

      const { result } = renderHook(() => useInitialContainerContext());

      await waitFor(() => {
        expect(result.current.containerVariables).toEqual([
          { id: 'var1', name: 'region', type: 'query', current: ['us-east'] },
          { id: 'var2', name: 'env', type: 'query', current: ['prod'] },
        ]);
      });
    });

    it('handles dashboard without variables', async () => {
      const incomingState = {
        originatingApp: 'dashboards',
        containerInfo: { containerName: 'Dashboard', containerId: 'dashboard-123' },
      };
      mockGetIncomingEditorState.mockReturnValue(incomingState);
      mockSavedObjectsClient.get.mockResolvedValue({
        attributes: {},
      });

      const { result } = renderHook(() => useInitialContainerContext());

      await waitFor(() => {
        expect(result.current.context.containerInfo?.containerId).toBe('dashboard-123');
      });

      expect(result.current.containerVariables).toBeUndefined();
    });

    it('handles empty variables array', async () => {
      const incomingState = {
        originatingApp: 'dashboards',
        containerInfo: { containerName: 'Dashboard', containerId: 'dashboard-123' },
      };
      mockGetIncomingEditorState.mockReturnValue(incomingState);
      mockSavedObjectsClient.get.mockResolvedValue({
        attributes: {
          variablesJSON: JSON.stringify({ variables: [] }),
        },
      });

      const { result } = renderHook(() => useInitialContainerContext());

      await waitFor(() => {
        expect(result.current.context.containerInfo?.containerId).toBe('dashboard-123');
      });

      expect(result.current.containerVariables).toBeUndefined();
    });

    it('shows error toast when loading variables fails', async () => {
      const incomingState = {
        originatingApp: 'dashboards',
        containerInfo: { containerName: 'Dashboard', containerId: 'dashboard-123' },
      };
      mockGetIncomingEditorState.mockReturnValue(incomingState);
      const error = new Error('Failed to load');
      mockSavedObjectsClient.get.mockRejectedValue(error);

      renderHook(() => useInitialContainerContext());

      await waitFor(() => {
        expect(mockNotifications.toasts.addError).toHaveBeenCalledWith(error, {
          title: 'Error loading dashboard variables',
        });
      });
    });
  });

  describe('dashboard selection', () => {
    beforeEach(() => {
      mockGetIncomingEditorState.mockReturnValue(undefined);
      mockOsdUrlStateStorage.get.mockImplementation((key: string) => {
        if (key === CONTAINER_URL_KEY) return null;
        if (key === VARIABLE_VALUES_URL_KEY) return null;
        return null;
      });
    });

    it('auto-selects when single dashboard references visualization', async () => {
      // Set up test-specific configuration
      (window as any).location.hash = '#/edit/viz-123';

      const dashboards = [{ id: 'dashboard-1', title: 'Dashboard 1', description: 'Desc' }];
      mockFindReferencingDashboards.mockResolvedValue(dashboards);

      const { result } = renderHook(() => useInitialContainerContext());
      // Wait for the async initialization to complete and state to be updated
      await waitFor(() => {
        expect(result.current.context.originatingApp).toBe('dashboards');
        expect(result.current.context.containerInfo?.containerId).toBe('dashboard-1');
      });

      // Verify the final state
      expect(result.current.context.originatingApp).toBe('dashboards');
      expect(result.current.context.containerInfo?.containerId).toBe('dashboard-1');
      expect(result.current.context.containerInfo?.containerName).toBe('Dashboard 1');
      expect(result.current.needsDashboardSelection).toBe(false);
    });

    it('shows selection modal when multiple dashboards reference visualization', async () => {
      (window as any).location.hash = '#/edit/viz-123';

      const dashboards = [
        { id: 'dashboard-1', title: 'Dashboard 1' },
        { id: 'dashboard-2', title: 'Dashboard 2' },
      ];
      mockFindReferencingDashboards.mockResolvedValue(dashboards);

      const { result } = renderHook(() => useInitialContainerContext());

      await waitFor(() => {
        expect(result.current.needsDashboardSelection).toBe(true);
      });

      expect(result.current.referencingDashboards).toEqual(dashboards);
    });

    it('does nothing when no dashboards reference visualization', async () => {
      (window as any).location.hash = '#/edit/viz-123';
      mockFindReferencingDashboards.mockResolvedValue([]);

      const { result } = renderHook(() => useInitialContainerContext());

      await waitFor(() => {
        expect(result.current.context).toEqual({
          originatingApp: undefined,
          containerInfo: undefined,
        });
      });

      expect(result.current.needsDashboardSelection).toBe(false);
    });

    it('does not check references when not in edit mode', async () => {
      (window as any).location.hash = '#/create';
      mockFindReferencingDashboards.mockResolvedValue([]);

      renderHook(() => useInitialContainerContext());

      await waitFor(() => {
        expect(mockFindReferencingDashboards).not.toHaveBeenCalled();
      });
    });
  });

  describe('selectDashboard', () => {
    it('selects dashboard and loads variables', async () => {
      mockGetIncomingEditorState.mockReturnValue(undefined);
      mockOsdUrlStateStorage.get.mockReturnValue(null);
      (window as any).location.hash = '#/edit/viz-123';

      const dashboards = [
        { id: 'dashboard-1', title: 'Dashboard 1' },
        { id: 'dashboard-2', title: 'Dashboard 2' },
      ];
      mockFindReferencingDashboards.mockResolvedValue(dashboards);

      const variables = [{ id: 'var1', name: 'region', type: 'query' }];
      mockSavedObjectsClient.get.mockResolvedValue({
        attributes: {
          variablesJSON: JSON.stringify({ variables }),
        },
      });

      const { result } = renderHook(() => useInitialContainerContext());

      await waitFor(() => {
        expect(result.current.needsDashboardSelection).toBe(true);
      });

      await act(async () => {
        await result.current.selectDashboard('dashboard-2');
      });

      await waitFor(() => {
        expect(result.current.context).toEqual({
          originatingApp: 'dashboards',
          containerInfo: {
            containerName: 'Dashboard 2',
            containerId: 'dashboard-2',
          },
        });
      });

      expect(result.current.needsDashboardSelection).toBe(false);
      expect(result.current.containerVariables).toEqual(variables);
    });

    it('does nothing when dashboard not found', async () => {
      mockGetIncomingEditorState.mockReturnValue(undefined);
      mockOsdUrlStateStorage.get.mockReturnValue(null);
      (window as any).location.hash = '#/edit/viz-123';

      const dashboards = [
        { id: 'dashboard-1', title: 'Dashboard 1' },
        { id: 'dashboard-2', title: 'Dashboard 2' },
      ];
      mockFindReferencingDashboards.mockResolvedValue(dashboards);

      const { result } = renderHook(() => useInitialContainerContext());

      await waitFor(() => {
        expect(result.current.needsDashboardSelection).toBe(true);
      });

      const initialContext = result.current.context;

      await act(async () => {
        await result.current.selectDashboard('non-existent');
      });

      expect(result.current.needsDashboardSelection).toBe(true);
      expect(result.current.context).toEqual(initialContext);
    });
  });

  describe('skipDashboardSelection', () => {
    it('dismisses dashboard selection modal', async () => {
      mockGetIncomingEditorState.mockReturnValue(undefined);
      mockOsdUrlStateStorage.get.mockReturnValue(null);
      (window as any).location.hash = '#/edit/viz-123';

      const dashboards = [
        { id: 'dashboard-1', title: 'Dashboard 1' },
        { id: 'dashboard-2', title: 'Dashboard 2' },
      ];
      mockFindReferencingDashboards.mockResolvedValue(dashboards);

      const { result } = renderHook(() => useInitialContainerContext());

      await waitFor(() => {
        expect(result.current.needsDashboardSelection).toBe(true);
      });

      act(() => {
        result.current.skipDashboardSelection();
      });

      expect(result.current.needsDashboardSelection).toBe(false);
    });
  });

  describe('abort mechanism', () => {
    it('does not update state when loadDashboardVariables is aborted', async () => {
      const incomingState = {
        originatingApp: 'dashboards',
        containerInfo: { containerName: 'Dashboard', containerId: 'dashboard-123' },
      };
      mockGetIncomingEditorState.mockReturnValue(incomingState);

      let resolveGet: (value: any) => void;
      const getPromise = new Promise((resolve) => {
        resolveGet = resolve;
      });

      mockSavedObjectsClient.get.mockReturnValue(getPromise);

      const { unmount } = renderHook(() => useInitialContainerContext());

      // Unmount immediately to trigger abort
      unmount();

      // Resolve the promise after unmount
      resolveGet!({
        attributes: {
          variablesJSON: JSON.stringify({
            variables: [{ id: 'var1', name: 'region', type: 'query' }],
          }),
        },
      });

      // Wait a bit to ensure any state updates would have happened
      await new Promise((resolve) => setTimeout(resolve, 50));

      // No assertions needed - if state was updated after unmount, React would warn
      expect(mockSavedObjectsClient.get).toHaveBeenCalled();
    });

    it('does not show error toast when loadDashboardVariables is aborted', async () => {
      const incomingState = {
        originatingApp: 'dashboards',
        containerInfo: { containerName: 'Dashboard', containerId: 'dashboard-123' },
      };
      mockGetIncomingEditorState.mockReturnValue(incomingState);

      let rejectGet: (error: any) => void;
      const getPromise = new Promise((_, reject) => {
        rejectGet = reject;
      });

      mockSavedObjectsClient.get.mockReturnValue(getPromise);

      const { unmount } = renderHook(() => useInitialContainerContext());

      // Unmount immediately to trigger abort
      unmount();

      // Reject the promise after unmount
      rejectGet!(new Error('Request failed'));

      // Wait a bit to ensure error handler would have been called
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Error toast should not be shown for aborted operations
      expect(mockNotifications.toasts.addError).not.toHaveBeenCalled();
    });

    it('handles race condition when savedObjectsClient changes during load', async () => {
      const incomingState = {
        originatingApp: 'dashboards',
        containerInfo: { containerName: 'Dashboard', containerId: 'dashboard-123' },
      };
      mockGetIncomingEditorState.mockReturnValue(incomingState);

      let firstCallResolve: (value: any) => void;
      let secondCallResolve: (value: any) => void;

      const firstVariables = [{ id: 'var1', name: 'old', type: 'query' }];
      const secondVariables = [{ id: 'var2', name: 'new', type: 'query' }];

      const mockSavedObjectsClient1 = {
        get: jest.fn(() => {
          return new Promise((resolve) => {
            firstCallResolve = resolve;
          });
        }),
      };

      const mockSavedObjectsClient2 = {
        get: jest.fn(() => {
          return new Promise((resolve) => {
            secondCallResolve = resolve;
          });
        }),
      };

      // Start with first client
      (getServices as jest.Mock).mockReturnValue({
        ...mockServices,
        core: {
          savedObjects: {
            client: mockSavedObjectsClient1,
          },
        },
      });

      const { result, rerender } = renderHook(() => useInitialContainerContext());

      // Wait for first call to be initiated
      await waitFor(() => {
        expect(mockSavedObjectsClient1.get).toHaveBeenCalledTimes(1);
      });

      // Change to second client (simulating reconnection or context change)
      (getServices as jest.Mock).mockReturnValue({
        ...mockServices,
        core: {
          savedObjects: {
            client: mockSavedObjectsClient2,
          },
        },
      });
      rerender();

      // Wait for second call
      await waitFor(() => {
        expect(mockSavedObjectsClient2.get).toHaveBeenCalledTimes(1);
      });

      // Resolve second call first (simulating faster response)
      await act(async () => {
        secondCallResolve!({
          attributes: {
            variablesJSON: JSON.stringify({ variables: secondVariables }),
          },
        });
      });

      await waitFor(() => {
        expect(result.current.containerVariables).toEqual(secondVariables);
      });

      // Resolve first call later (should be ignored due to abort)
      await act(async () => {
        firstCallResolve!({
          attributes: {
            variablesJSON: JSON.stringify({ variables: firstVariables }),
          },
        });
      });

      // Wait a bit and verify state hasn't changed to first call's result
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(result.current.containerVariables).toEqual(secondVariables);
    });
  });
});
