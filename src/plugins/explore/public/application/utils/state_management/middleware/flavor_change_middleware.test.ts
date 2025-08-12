/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createFlavorChangeMiddleware } from './flavor_change_middleware';
import { setColumns } from '../slices';
import { getCurrentFlavor } from '../../../../utils/flavor_utils';
import { ExploreFlavor, DEFAULT_TRACE_COLUMNS_SETTING } from '../../../../../common';

jest.mock('../../../../utils/flavor_utils');
jest.mock('../slices', () => ({
  setColumns: jest.fn(),
}));

const mockedGetCurrentFlavor = getCurrentFlavor as jest.MockedFunction<typeof getCurrentFlavor>;
const mockedSetColumns = setColumns as jest.MockedFunction<typeof setColumns>;

describe('createFlavorChangeMiddleware', () => {
  let mockStore: any;
  let mockNext: jest.Mock;
  let mockServices: any;
  let middleware: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStore = {
      dispatch: jest.fn(),
      getState: jest.fn(),
    };

    mockNext = jest.fn((action) => action);

    mockServices = {
      uiSettings: {
        get: jest.fn(),
      },
    };

    middleware = createFlavorChangeMiddleware(mockServices)(mockStore)(mockNext);

    mockedSetColumns.mockReturnValue({ type: 'legacy/setColumns', payload: [] });
  });

  it('should pass action to next middleware', () => {
    const action = { type: 'test/action' };
    mockedGetCurrentFlavor.mockReturnValue(ExploreFlavor.Logs);

    middleware(action);

    expect(mockNext).toHaveBeenCalledWith(action);
  });

  it('should dispatch setColumns with trace columns when flavor changes to traces', () => {
    const traceColumns = [
      'spanId',
      'status.code',
      'attributes.http.status_code',
      'serviceName',
      'name',
      'durationInNanos',
    ];
    mockServices.uiSettings.get.mockImplementation((setting: string) => {
      if (setting === DEFAULT_TRACE_COLUMNS_SETTING) {
        return traceColumns;
      }
      return ['_source'];
    });

    mockedGetCurrentFlavor.mockReturnValue(ExploreFlavor.Logs);
    middleware({ type: 'test/action1' });

    mockedGetCurrentFlavor.mockReturnValue(ExploreFlavor.Traces);
    mockedSetColumns.mockReturnValue({ type: 'legacy/setColumns', payload: traceColumns });
    middleware({ type: 'test/action2' });

    expect(mockStore.dispatch).toHaveBeenCalledWith({
      type: 'legacy/setColumns',
      payload: traceColumns,
    });
    expect(mockServices.uiSettings.get).toHaveBeenCalledWith(DEFAULT_TRACE_COLUMNS_SETTING);
  });

  it('should dispatch setColumns with default columns when flavor changes to logs', () => {
    const defaultColumns = ['_source'];
    mockServices.uiSettings.get.mockImplementation((setting: string) => {
      if (setting === 'defaultColumns') {
        return defaultColumns;
      }
      return ['spanId', 'status.code'];
    });

    mockedGetCurrentFlavor.mockReturnValue(ExploreFlavor.Traces);
    middleware({ type: 'test/action1' });

    mockedGetCurrentFlavor.mockReturnValue(ExploreFlavor.Logs);
    mockedSetColumns.mockReturnValue({ type: 'legacy/setColumns', payload: defaultColumns });
    middleware({ type: 'test/action2' });

    expect(mockStore.dispatch).toHaveBeenCalledWith({
      type: 'legacy/setColumns',
      payload: defaultColumns,
    });
    expect(mockServices.uiSettings.get).toHaveBeenCalledWith('defaultColumns');
  });

  it('should dispatch setColumns with default columns when flavor changes to metrics', () => {
    const defaultColumns = ['_source'];
    mockServices.uiSettings.get.mockImplementation((setting: string) => {
      if (setting === 'defaultColumns') {
        return defaultColumns;
      }
      return ['spanId', 'status.code'];
    });

    mockedGetCurrentFlavor.mockReturnValue(ExploreFlavor.Traces);
    middleware({ type: 'test/action1' });

    mockedGetCurrentFlavor.mockReturnValue(ExploreFlavor.Metrics);
    mockedSetColumns.mockReturnValue({ type: 'legacy/setColumns', payload: defaultColumns });
    middleware({ type: 'test/action2' });

    expect(mockStore.dispatch).toHaveBeenCalledWith({
      type: 'legacy/setColumns',
      payload: defaultColumns,
    });
    expect(mockServices.uiSettings.get).toHaveBeenCalledWith('defaultColumns');
  });

  it('should not dispatch setColumns when flavor has not changed', () => {
    mockedGetCurrentFlavor.mockReturnValue(ExploreFlavor.Logs);

    middleware({ type: 'test/action1' });
    middleware({ type: 'test/action2' });

    expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
  });

  it('should handle flavor changes from logs to traces to logs', () => {
    const traceColumns = [
      'spanId',
      'status.code',
      'attributes.http.status_code',
      'serviceName',
      'name',
      'durationInNanos',
    ];
    const defaultColumns = ['_source'];

    mockServices.uiSettings.get.mockImplementation((setting: string) => {
      if (setting === DEFAULT_TRACE_COLUMNS_SETTING) {
        return traceColumns;
      }
      return defaultColumns;
    });

    mockedGetCurrentFlavor.mockReturnValue(ExploreFlavor.Logs);
    mockedSetColumns.mockReturnValue({ type: 'legacy/setColumns', payload: defaultColumns });
    middleware({ type: 'test/action1' });

    mockedGetCurrentFlavor.mockReturnValue(ExploreFlavor.Traces);
    mockedSetColumns.mockReturnValue({ type: 'legacy/setColumns', payload: traceColumns });
    middleware({ type: 'test/action2' });

    mockedGetCurrentFlavor.mockReturnValue(ExploreFlavor.Logs);
    mockedSetColumns.mockReturnValue({ type: 'legacy/setColumns', payload: defaultColumns });
    middleware({ type: 'test/action3' });

    expect(mockStore.dispatch).toHaveBeenCalledTimes(3);
    expect(mockStore.dispatch).toHaveBeenNthCalledWith(1, {
      type: 'legacy/setColumns',
      payload: defaultColumns,
    });
    expect(mockStore.dispatch).toHaveBeenNthCalledWith(2, {
      type: 'legacy/setColumns',
      payload: traceColumns,
    });
    expect(mockStore.dispatch).toHaveBeenNthCalledWith(3, {
      type: 'legacy/setColumns',
      payload: defaultColumns,
    });
  });

  it('should use fallback columns when uiSettings returns undefined', () => {
    const fallbackTraceColumns = [
      'spanId',
      'status.code',
      'attributes.http.status_code',
      'serviceName',
      'name',
      'durationInNanos',
    ];
    const fallbackDefaultColumns = ['_source'];

    mockServices.uiSettings.get.mockReturnValue(undefined);

    mockedGetCurrentFlavor.mockReturnValue(ExploreFlavor.Logs);
    mockedSetColumns.mockReturnValue({
      type: 'legacy/setColumns',
      payload: fallbackDefaultColumns,
    });
    middleware({ type: 'test/action1' });

    mockedGetCurrentFlavor.mockReturnValue(ExploreFlavor.Traces);
    mockedSetColumns.mockReturnValue({ type: 'legacy/setColumns', payload: fallbackTraceColumns });
    middleware({ type: 'test/action2' });

    expect(mockStore.dispatch).toHaveBeenCalledTimes(2);
    expect(mockStore.dispatch).toHaveBeenNthCalledWith(1, {
      type: 'legacy/setColumns',
      payload: fallbackDefaultColumns,
    });
    expect(mockStore.dispatch).toHaveBeenNthCalledWith(2, {
      type: 'legacy/setColumns',
      payload: fallbackTraceColumns,
    });
  });

  it('should handle getCurrentFlavor throwing an error gracefully', () => {
    mockedGetCurrentFlavor.mockImplementation(() => {
      throw new Error('Navigation error');
    });

    expect(() => {
      middleware({ type: 'test/action' });
    }).not.toThrow();

    expect(mockNext).toHaveBeenCalledWith({ type: 'test/action' });
    expect(mockStore.dispatch).not.toHaveBeenCalled();
  });

  it('should work with different action types', () => {
    const traceColumns = [
      'spanId',
      'status.code',
      'attributes.http.status_code',
      'serviceName',
      'name',
      'durationInNanos',
    ];
    mockServices.uiSettings.get.mockImplementation((setting: string) => {
      if (setting === DEFAULT_TRACE_COLUMNS_SETTING) {
        return traceColumns;
      }
      return ['_source'];
    });

    const actionTypes = [
      'query/setQuery',
      'ui/setActiveTabId',
      'legacy/setColumns',
      'app/hydrateState',
    ];

    mockedGetCurrentFlavor.mockReturnValue(ExploreFlavor.Logs);
    middleware({ type: actionTypes[0] });

    mockedGetCurrentFlavor.mockReturnValue(ExploreFlavor.Traces);
    mockedSetColumns.mockReturnValue({ type: 'legacy/setColumns', payload: traceColumns });

    actionTypes.slice(1).forEach((actionType) => {
      middleware({ type: actionType });

      expect(mockStore.dispatch).toHaveBeenCalledWith({
        type: 'legacy/setColumns',
        payload: traceColumns,
      });
    });
  });

  it('should track flavor state independently across multiple actions', () => {
    const sequence = [
      { action: 'action1', flavor: ExploreFlavor.Logs },
      { action: 'action2', flavor: ExploreFlavor.Traces },
      { action: 'action3', flavor: ExploreFlavor.Traces }, // Same flavor, no dispatch
      { action: 'action4', flavor: ExploreFlavor.Metrics },
    ];

    mockServices.uiSettings.get.mockImplementation((setting: string) => {
      if (setting === DEFAULT_TRACE_COLUMNS_SETTING) {
        return ['spanId', 'status.code'];
      }
      return ['_source'];
    });

    let dispatchCallCount = 0;

    sequence.forEach(({ action, flavor }, index) => {
      mockedGetCurrentFlavor.mockReturnValue(flavor);
      mockedSetColumns.mockReturnValue({ type: 'legacy/setColumns', payload: [] });

      middleware({ type: action });

      if (index === 0) {
        // First call always dispatches
        dispatchCallCount++;
        expect(mockStore.dispatch).toHaveBeenCalledTimes(dispatchCallCount);
      } else {
        const previousFlavor = sequence[index - 1].flavor;
        if (flavor !== previousFlavor) {
          dispatchCallCount++;
        }
        expect(mockStore.dispatch).toHaveBeenCalledTimes(dispatchCallCount);
      }
    });

    // Should have dispatched 3 times: logs -> traces -> metrics (skipping traces -> traces)
    expect(mockStore.dispatch).toHaveBeenCalledTimes(3);
  });

  it('should handle initial flavor detection correctly', () => {
    const traceColumns = [
      'spanId',
      'status.code',
      'attributes.http.status_code',
      'serviceName',
      'name',
      'durationInNanos',
    ];
    mockServices.uiSettings.get.mockImplementation((setting: string) => {
      if (setting === DEFAULT_TRACE_COLUMNS_SETTING) {
        return traceColumns;
      }
      return ['_source'];
    });

    // First call should trigger column setting even with no previous flavor
    mockedGetCurrentFlavor.mockReturnValue(ExploreFlavor.Traces);
    mockedSetColumns.mockReturnValue({ type: 'legacy/setColumns', payload: traceColumns });
    middleware({ type: 'test/action' });

    expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
    expect(mockStore.dispatch).toHaveBeenCalledWith({
      type: 'legacy/setColumns',
      payload: traceColumns,
    });
  });
});
