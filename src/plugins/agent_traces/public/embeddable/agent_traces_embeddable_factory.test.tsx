/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentTracesEmbeddableFactory } from './agent_traces_embeddable_factory';
import { AGENT_TRACES_EMBEDDABLE_TYPE } from './constants';
import { ErrorEmbeddable } from '../../../embeddable/public';
import { AgentTracesEmbeddable } from './agent_traces_embeddable';
import * as OsdServices from '../application/legacy/discover/opensearch_dashboards_services';

jest.mock('./agent_traces_embeddable', () => {
  return {
    AgentTracesEmbeddable: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

describe('AgentTracesEmbeddableFactory', () => {
  let factory: AgentTracesEmbeddableFactory;
  const mockedGetServicesResults = {
    getSavedAgentTracesUrlById: jest.fn().mockResolvedValue('saved-agentTraces-url'),
    getSavedAgentTracesById: jest.fn().mockResolvedValue({
      id: 'test-id',
      title: 'Test Agent Traces',
      description: 'Test description',
      searchSource: {
        getField: jest.fn((field) => {
          if (field === 'index') {
            return { id: 'test-index' };
          }
          if (field === 'query') {
            return { query: 'test', language: 'kuery' };
          }
          return null;
        }),
      },
      type: 'logs',
    }),
    addBasePath: jest.fn((path) => `/base${path}`),
    capabilities: {
      discover: {
        save: true,
      },
    },
    filterManager: {},
  };
  const mockStartServices = {
    executeTriggerActions: jest.fn(),
    isEditable: jest.fn().mockReturnValue(true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    factory = new AgentTracesEmbeddableFactory(jest.fn().mockResolvedValue(mockStartServices));
    jest.spyOn(OsdServices, 'getServices').mockReturnValue(mockedGetServicesResults as any);
  });

  test('has the correct type', () => {
    expect(factory.type).toBe(AGENT_TRACES_EMBEDDABLE_TYPE);
  });

  test('has the correct display name', () => {
    expect(factory.getDisplayName()).toBe('visualization in discover');
  });

  test('cannot create new embeddables directly', () => {
    expect(factory.canCreateNew()).toBe(false);
  });

  test('isEditable returns the value from start services', async () => {
    const result = await factory.isEditable();
    expect(result).toBe(true);
    expect(mockStartServices.isEditable).toHaveBeenCalled();
  });

  test('create returns an error when attributes are missing', async () => {
    const input = { id: 'test', timeRange: { from: 'now-15m', to: 'now' } };
    const result = await factory.create(input as any);
    // Check that the result is an ErrorEmbeddable
    expect(result).toBeInstanceOf(ErrorEmbeddable);
  });

  test('create successfully creates by-value embeddable with attributes', async () => {
    const mockSearchSource = {
      getField: jest.fn((field) => {
        if (field === 'index') return { id: 'test-index' };
        return null;
      }),
    };

    jest.spyOn(OsdServices, 'getServices').mockReturnValue({
      ...mockedGetServicesResults,
      data: {
        search: {
          searchSource: {
            create: jest.fn().mockResolvedValue(mockSearchSource),
          },
        },
      },
    } as any);

    const input = {
      id: 'test',
      timeRange: { from: 'now-15m', to: 'now' },
      attributes: {
        title: 'Test Agent Traces',
        description: 'Test description',
        type: 'logs',
        columns: ['column1'],
        sort: [['column1', 'asc']],
        visualization: JSON.stringify({ chartType: 'bar' }),
        uiState: JSON.stringify({ activeTab: 'visualization' }),
        kibanaSavedObjectMeta: {
          searchSourceJSON: JSON.stringify({ query: { query: '', language: 'PPL' } }),
        },
      },
      references: [],
    };

    const result = await factory.create(input as any);

    expect(AgentTracesEmbeddable).toHaveBeenCalledWith(
      expect.objectContaining({
        savedAgentTraces: expect.objectContaining({
          id: 'test',
          title: 'Test Agent Traces',
        }),
        editUrl: '',
        editPath: '',
        editable: false,
      }),
      input,
      mockStartServices.executeTriggerActions,
      undefined
    );
  });

  test('create handles undefined index pattern in by-value embeddable', async () => {
    const mockSearchSource = {
      getField: jest.fn(() => null),
    };

    jest.spyOn(OsdServices, 'getServices').mockReturnValue({
      ...mockedGetServicesResults,
      data: {
        search: {
          searchSource: {
            create: jest.fn().mockResolvedValue(mockSearchSource),
          },
        },
      },
    } as any);

    const input = {
      id: 'test',
      timeRange: { from: 'now-15m', to: 'now' },
      attributes: {
        title: 'Test Agent Traces',
        type: 'logs',
        kibanaSavedObjectMeta: {
          searchSourceJSON: JSON.stringify({ query: { query: '', language: 'PPL' } }),
        },
      },
      references: [],
    };

    const result = await factory.create(input as any);

    expect(AgentTracesEmbeddable).toHaveBeenCalledWith(
      expect.objectContaining({
        indexPatterns: [],
      }),
      input,
      mockStartServices.executeTriggerActions,
      undefined
    );
  });

  test('create returns error embeddable on exception', async () => {
    jest.spyOn(OsdServices, 'getServices').mockReturnValue({
      ...mockedGetServicesResults,
      data: {
        search: {
          searchSource: {
            create: jest.fn().mockRejectedValue(new Error('Test error')),
          },
        },
      },
    } as any);

    const input = {
      id: 'test',
      timeRange: { from: 'now-15m', to: 'now' },
      attributes: {
        title: 'Test Agent Traces',
        type: 'logs',
        kibanaSavedObjectMeta: {
          searchSourceJSON: JSON.stringify({ query: { query: '', language: 'PPL' } }),
        },
      },
      references: [],
    };

    const result = await factory.create(input as any);
    expect(result).toBeInstanceOf(ErrorEmbeddable);
  });

  test('createFromSavedObject creates an AgentTracesEmbeddable', async () => {
    const input = { id: 'test', timeRange: { from: 'now-15m', to: 'now' } };

    await factory.createFromSavedObject('test-id', input as any);
    expect(AgentTracesEmbeddable).toHaveBeenCalledWith(
      expect.objectContaining({
        savedAgentTraces: expect.objectContaining({
          id: 'test-id',
          title: 'Test Agent Traces',
        }),
        editUrl: '/base/app/agentTraces/logs/saved-agentTraces-url',
        editPath: 'saved-agentTraces-url',
        editable: true,
        indexPatterns: [{ id: 'test-index' }],
        editApp: 'agentTraces/logs',
      }),
      input,
      mockStartServices.executeTriggerActions,
      undefined
    );
  });

  test('createFromSavedObject returns error object when saved object not found', async () => {
    jest.spyOn(OsdServices, 'getServices').mockReturnValue({
      ...mockedGetServicesResults,
      getSavedAgentTracesById: jest.fn().mockResolvedValue(null),
    } as any);

    const input = { id: 'test', timeRange: { from: 'now-15m', to: 'now' } };
    const result = await factory.createFromSavedObject('not-found', input as any);

    // Check that the result is an error object (has an error property)
    expect(result).toBeInstanceOf(ErrorEmbeddable);
  });

  test('createFromSavedObject returns error object on error', async () => {
    jest.spyOn(OsdServices, 'getServices').mockReturnValue({
      ...mockedGetServicesResults,
      getSavedAgentTracesById: jest.fn().mockRejectedValueOnce(new Error('Test error')),
    } as any);

    const input = { id: 'test', timeRange: { from: 'now-15m', to: 'now' } };
    const result = await factory.createFromSavedObject('error-id', input as any);

    // Check for properties that would be on an ErrorEmbeddable
    expect(result).toBeInstanceOf(ErrorEmbeddable);
  });

  test('getIconForSavedObject returns discoverApp icon', () => {
    const savedObject = {
      attributes: {},
    };

    const iconType = factory.savedObjectMetaData.getIconForSavedObject(savedObject as any);
    expect(iconType).toBe('discoverApp');
  });

  test('createFromSavedObject returns error object when exception thrown', async () => {
    jest.spyOn(OsdServices, 'getServices').mockReturnValue({
      ...mockedGetServicesResults,
      getSavedAgentTracesById: jest.fn().mockImplementation(() => {
        throw new Error('fail');
      }),
    } as any);
    const input = { id: 'test', timeRange: { from: 'now-15m', to: 'now' } };
    const result = await factory.createFromSavedObject('error-id', input as any);
    expect(result).toBeInstanceOf(ErrorEmbeddable);
  });

  test('createFromSavedObject works when indexPattern is null', async () => {
    jest.spyOn(OsdServices, 'getServices').mockReturnValue({
      ...mockedGetServicesResults,
      getSavedAgentTracesById: jest.fn().mockResolvedValue({
        ...mockedGetServicesResults.getSavedAgentTracesById(),
        searchSource: {
          getField: jest.fn(() => null),
        },
      }),
    } as any);
    const input = { id: 'test', timeRange: { from: 'now-15m', to: 'now' } };
    await factory.createFromSavedObject('test-id', input as any);
    expect(AgentTracesEmbeddable).toHaveBeenCalledWith(
      expect.objectContaining({
        indexPatterns: [],
      }),
      input,
      mockStartServices.executeTriggerActions,
      undefined
    );
  });
});
