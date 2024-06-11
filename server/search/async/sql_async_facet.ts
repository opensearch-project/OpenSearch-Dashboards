/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export class SQLAsyncFacet {
  constructor(private client: any) {
    this.client = client;
  }

  private fetch = async (request: any, format: string, responseFormat: string) => {
    const res = {
      success: false,
      data: {},
    };
    try {
      const df = request.body?.df;
      const params = {
        body: {
          query: request.body.query.qs,
          datasource: request.body.dataSource,
          lang: 'sql',
          sessionId: df?.meta?.sessionId,
        },
      };
      if (request.body.format !== 'jdbc') {
        params.format = request.body.format;
      }
      const queryRes = await this.client.asScoped(request).callAsCurrentUser(format, params);
      res.success = true;
      res.data = queryRes;
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Async SQL query fetch err:', err);
      res.data = err;
    }
    return res;
  };

  describeQuery = async (request: any) => {
    return this.fetch(request, 'observability.runDirectQuery', 'json');
  };
}
