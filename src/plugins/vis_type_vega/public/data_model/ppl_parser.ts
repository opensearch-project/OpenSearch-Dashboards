/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import moment from 'moment';

import { Data, UrlObject, PPLQueryRequest } from './types';
import { SearchAPI } from './search_api';
import { TimeCache } from './time_cache';

const TIMEFIELD = '%timefield%';

const getRequestName = (request: PPLQueryRequest, index: number) =>
  request.dataObject.name ||
  i18n.translate('visTypeVega.opensearchQueryParser.unnamedRequest', {
    defaultMessage: 'Unnamed request #{index}',
    values: { index },
  });

export class PPLQueryParser {
  constructor(private readonly timeCache: TimeCache, private readonly searchAPI: SearchAPI) {
    this.searchAPI = searchAPI;
  }

  injectTimeFilter(query: string, timefield: string) {
    if (this.timeCache._timeRange) {
      const [source, ...others] = query.split('|');
      const bounds = this.timeCache.getTimeBounds();
      const from = moment.utc(bounds.min).format('YYYY-MM-DD HH:mm:ss.SSS');
      const to = moment.utc(bounds.max).format('YYYY-MM-DD HH:mm:ss.SSS');
      const timeFilter = `where \`${timefield}\` >= '${from}' and \`${timefield}\` <= '${to}'`;
      if (others.length > 0) {
        return `${source.trim()} | ${timeFilter} | ${others.map((s) => s.trim()).join(' | ')}`;
      }
      return `${source.trim()} | ${timeFilter}`;
    }
    return query;
  }

  parseUrl(dataObject: Data, url: UrlObject) {
    const timefield = url[TIMEFIELD];
    delete url[TIMEFIELD];

    // data.url.body.query must be defined
    if (!url.body || !url.body.query || typeof url.body.query !== 'string') {
      throw new Error(
        i18n.translate('visTypeVega.pplQueryParser.dataUrl.PPL.queryCannotBeEmpty', {
          defaultMessage: '{dataUrlParam} must have query specified',
          values: {
            dataUrlParam: '"data.url"',
          },
        })
      );
    }

    if (timefield) {
      const query = this.injectTimeFilter(url.body.query, timefield);
      url.body.query = query;
    }

    return { dataObject, url };
  }

  async populateData(requests: PPLQueryRequest[]) {
    const searchRequests = requests.map((r, index) => ({
      ...r.url,
      name: getRequestName(r, index),
    }));

    const data$ = await this.searchAPI.search(searchRequests, { strategy: 'pplraw' });
    const results = await data$.toPromise();
    results.forEach((data, index) => {
      const requestObject = requests.find((item) => getRequestName(item, index) === data.name);

      if (requestObject) {
        requestObject.dataObject.url = requestObject.url;
        requestObject.dataObject.values = (data.rawResponse as any).jsonData;
      }
    });
  }
}
