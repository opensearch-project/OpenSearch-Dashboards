/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSummaryAgentIsAvailable } from './get_summary_agent_is_available';
import { ExploreServices } from '../../../types';

describe('getSummaryAgentIsAvailable', () => {
  let services: jest.Mocked<ExploreServices>;
  const dataSourceId = 'test-datasource-id';

  beforeEach(() => {
    services = {
      http: {
        fetch: jest.fn(),
      },
    } as any;

    jest.clearAllMocks();
  });

  it('returns true when agent exists', async () => {
    (services.http.fetch as jest.Mock).mockResolvedValue({ exists: true });

    const result = await getSummaryAgentIsAvailable(services, dataSourceId);

    expect(result).toBe(true);
    expect(services.http.fetch).toHaveBeenCalledWith({
      method: 'GET',
      path: '/api/assistant/agent_config/_exists',
      query: {
        dataSourceId,
        agentConfigName: 'os_data2summary',
      },
    });
  });

  it('returns false when agent does not exist', async () => {
    (services.http.fetch as jest.Mock).mockResolvedValue({ exists: false });

    const result = await getSummaryAgentIsAvailable(services, dataSourceId);

    expect(result).toBe(false);
  });

  it('returns false when API call throws an error', async () => {
    (services.http.fetch as jest.Mock).mockRejectedValue(new Error('API error'));

    const result = await getSummaryAgentIsAvailable(services, dataSourceId);

    expect(result).toBe(false);
  });
});
