/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { detectAndSetOptimalTab } from './detect_optimal_tab';
import { setActiveTab } from '../../slices';
import { executeTabQuery } from '../query_actions';
import { AgentTracesServices } from '../../../../../types';
import {
  AGENT_TRACES_TRACES_TAB_ID,
  AGENT_TRACES_VISUALIZATION_TAB_ID,
} from '../../../../../../common';

jest.mock('../../slices', () => ({
  setActiveTab: jest.fn((id) => ({ type: 'ui/setActiveTab', payload: id })),
}));

jest.mock('../query_actions', () => ({
  executeTabQuery: jest.fn((args) => ({ type: 'query/executeTabQuery', payload: args })),
}));

const mockSetActiveTab = setActiveTab as jest.MockedFunction<typeof setActiveTab>;
const mockExecuteTabQuery = executeTabQuery as jest.MockedFunction<typeof executeTabQuery>;

describe('detectAndSetOptimalTab', () => {
  let mockDispatch: jest.Mock;
  let mockGetState: jest.Mock;

  const mockPrepareQuery = jest.fn();

  const createMockServices = () =>
    (({
      tabRegistry: {
        getTab: jest.fn().mockReturnValue({ prepareQuery: mockPrepareQuery }),
        getAllTabs: jest.fn().mockReturnValue([]),
      },
    } as any) as AgentTracesServices);

  const createMockState = (queryString: string, results: Record<string, any> = {}) => ({
    query: { query: queryString },
    results,
    legacy: { sort: [['endTime', 'desc']] },
    queryEditor: { queryStatusMap: {} },
    ui: { activeTabId: '' },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();
    mockGetState = jest.fn();
    mockPrepareQuery.mockReturnValue('prepared-cache-key');
  });

  it('sets traces tab when query has no stats pipe', async () => {
    const services = createMockServices();
    mockGetState.mockReturnValue(createMockState('source = idx'));

    const thunk = detectAndSetOptimalTab({ services });
    await thunk(mockDispatch, mockGetState, undefined);

    expect(mockSetActiveTab).toHaveBeenCalledWith(AGENT_TRACES_TRACES_TAB_ID);
    expect(services.tabRegistry.getTab).toHaveBeenCalledWith(AGENT_TRACES_TRACES_TAB_ID);
  });

  it('sets visualization tab when query contains stats pipe', async () => {
    const services = createMockServices();
    mockGetState.mockReturnValue(
      createMockState('source = idx | stats count() by span(startTime, 1m)')
    );

    const thunk = detectAndSetOptimalTab({ services });
    await thunk(mockDispatch, mockGetState, undefined);

    expect(mockSetActiveTab).toHaveBeenCalledWith(AGENT_TRACES_VISUALIZATION_TAB_ID);
    expect(services.tabRegistry.getTab).toHaveBeenCalledWith(AGENT_TRACES_VISUALIZATION_TAB_ID);
  });

  it('executes tab query when results are not cached', async () => {
    const services = createMockServices();
    mockGetState.mockReturnValue(createMockState('source = idx'));

    const thunk = detectAndSetOptimalTab({ services });
    await thunk(mockDispatch, mockGetState, undefined);

    expect(mockPrepareQuery).toHaveBeenCalledWith({ query: 'source = idx' }, [['endTime', 'desc']]);
    expect(mockExecuteTabQuery).toHaveBeenCalledWith({
      services,
      cacheKey: 'prepared-cache-key',
      queryString: 'prepared-cache-key',
    });
  });

  it('skips tab query when results are already cached', async () => {
    const services = createMockServices();
    mockGetState.mockReturnValue(
      createMockState('source = idx', { 'prepared-cache-key': { hits: { hits: [] } } })
    );

    const thunk = detectAndSetOptimalTab({ services });
    await thunk(mockDispatch, mockGetState, undefined);

    expect(mockExecuteTabQuery).not.toHaveBeenCalled();
  });

  it('executes visualization tab query when results are not cached', async () => {
    const services = createMockServices();
    mockGetState.mockReturnValue(
      createMockState('source = idx | stats count() by span(startTime, 1m)')
    );

    const thunk = detectAndSetOptimalTab({ services });
    await thunk(mockDispatch, mockGetState, undefined);

    expect(mockExecuteTabQuery).toHaveBeenCalledWith({
      services,
      cacheKey: 'prepared-cache-key',
      queryString: 'prepared-cache-key',
    });
  });

  it('handles tab without prepareQuery', async () => {
    const services = ({
      tabRegistry: {
        getTab: jest.fn().mockReturnValue({ id: AGENT_TRACES_TRACES_TAB_ID }),
        getAllTabs: jest.fn().mockReturnValue([]),
      },
    } as any) as AgentTracesServices;
    mockGetState.mockReturnValue(createMockState(''));

    const thunk = detectAndSetOptimalTab({ services });
    await thunk(mockDispatch, mockGetState, undefined);

    expect(mockSetActiveTab).toHaveBeenCalledWith(AGENT_TRACES_TRACES_TAB_ID);
    expect(mockExecuteTabQuery).not.toHaveBeenCalled();
  });
});
