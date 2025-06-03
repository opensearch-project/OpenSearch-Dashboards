/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

import { HttpStart } from 'opensearch-dashboards/public';
import { DirectQueryRequest } from '../types';

interface FetchError {
  body: string;
  message?: string;
  [key: string]: any;
}

export class SQLService {
  private http: HttpStart;

  constructor(http: HttpStart) {
    this.http = http;
  }

  fetch = async (
    params: DirectQueryRequest,
    dataSourceMDSId?: string,
    errorHandler?: (error: FetchError) => void
  ) => {
    const query = {
      dataSourceMDSId,
    };
    return this.http
      .post('/api/observability/query/jobs', {
        body: JSON.stringify(params),
        query,
      })
      .catch((error: FetchError) => {
        console.error('fetch error: ', error.body);
        if (errorHandler) errorHandler(error);
        throw error;
      });
  };

  fetchWithJobId = async (
    params: { queryId: string },
    dataSourceMDSId?: string,
    errorHandler?: (error: FetchError) => void
  ) => {
    return this.http
      .get(`/api/observability/query/jobs/${params.queryId}/${dataSourceMDSId ?? ''}`)
      .catch((error: FetchError) => {
        console.error('fetch error: ', error.body);
        if (errorHandler) errorHandler(error);
        throw error;
      });
  };

  deleteWithJobId = async (
    params: { queryId: string },
    errorHandler?: (error: FetchError) => void
  ) => {
    return this.http
      .delete(`/api/observability/query/jobs/${params.queryId}`)
      .catch((error: FetchError) => {
        console.error('delete error: ', error.body);
        if (errorHandler) errorHandler(error);
        throw error;
      });
  };
}
