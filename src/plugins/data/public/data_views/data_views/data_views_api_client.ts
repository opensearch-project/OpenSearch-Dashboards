/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'src/core/public';
import { DataViewMissingIndices } from '../../../common/data_views/lib';
import {
  DataViewGetFieldsOptions as GetFieldsOptions,
  IDataViewsApiClient,
} from '../../../common/data_views/types';

const API_BASE_URL: string = `/api/data_views/`;

export class DataViewsApiClient implements IDataViewsApiClient {
  private http: HttpSetup;

  constructor(http: HttpSetup) {
    this.http = http;
  }

  private _request(url: string, query: any) {
    return this.http
      .fetch(url, {
        query,
      })
      .catch((resp: any) => {
        if (resp.body.statusCode === 404 && resp.body.attributes?.code === 'no_matching_indices') {
          throw new DataViewMissingIndices(resp.body.message);
        }

        throw new Error(resp.body.message || resp.body.error || `${resp.body.statusCode} Response`);
      });
  }

  private _getUrl(path: string[]) {
    return API_BASE_URL + path.filter(Boolean).map(encodeURIComponent).join('/');
  }

  getFieldsForTimePattern(options: GetFieldsOptions = {}) {
    const { pattern, lookBack, metaFields, dataSourceId } = options;

    const url = this._getUrl(['_fields_for_time_pattern']);

    return this._request(url, {
      pattern,
      look_back: lookBack,
      meta_fields: metaFields,
      data_source: dataSourceId,
    }).then((resp: any) => resp.fields);
  }

  getFieldsForWildcard(options: GetFieldsOptions = {}) {
    const { pattern, metaFields, type, params, dataSourceId } = options;

    let url;
    let query;

    if (type) {
      url = this._getUrl([type, '_fields_for_wildcard']);
      query = {
        pattern,
        meta_fields: metaFields,
        params: JSON.stringify(params),
        data_source: dataSourceId,
      };
    } else {
      url = this._getUrl(['_fields_for_wildcard']);
      query = {
        pattern,
        meta_fields: metaFields,
        data_source: dataSourceId,
      };
    }

    return this._request(url, query).then((resp: any) => resp.fields);
  }
}
