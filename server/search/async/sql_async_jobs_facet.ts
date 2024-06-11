/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export class SQLAsyncJobsFacet {
  constructor(private client: any) {
    this.client = client;
  }

  private fetch = async (request: any, format: string, responseFormat: string) => {
    const res = {
      success: false,
      data: {},
    };
    try {
      const queryRes = await this.client
        .asScoped(request)
        .callAsCurrentUser(format, { queryId: request.params.queryId });
      res.success = true;
      res.data = queryRes;
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Async SQL job status fetch err:', err);
      res.data = err;
    }
    return res;
  };

  describeQuery = async (request: any) => {
    return this.fetch(request, 'observability.getJobStatus', 'json');
  };
}
