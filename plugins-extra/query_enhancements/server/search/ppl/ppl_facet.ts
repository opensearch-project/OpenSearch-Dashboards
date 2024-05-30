/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { PPLDataSource } from './ppl_datasource';

export class PPLFacet {
  constructor(private client: any) {
    this.client = client;
  }

  private fetch = async (request: any, format: string, responseFormat: string) => {
    const res = {
      success: false,
      data: {},
    };
    try {
      const params = {
        body: {
          query: request.body.query,
        },
      };
      if (request.body.format !== 'jdbc') {
        params.format = request.body.format;
      }
      const queryRes = await this.client.asScoped(request).callAsCurrentUser(format, params);
      const pplDataSource = new PPLDataSource(queryRes, request.body.format);
      res.success = true;
      res.data = pplDataSource.getDataSource();
    } catch (err: any) {
      console.error('PPL query fetch err: ', err);
      res.data = err;
    }
    return res;
  };

  describeQuery = async (request: any) => {
    return this.fetch(request, 'ppl.pplQuery', 'json');
  };
}
