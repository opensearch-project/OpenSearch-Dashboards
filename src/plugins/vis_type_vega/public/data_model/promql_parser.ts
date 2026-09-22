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
const MAXDATAPOINTS = '%maxdatapoints%';
const STEP = '%step%';

// supports 20 series of 60s steps for 24 hours
const CLIENT_ROW_CAP = 30_000;

interface PromQLHttpResponse {
  body: {
    fields: Array<{
      name: string;
      values: unknown[];
    }>;
    meta?: {
      truncation?: {
        tableTruncated: boolean;
        totalSeriesCount: number;
        displayedSeriesCount: number;
      };
    };
  };
}

export class PromQLQueryParser {
  constructor(
    private readonly timeCache: TimeCache,
    private readonly http: CoreSetup['http'],
    private readonly onWarning: (...args: string[]) => void,
    private readonly abortSignal?: AbortSignal
  ) {}

  parseUrl(dataObject: Data, url: UrlObject): PromQLQueryRequest {
    const datasource = url[DATASOURCE] as string | undefined;
    delete url[DATASOURCE];
    const useContext = !!url[CONTEXT];
    delete url[CONTEXT];
    const maxDataPoints = this.parsePositiveNumber(url[MAXDATAPOINTS]);
    delete url[MAXDATAPOINTS];
    const step = this.parsePositiveNumber(url[STEP]);
    delete url[STEP];

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

    if (!useContext) {
      throw new Error(
        i18n.translate('visTypeVega.promqlQueryParser.dataUrl.contextRequired', {
          defaultMessage:
            '{dataUrlParam} must set {contextParam} to provide the dashboard time range',
          values: { dataUrlParam: '"data.url"', contextParam: '"%context%: true"' },
        })
      );
    }

    return { dataObject, url, datasource, useContext, maxDataPoints, step };
  }

  async populateData(requests: PromQLQueryRequest[]) {
    const timeRange = this.timeCache._timeRange;

    const results = await Promise.allSettled(
      requests.map(async (request) => {
        const options: { maxDataPoints?: number; step?: number } = {};
        if (request.maxDataPoints !== undefined) {
          options.maxDataPoints = request.maxDataPoints;
        }
        if (request.step !== undefined) {
          options.step = request.step;
        }

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
              // Routes to the local cluster's direct-query Prometheus endpoint.
              // Remote MDS data sources are not supported.
              dataSource: {},
            },
            format: 'jdbc',
          },
          ...(Object.keys(options).length > 0 ? { options } : {}),
          ...(request.useContext && timeRange ? { timeRange } : {}),
        };

        const response = await this.http.post<PromQLHttpResponse>(
          '/api/enhancements/search/promql',
          {
            body: JSON.stringify(requestBody),
            signal: this.abortSignal,
          }
        );

        const fields = response.body?.fields ?? [];
        const timeValues = fields.find((f) => f.name === 'Time')?.values ?? [];
        const seriesValues = fields.find((f) => f.name === 'Series')?.values ?? [];
        const labelsValues = fields.find((f) => f.name === 'Labels')?.values ?? [];
        const valueValues = fields.find((f) => f.name === 'Value')?.values ?? [];

        const totalRows = timeValues.length;
        const cappedTimeValues =
          totalRows > CLIENT_ROW_CAP ? timeValues.slice(0, CLIENT_ROW_CAP) : timeValues;

        request.dataObject.values = cappedTimeValues.map((t, i) => ({
          Time: t,
          Series: seriesValues[i],
          Labels: labelsValues[i],
          Value: valueValues[i],
        }));

        if (totalRows > CLIENT_ROW_CAP) {
          this.onWarning(
            i18n.translate('visTypeVega.promqlQueryParser.rowCapWarning', {
              defaultMessage:
                'PromQL result was truncated client-side: showing {cap} of {total} data points. Use {maxDataPoints} or {step} to reduce the result size.',
              values: {
                cap: CLIENT_ROW_CAP,
                total: totalRows,
                maxDataPoints: '%maxdatapoints%',
                step: '%step%',
              },
            })
          );
        }

        const truncation = response.body?.meta?.truncation;
        if (truncation?.tableTruncated) {
          this.onWarning(
            i18n.translate('visTypeVega.promqlQueryParser.seriesTruncatedWarning', {
              defaultMessage:
                'PromQL result was truncated: only {displayed} of {total} series are shown. Narrow the query to see all series.',
              values: {
                displayed: truncation.displayedSeriesCount,
                total: truncation.totalSeriesCount,
              },
            })
          );
        }
      })
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.onWarning(
          i18n.translate('visTypeVega.promqlQueryParser.requestFailedWarning', {
            defaultMessage: 'PromQL request {index} failed: {message}',
            values: {
              index: index + 1,
              message:
                result.reason instanceof Error ? result.reason.message : String(result.reason),
            },
          })
        );
      }
    });
  }

  private parsePositiveNumber(value: unknown): number | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }
}
