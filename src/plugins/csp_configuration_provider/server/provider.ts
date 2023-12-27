import { OpenSearchClient } from '../../../../src/core/server';

import { CspClient } from './types';

export class OpenSearchCspClient implements CspClient {
  private client: OpenSearchClient;

  constructor(inputOpenSearchClient: OpenSearchClient) {
    this.client = inputOpenSearchClient;
  }

  async exists(configurationName: string): Promise<boolean> {
    let value = false;

    try {
      const exists = await this.client.indices.exists({
        index: configurationName,
      });

      value = exists.body;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(
        `Failed to call exists with configurationName ${configurationName} due to error ${e}`
      );
    }

    return value;
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

    let value = '';

    try {
      const data = await this.client.search({
        index: configurationName,
        body: query,
      });

      value = data?.body?.hits?.hits[0]?._source?.value;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(
        `Failed to call get with configurationName ${configurationName} and cspRulesName ${cspRulesName} due to error ${e}`
      );
    }

    return value;
  }
}
