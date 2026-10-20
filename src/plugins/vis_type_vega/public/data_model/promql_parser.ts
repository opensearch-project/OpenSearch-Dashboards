/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Data, UrlObject, PromQLQueryRequest, PromQLHttpResponse } from './types';
import { TimeCache } from './time_cache';
import { SearchAPI } from './search_api';

const DATASOURCE = '%datasource%';
const CONTEXT = '%context%';
const MAXDATAPOINTS = '%maxdatapoints%';
const STEP = '%step%';

// supports 20 series of 60s steps for 24 hours
const CLIENT_ROW_CAP = 30_000;

const getRequestName = (request: PromQLQueryRequest, index: number) =>
  (request.dataObject.name as string | undefined) ||
  i18n.translate('visTypeVega.promqlQueryParser.unnamedRequest', {
    defaultMessage: 'Unnamed request #{index}',
    values: { index },
  });

export class PromQLQueryParser {
  constructor(
    private readonly timeCache: TimeCache,
    private readonly searchAPI: SearchAPI,
    private readonly onWarning: (...args: string[]) => void
  ) {}

  parseUrl(dataObject: Data, url: UrlObject): PromQLQueryRequest {
    const datasource = url[DATASOURCE] as string | undefined;
    delete url[DATASOURCE];
    const hasContext = !!url[CONTEXT];
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

    if (!hasContext) {
      throw new Error(
        i18n.translate('visTypeVega.promqlQueryParser.dataUrl.contextRequired', {
          defaultMessage:
            '{dataUrlParam} must set {contextParam} to provide the dashboard time range',
          values: { dataUrlParam: '"data.url"', contextParam: '"%context%: true"' },
        })
      );
    }

    return { dataObject, url, datasource, maxDataPoints, step };
  }

  async populateData(requests: PromQLQueryRequest[]) {
    const timeBounds = this.timeCache.getTimeBounds();
    const timeRange = {
      from: new Date(timeBounds.min).toISOString(),
      to: new Date(timeBounds.max).toISOString(),
    };

    const results = await Promise.allSettled(
      requests.map(async (request, index) => {
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
            // Routes to the local cluster's direct-query Prometheus endpoint only.
            // Remote MDS data sources are not supported.
            dataset: {
              id: request.datasource,
              title: request.datasource,
              type: 'PROMETHEUS',
              language: 'PROMQL',
              timeFieldName: 'Time',
            },
            format: 'jdbc',
          },
          ...(Object.keys(options).length > 0 ? { options } : {}),
          timeRange,
        };

        const response = await this.searchAPI.searchPromQL(
          getRequestName(request, index),
          requestBody
        );

        const fields = response.body?.fields ?? [];
        const timeValues = fields.find((f) => f.name === 'Time')?.values ?? [];
        const seriesValues = fields.find((f) => f.name === 'Series')?.values ?? [];
        const labelsValues = fields.find((f) => f.name === 'Labels')?.values ?? [];
        const valueValues = fields.find((f) => f.name === 'Value')?.values ?? [];

        const totalRows = timeValues.length;
        let cappedRows = totalRows;
        let keptSeries: number | undefined;
        let totalSeries: number | undefined;

        if (totalRows > CLIENT_ROW_CAP) {
          // Cap at a series boundary so no series is shown partially
          cappedRows = 0;
          keptSeries = 0;
          let i = 0;
          while (i < totalRows) {
            const seriesName = seriesValues[i];
            let j = i + 1;
            while (j < totalRows && seriesValues[j] === seriesName) j++;
            if (cappedRows + (j - i) > CLIENT_ROW_CAP) break;
            cappedRows += j - i;
            keptSeries++;
            i = j;
          }
          totalSeries = keptSeries;
          while (i < totalRows) {
            let j = i + 1;
            while (j < totalRows && seriesValues[j] === seriesValues[i]) j++;
            totalSeries++;
            i = j;
          }
        }

        request.dataObject.values = timeValues.slice(0, cappedRows).map((t, i) => ({
          Time: t,
          Series: seriesValues[i],
          Labels: labelsValues[i],
          Value: valueValues[i],
        }));

        if (keptSeries !== undefined && totalSeries !== undefined) {
          this.onWarning(
            i18n.translate('visTypeVega.promqlQueryParser.rowCapWarning', {
              defaultMessage:
                'PromQL result was truncated client-side: showing {keptSeries} of {totalSeries} series. Use {maxDataPoints} or {step} to reduce the result size.',
              values: {
                keptSeries,
                totalSeries,
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

        const multiQueryErrors = response.body?.meta?.multiQuery?.errors ?? [];
        for (const { query, error } of multiQueryErrors) {
          this.onWarning(
            i18n.translate('visTypeVega.promqlQueryParser.multiQuerySubError', {
              defaultMessage: 'Sub-query "{query}" failed: {error}',
              values: { query, error },
            })
          );
        }
      })
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const reason = result.reason;
        if (reason?.name === 'AbortError') return;
        const message =
          (reason as any)?.body?.error?.details ??
          (reason as any)?.body?.message ??
          (reason instanceof Error ? reason.message : String(reason));
        this.onWarning(
          i18n.translate('visTypeVega.promqlQueryParser.requestFailedWarning', {
            defaultMessage: 'PromQL request "{name}" failed: {message}',
            values: { name: getRequestName(requests[index], index), message },
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
