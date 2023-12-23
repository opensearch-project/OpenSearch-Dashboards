import { OpenSearchClient } from '../../../../src/core/server';

import { CspClient } from './types';

export class OpenSearchCspClient implements CspClient {
  client: OpenSearchClient;

  constructor(inputOpenSearchClient: OpenSearchClient) {
    this.client = inputOpenSearchClient;
  }

  async exists(configurationName: string): Promise<boolean> {
    const exists = await this.client.indices.exists({
      index: configurationName,
    });

    return exists.body;
  }

  async get(configurationName: string, cspRulesName: string): Promise<string> {
    const query = {
      query: {
        match: {
          _id: {
            query: cspRulesName,
          },
        },
      },
    };

    const data = await this.client.search({
      index: configurationName,
      _source: true,
      body: query,
    });

    return data.body.hits.hits[0]?._source.value;
  }
}
