/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentTracesServices } from '../../../../types';

/**
 * Creates a mock AgentTracesServices object for testing
 */
export const createMockAgentTracesServices = (
  overrides: Partial<AgentTracesServices> = {}
): AgentTracesServices =>
  ({
    data: {
      query: {
        queryString: {
          getQuery: jest.fn().mockReturnValue({ query: '', language: 'sql' }),
          setQuery: jest.fn(),
          addToQueryHistory: jest.fn(),
        },
        timefilter: {
          timefilter: {
            getTime: jest.fn().mockReturnValue({ from: 'now-15m', to: 'now' }),
            setTime: jest.fn(),
          },
        },
      },
      search: {
        tabifyAggResponse: jest.fn(),
      },
    },
    ...overrides,
  } as AgentTracesServices);
