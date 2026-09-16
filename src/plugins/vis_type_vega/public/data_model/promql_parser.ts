/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { CoreSetup } from 'opensearch-dashboards/public';
import { Data, UrlObject, PromQLQueryRequest } from './types';
import { TimeCache } from './time_cache';

const DATASOURCE = '%datasource%';
const CONTEXT = '%context%';

interface PromQLHttpResponse {
  body: {
    fields: Array<{
      name: string;
      values: unknown[];
    }>;
  };
}

export class PromQLQueryParser {
  constructor(
    private readonly timeCache: TimeCache,
    private readonly http: CoreSetup['http']
  ) {}

  parseUrl(dataObject: Data, url: UrlObject): PromQLQueryRequest {
    const datasource = url[DATASOURCE] as string | undefined;
    delete url[DATASOURCE];
    const useContext = !!url[CONTEXT];
    delete url[CONTEXT];

    if (!url.body || !url.body.query || typeof url.body.query !== 'string') {
      throw new Error(
        i18n.translate('visTypeVega.promqlQueryParser.dataUrl.queryCannotBeEmpty', {
          defaultMessage: '{dataUrlParam} must have query specified',
          values: { dataUrlParam: '"data.url"' },
        })
      );
    }

    if (!datasource) {
      throw new Error(
        i18n.translate('visTypeVega.promqlQueryParser.dataUrl.datasourceCannotBeEmpty', {
          defaultMessage: '{dataUrlParam} must have {datasourceParam} specified',
          values: { dataUrlParam: '"data.url"', datasourceParam: '"%datasource%"' },
        })
      );
    }

    return { dataObject, url, datasource, useContext };
  }

  async populateData(requests: PromQLQueryRequest[]) {
    const timeRange = this.timeCache._timeRange;

    await Promise.all(
      requests.map(async (request) => {
        const requestBody = {
          query: {
            query: request.url.body!.query as string,
            language: 'PROMQL',
            dataset: {
              id: request.datasource,
              title: request.datasource,
              type: 'PROMETHEUS',
              language: 'PROMQL',
              timeFieldName: 'Time',
              dataSource: {},
            },
            format: 'jdbc',
          },
          ...(request.useContext && timeRange ? { timeRange } : {}),
        };

        const response = await this.http.post<PromQLHttpResponse>(
          '/api/enhancements/search/promql',
          { body: JSON.stringify(requestBody) }
        );

        const fields = response.body?.fields ?? [];
        const timeValues = fields.find((f) => f.name === 'Time')?.values ?? [];
        const seriesValues = fields.find((f) => f.name === 'Series')?.values ?? [];
        const labelsValues = fields.find((f) => f.name === 'Labels')?.values ?? [];
        const valueValues = fields.find((f) => f.name === 'Value')?.values ?? [];

        request.dataObject.values = timeValues.map((t, i) => ({
          Time: t,
          Series: seriesValues[i],
          Labels: labelsValues[i],
          Value: valueValues[i],
        }));
      })
    );
  }
}
