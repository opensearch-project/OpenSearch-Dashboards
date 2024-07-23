/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Data, UrlObject, PPLQueryRequest } from './types';
import { SearchAPI } from './search_api';

const getRequestName = (request: PPLQueryRequest, index: number) =>
  request.dataObject.name ||
  i18n.translate('visTypeVega.opensearchQueryParser.unnamedRequest', {
    defaultMessage: 'Unnamed request #{index}',
    values: { index },
  });

export class PPLQueryParser {
  searchAPI: SearchAPI;

  constructor(searchAPI: SearchAPI) {
    this.searchAPI = searchAPI;
  }

  parseUrl(dataObject: Data, url: UrlObject) {
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
