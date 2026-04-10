/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import type { Logger, IRouter } from '../../../../core/server';
import { fetchPrometheusPreviewPoints } from './preview_points';

const DEFAULT_BUCKET_MILLIS = 60_000;
const DEFAULT_SHINGLE_SIZE = 8;
const MAX_BUCKETS_TARGET = 10_000;
const TARGET_BUCKETS = 5_000;
const MIN_DEFAULT_HORIZON_BUCKETS = 12;
const MAX_DEFAULT_HORIZON_BUCKETS = 72;
const MIN_BUCKETS_FOR_PROMQL_INTERVAL = 60;
const BUCKET_CANDIDATES_MILLIS = [
  60_000, // 1m
  5 * 60_000, // 5m
  15 * 60_000, // 15m
  60 * 60_000, // 1h
  6 * 60 * 60_000, // 6h
  24 * 60 * 60_000, // 1d
];
const PROMQL_DURATION_TO_MILLIS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 60 * 60_000,
  d: 24 * 60 * 60_000,
  w: 7 * 24 * 60 * 60_000,
  y: 365 * 24 * 60 * 60_000,
};

function createTempIndexName() {
  const suffix = Math.random().toString(16).slice(2, 10);
  return `.explore-forecast-preview-${Date.now()}-${suffix}`;
}

function createTempForecasterName() {
  const suffix = Math.random().toString(16).slice(2, 10);
  return `explore_forecast_preview_${Date.now()}_${suffix}`;
}

function parsePromqlDurationMillis(durationText?: string) {
  if (!durationText) return undefined;

  const normalized = durationText.trim();
  if (!normalized) return undefined;

  const parts = Array.from(normalized.matchAll(/(\d+)(ms|s|m|h|d|w|y)/g));
  if (parts.length === 0) return undefined;

  let lastIndex = 0;
  let totalMillis = 0;
  for (const part of parts) {
    const [token, amountText, unit] = part;
    if (part.index !== lastIndex) {
      return undefined;
    }
    totalMillis += Number(amountText) * PROMQL_DURATION_TO_MILLIS[unit];
    lastIndex += token.length;
  }

  if (lastIndex !== normalized.length || totalMillis <= 0) {
    return undefined;
  }

  return totalMillis;
}

function parsePromqlRangeVectorMillis(promqlQuery?: string) {
  if (!promqlQuery) return undefined;

  const bracketMatches = Array.from(promqlQuery.matchAll(/\[([^\]]+)\]/g));
  if (bracketMatches.length === 0) return undefined;

  for (let index = bracketMatches.length - 1; index >= 0; index -= 1) {
    const rawBracketContent = bracketMatches[index]?.[1]?.trim();
    if (!rawBracketContent) continue;

    // Support both range vectors like [5m] and subqueries like [5m:1m].
    const rangePart = rawBracketContent.split(':')[0]?.trim();
    const rangeMillis = parsePromqlDurationMillis(rangePart);
    if (rangeMillis !== undefined) {
      return rangeMillis;
    }
  }

  return undefined;
}

function formatDurationForMessage(durationMillis?: number) {
  if (!Number.isFinite(durationMillis) || durationMillis == null || durationMillis <= 0) {
    return undefined;
  }

  const duration = Math.round(durationMillis);
  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  if (duration % DAY === 0) {
    return `${duration / DAY}d`;
  }
  if (duration % HOUR === 0) {
    return `${duration / HOUR}h`;
  }
  if (duration % MINUTE === 0) {
    return `${duration / MINUTE}m`;
  }
  if (duration % SECOND === 0) {
    return `${duration / SECOND}s`;
  }

  return `${duration}ms`;
}

function buildForecastPreviewGuidance(rangeMillis: number, promqlLookbackMillis?: number) {
  const lookbackLabel = formatDurationForMessage(promqlLookbackMillis);
  const rangeLabel = formatDurationForMessage(rangeMillis);

  if (
    Number.isFinite(promqlLookbackMillis) &&
    promqlLookbackMillis != null &&
    promqlLookbackMillis > 0 &&
    Number.isFinite(rangeMillis) &&
    rangeMillis > 0
  ) {
    const recommendedRangeMillis = Math.max(60 * 60_000, promqlLookbackMillis * 3);
    const recommendedRangeLabel = formatDurationForMessage(recommendedRangeMillis);

    if (rangeMillis <= promqlLookbackMillis) {
      return `This query uses a [${lookbackLabel}] PromQL window, but the selected time range is only ${rangeLabel}. Forecast preview needs a wider history window. Try a time range of at least ${recommendedRangeLabel}.`;
    }

    if (rangeMillis < promqlLookbackMillis * 3) {
      return `This query uses a [${lookbackLabel}] PromQL window, and the selected time range (${rangeLabel}) does not leave enough history for reliable forecast preview. Try a wider range such as ${recommendedRangeLabel} or longer.`;
    }

    if (promqlLookbackMillis < 20 * 60_000) {
      return 'Try widening the time range, using a smoother PromQL window such as [20m], or choosing a steadier metric.';
    }

    return 'Try widening the time range or choosing a steadier metric.';
  }

  return 'Try widening the time range, using a smoother PromQL window such as [20m], or choosing a steadier metric.';
}

function bucketize(points: Array<{ ts: number; value: number }>, bucketMillis: number) {
  const buckets = new Map<number, { sum: number; count: number }>();
  for (const p of points) {
    const ts = Number(p.ts);
    const value = Number(p.value);
    if (!Number.isFinite(ts) || !Number.isFinite(value)) continue;
    const b = Math.floor(ts / bucketMillis) * bucketMillis;
    const cur = buckets.get(b);
    if (cur) {
      cur.sum += value;
      cur.count += 1;
    } else {
      buckets.set(b, { sum: value, count: 1 });
    }
  }
  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([timestamp, agg]) => ({
      timestamp,
      value: agg.count > 0 ? agg.sum / agg.count : null,
    }))
    .filter((d) => d.value !== null) as Array<{ timestamp: number; value: number }>;
}

function pickBucketMillis(rangeMillis: number) {
  if (!Number.isFinite(rangeMillis) || rangeMillis <= 0) return DEFAULT_BUCKET_MILLIS;
  const raw = Math.ceil(rangeMillis / TARGET_BUCKETS);
  for (const c of BUCKET_CANDIDATES_MILLIS) {
    if (c >= raw) return c;
  }
  return BUCKET_CANDIDATES_MILLIS[BUCKET_CANDIDATES_MILLIS.length - 1];
}

function bucketMillisToPeriod(
  bucketMillis: number
): { interval: number; unit: 'Minutes' | 'Seconds' } {
  const MIN = 60_000;
  const SECOND = 1_000;
  if (bucketMillis < MIN) {
    return { interval: Math.max(1, Math.ceil(bucketMillis / SECOND)), unit: 'Seconds' };
  }
  return { interval: Math.max(1, Math.ceil(bucketMillis / MIN)), unit: 'Minutes' };
}

async function transportRequest(client: any, opts: { method: string; path: string; body?: any }) {
  const body = opts.body === undefined ? undefined : JSON.stringify(opts.body);
  return await client.transport.request({
    method: opts.method,
    path: opts.path,
    ...(body !== undefined ? { body } : {}),
  });
}

function looksLikeNoHandler(e: any) {
  const b = e?.body;
  const s = typeof b === 'string' ? b : b ? JSON.stringify(b) : '';
  const msg = e?.message ?? '';
  const combined = `${s}\n${msg}`;
  return combined.includes('no handler found for uri') || combined.includes('no handler found');
}

async function callForecastPreview(client: any, body: any) {
  try {
    return await transportRequest(client, {
      method: 'POST',
      path: '/_plugins/_forecast/forecasters/_preview',
      body,
    });
  } catch (e: any) {
    try {
      return await transportRequest(client, {
        method: 'POST',
        path: '/_opendistro/_forecast/forecasters/_preview',
        body,
      });
    } catch (_legacyError: any) {
      throw e;
    }
  }
}

function normalizeForecastPreviewErrorMessage(
  rawMessage?: string,
  options?: { rangeMillis?: number; promqlLookbackMillis?: number }
) {
  const normalized = rawMessage?.trim();
  if (!normalized) {
    return 'Forecast preview failed.';
  }

  if (
    normalized.includes('No data to preview anomaly detection.') ||
    normalized.includes('No data available for preview.')
  ) {
    return `Forecast preview is unavailable for this metric and time range because there are not enough usable forecast samples after preview processing. ${buildForecastPreviewGuidance(
      options?.rangeMillis ?? 0,
      options?.promqlLookbackMillis
    )}`;
  }

  if (/Time unit .* is not supported/i.test(normalized)) {
    return 'Forecast preview selected an unsupported interval for this metric. Refresh the page and retry.';
  }

  return normalized;
}

function normalizeForecastPreviewErrorDetails(rawDetails: any, normalizedMessage: string) {
  if (!rawDetails) {
    return undefined;
  }

  if (typeof rawDetails === 'string') {
    return normalizedMessage;
  }

  if (typeof rawDetails !== 'object') {
    return rawDetails;
  }

  const rewriteReason = (details: any) => {
    if (!details || typeof details !== 'object') {
      return details;
    }

    return {
      ...details,
      ...(typeof details.reason === 'string' ? { reason: normalizedMessage } : {}),
    };
  };

  return {
    ...rewriteReason(rawDetails),
    ...(Array.isArray(rawDetails.root_cause)
      ? {
          root_cause: rawDetails.root_cause.map((cause: any) => rewriteReason(cause)),
        }
      : {}),
  };
}

export function registerForecastPreviewRoutes({
  router,
  logger,
}: {
  router: IRouter;
  logger: Logger;
}) {
  router.post(
    {
      path: '/api/explore/forecast_preview',
      validate: {
        body: schema.object({
          points: schema.arrayOf(
            schema.object({
              ts: schema.number(),
              value: schema.number(),
            })
          ),
          startTime: schema.maybe(schema.number()),
          endTime: schema.maybe(schema.number()),
          bucketSizeSeconds: schema.maybe(schema.number()),
          shingleSize: schema.maybe(schema.number()),
          horizon: schema.maybe(schema.number()),
          promqlQuery: schema.maybe(schema.string()),
          dataConnectionId: schema.maybe(schema.string()),
          seriesValue: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      const client = context.core.opensearch.client.asCurrentUser;
      const {
        points,
        startTime,
        endTime,
        bucketSizeSeconds,
        shingleSize = DEFAULT_SHINGLE_SIZE,
        horizon,
        promqlQuery,
        dataConnectionId,
        seriesValue,
      } = request.body as any;
      const promqlLookbackMillis = parsePromqlRangeVectorMillis(promqlQuery);

      if (!points?.length) {
        return response.ok({ body: { ok: false, message: 'points must be non-empty' } });
      }

      const ptsSorted = [...points].sort((a, b) => a.ts - b.ts);
      const ptsStart = ptsSorted[0]?.ts;
      const ptsEnd = ptsSorted[ptsSorted.length - 1]?.ts;
      const periodStart = Number.isFinite(startTime) ? startTime : ptsStart;
      const periodEnd = Number.isFinite(endTime) ? endTime : ptsEnd;
      const rangeMillis =
        Number.isFinite(periodStart) && Number.isFinite(periodEnd) && periodEnd > periodStart
          ? periodEnd - periodStart
          : 0;
      const promqlIntervalBucketCount =
        promqlLookbackMillis && promqlLookbackMillis > 0
          ? Math.floor(rangeMillis / promqlLookbackMillis)
          : 0;
      const defaultBucketMillis = pickBucketMillis(rangeMillis);
      let effectiveBucketMillis =
        promqlLookbackMillis && promqlIntervalBucketCount >= MIN_BUCKETS_FOR_PROMQL_INTERVAL
          ? promqlLookbackMillis
          : defaultBucketMillis;
      if (Number.isFinite(bucketSizeSeconds) && bucketSizeSeconds > 0) {
        effectiveBucketMillis = Math.max(
          DEFAULT_BUCKET_MILLIS,
          Math.floor(bucketSizeSeconds * 1000)
        );
      }

      let effectivePoints = points;
      let prometheusStepSeconds: number | undefined;
      let pointSource = 'request_points';
      const buildPrePreviewMeta = (extra?: Record<string, unknown>) => ({
        executionMode: 'forecast_preview_api',
        periodStart,
        periodEnd,
        requestedPointsIn: points.length,
        pointsIn: effectivePoints.length,
        pointSource,
        prometheusStepSeconds,
        promqlLookbackMillis,
        promqlIntervalBucketCount,
        ...extra,
      });

      if (promqlQuery) {
        if (!dataConnectionId) {
          pointSource = 'prometheus_direct_query_unavailable';
          return response.ok({
            body: {
              ok: false,
              message:
                'Forecast preview requires a Prometheus datasource connection for this query. Reopen the metric with a valid Prometheus datasource and try again.',
              meta: buildPrePreviewMeta({
                errorMessage:
                  'Forecast preview requires a Prometheus datasource connection for this query. Reopen the metric with a valid Prometheus datasource and try again.',
                errorType: 'missing_data_connection_id',
              }),
            },
          });
        }

        if (
          !Number.isFinite(periodStart) ||
          !Number.isFinite(periodEnd) ||
          periodEnd <= periodStart
        ) {
          pointSource = 'prometheus_direct_query_unavailable';
          return response.ok({
            body: {
              ok: false,
              message:
                'Forecast preview could not determine a valid time range for direct Prometheus sampling. Adjust the metric time picker and try again.',
              meta: buildPrePreviewMeta({
                errorMessage:
                  'Forecast preview could not determine a valid time range for direct Prometheus sampling. Adjust the metric time picker and try again.',
                errorType: 'invalid_preview_time_range',
              }),
            },
          });
        }

        try {
          const requestedPrometheusStepMillis = Math.max(
            DEFAULT_BUCKET_MILLIS,
            effectiveBucketMillis,
            Math.ceil(rangeMillis / MAX_BUCKETS_TARGET)
          );
          const densePointsResult = await fetchPrometheusPreviewPoints({
            client,
            promqlQuery,
            dataConnectionId,
            startTimeMs: periodStart,
            endTimeMs: periodEnd,
            preferredSeries: seriesValue,
            maxPoints: MAX_BUCKETS_TARGET,
            stepSeconds: Math.ceil(requestedPrometheusStepMillis / 1000),
          });
          if (densePointsResult.points.length > 1) {
            effectivePoints = densePointsResult.points;
            prometheusStepSeconds = densePointsResult.stepSeconds;
            pointSource = 'prometheus_direct_query';
          } else {
            pointSource = 'prometheus_direct_query_empty';
            prometheusStepSeconds = densePointsResult.stepSeconds;
            effectivePoints = densePointsResult.points;
            return response.ok({
              body: {
                ok: false,
                message: `Forecast preview could not load enough metric datapoints directly from Prometheus for the selected time range. ${buildForecastPreviewGuidance(
                  rangeMillis,
                  promqlLookbackMillis
                )}`,
                meta: buildPrePreviewMeta({
                  errorMessage: `Forecast preview could not load enough metric datapoints directly from Prometheus for the selected time range. ${buildForecastPreviewGuidance(
                    rangeMillis,
                    promqlLookbackMillis
                  )}`,
                  errorType: 'insufficient_prometheus_preview_points',
                }),
              },
            });
          }
        } catch (error: any) {
          logger.warn(
            `Explore Forecast preview dense Prometheus fetch failed: ${error?.message ?? error}`
          );
          pointSource = 'prometheus_direct_query_failed';
          return response.ok({
            body: {
              ok: false,
              message: `Forecast preview could not load metric data directly from Prometheus for the selected time range. Check the datasource connection. ${buildForecastPreviewGuidance(
                rangeMillis,
                promqlLookbackMillis
              )}`,
              details: error?.body?.error ?? error?.body ?? error?.message,
              meta: buildPrePreviewMeta({
                errorMessage: `Forecast preview could not load metric data directly from Prometheus for the selected time range. Check the datasource connection. ${buildForecastPreviewGuidance(
                  rangeMillis,
                  promqlLookbackMillis
                )}`,
                errorType:
                  error?.body?.error?.type ??
                  error?.body?.type ??
                  (typeof error?.message === 'string'
                    ? 'prometheus_direct_query_failed'
                    : undefined),
              }),
            },
          });
        }
      }

      if (Number.isFinite(prometheusStepSeconds) && prometheusStepSeconds! > 0) {
        effectiveBucketMillis = Math.max(
          effectiveBucketMillis,
          Math.floor(prometheusStepSeconds! * 1000)
        );
      }

      let docs = bucketize(effectivePoints, effectiveBucketMillis);
      while (docs.length > MAX_BUCKETS_TARGET) {
        const next = BUCKET_CANDIDATES_MILLIS.find((c) => c > effectiveBucketMillis);
        if (!next) break;
        effectiveBucketMillis = next;
        docs = bucketize(effectivePoints, effectiveBucketMillis);
      }
      if (!docs.length) {
        return response.ok({
          body: { ok: false, message: 'No valid points to preview after bucketing' },
        });
      }

      const period = bucketMillisToPeriod(effectiveBucketMillis);
      const lastObservedPointTime =
        effectivePoints.length > 0
          ? Number(effectivePoints[effectivePoints.length - 1]?.ts)
          : Number.NaN;
      const horizonBuckets =
        Number.isFinite(horizon) && horizon > 0
          ? Math.floor(horizon)
          : Math.max(
              MIN_DEFAULT_HORIZON_BUCKETS,
              Math.min(MAX_DEFAULT_HORIZON_BUCKETS, Math.ceil(docs.length * 0.2))
            );
      const buildPreviewMeta = (extra?: Record<string, unknown>) => ({
        executionMode: 'forecast_preview_api',
        periodStart,
        periodEnd,
        requestedPointsIn: points.length,
        pointsIn: effectivePoints.length,
        pointsBucketed: docs.length,
        bucketSizeMillis: effectiveBucketMillis,
        forecastInterval: period,
        horizon: horizonBuckets,
        pointSource,
        prometheusStepSeconds,
        lastObservedPointTime,
        promqlLookbackMillis,
        promqlIntervalBucketCount,
        usedPromqlLookbackInterval:
          promqlLookbackMillis != null &&
          promqlLookbackMillis > 0 &&
          effectiveBucketMillis === promqlLookbackMillis,
        ...extra,
      });

      const tempIndex = createTempIndexName();

      try {
        // Create hidden temp index
        await client.indices.create({
          index: tempIndex,
          body: {
            settings: {
              index: {
                hidden: true,
                number_of_shards: 1,
                number_of_replicas: 0,
                refresh_interval: -1,
              },
            },
            mappings: {
              dynamic: false,
              properties: {
                timestamp: { type: 'date', format: 'epoch_millis' },
                value: { type: 'double' },
              },
            },
          },
        });

        const bulkBody: any[] = [];
        for (const d of docs) {
          bulkBody.push({ index: { _index: tempIndex } });
          bulkBody.push({ timestamp: d.timestamp, value: d.value });
        }
        await client.bulk({ body: bulkBody, refresh: true });

        // Use inline forecaster + preview API so no forecaster config resource is created.
        const previewRequestBody = {
          period_start: periodStart,
          period_end: periodEnd,
          forecaster: {
            name: createTempForecasterName(),
            description: 'Forecast preview from Explore Metrics',
            time_field: 'timestamp',
            indices: [tempIndex],
            filter_query: { match_all: {} },
            feature_attributes: [
              {
                feature_name: 'value_avg',
                feature_enabled: true,
                aggregation_query: {
                  value_avg: { avg: { field: 'value' } },
                },
              },
            ],
            forecast_interval: { period },
            window_delay: { period: { interval: 0, unit: 'Minutes' } },
            shingle_size: shingleSize,
            horizon: horizonBuckets,
          },
        };

        let previewResp: any;
        try {
          previewResp = await callForecastPreview(client, previewRequestBody);
        } catch (e: any) {
          if (looksLikeNoHandler(e)) {
            const normalizedMessage =
              'Forecasting preview endpoint not found on this OpenSearch cluster. Install/enable the Forecast plugin to use preview.';
            return response.ok({
              body: {
                ok: false,
                message: normalizedMessage,
                details: e?.body ?? e?.message,
                meta: buildPreviewMeta({
                  errorMessage: normalizedMessage,
                  errorType: e?.body?.error?.type,
                }),
              },
            });
          }
          throw e;
        }

        const rawForecastResult =
          previewResp?.body?.forecast_result ?? previewResp?.forecast_result ?? [];
        const toNum = (x: any) => (x != null && x !== 'NaN' ? Number(x) : NaN);
        const parsedForecastRows = (Array.isArray(rawForecastResult) ? rawForecastResult : [])
          .map((item: any) => {
            const tt = Number(
              item?.forecast_data_end_time ??
                item?.forecast_data_start_time ??
                item?.data_end_time ??
                item?.data_start_time
            );
            const baseDataEndTime = Number(item?.data_end_time ?? item?.data_start_time);
            const vv = toNum(item?.forecast_value);
            const ll = toNum(item?.forecast_lower_bound);
            const hh = toNum(item?.forecast_upper_bound);
            if (!Number.isFinite(tt) || !Number.isFinite(vv)) return null;
            return {
              baseDataEndTime,
              t: tt,
              v: vv,
              lo: Number.isFinite(ll) ? ll : undefined,
              hi: Number.isFinite(hh) ? hh : undefined,
            };
          })
          .filter(Boolean)
          .sort((a: any, b: any) => a.t - b.t);
        const latestForecastBaseEndTime = parsedForecastRows.reduce(
          (max: number, point: any) =>
            Number.isFinite(point?.baseDataEndTime) && point.baseDataEndTime > max
              ? point.baseDataEndTime
              : max,
          Number.NEGATIVE_INFINITY
        );
        const latestForecastBlock = parsedForecastRows.filter(
          (point: any) =>
            Number.isFinite(latestForecastBaseEndTime) &&
            point?.baseDataEndTime === latestForecastBaseEndTime
        );
        const latestFutureForecastBlock = latestForecastBlock.filter(
          (point: any) => !Number.isFinite(lastObservedPointTime) || point.t > lastObservedPointTime
        );
        const fallbackFutureForecastPoints = parsedForecastRows.filter(
          (point: any) => !Number.isFinite(lastObservedPointTime) || point.t > lastObservedPointTime
        );
        const forecastPoints =
          latestFutureForecastBlock.length > 0
            ? latestFutureForecastBlock
            : latestForecastBlock.length > 0
            ? latestForecastBlock
            : fallbackFutureForecastPoints;

        if (
          Array.isArray(rawForecastResult) &&
          rawForecastResult.length > 0 &&
          parsedForecastRows.length === 0
        ) {
          return response.ok({
            body: {
              ok: false,
              message: `Forecast preview did not produce any future forecast samples for this metric and time range. ${buildForecastPreviewGuidance(
                rangeMillis,
                promqlLookbackMillis
              )}`,
              response: {
                periodStart,
                periodEnd,
                points: [],
                forecast_result: rawForecastResult,
              },
              meta: buildPreviewMeta({
                forecastResultCount: rawForecastResult.length,
                forecastRowsWithValue: 0,
                errorMessage: `Forecast preview did not produce any future forecast samples for this metric and time range. ${buildForecastPreviewGuidance(
                  rangeMillis,
                  promqlLookbackMillis
                )}`,
                errorType: 'no_forecast_values',
              }),
            },
          });
        }

        return response.ok({
          body: {
            ok: true,
            response: {
              periodStart,
              periodEnd,
              points: forecastPoints,
              forecast_result: rawForecastResult,
            },
            meta: buildPreviewMeta({
              forecastResultCount: Array.isArray(rawForecastResult) ? rawForecastResult.length : 0,
              forecastRowsWithValue: parsedForecastRows.length,
              latestForecastBaseEndTime: Number.isFinite(latestForecastBaseEndTime)
                ? latestForecastBaseEndTime
                : undefined,
            }),
          },
        });
      } catch (e: any) {
        logger.error(`Explore Forecast preview failed: ${e?.message ?? e}`);
        const rawErrorMessage =
          e?.body?.error?.reason ??
          e?.body?.error?.root_cause?.[0]?.reason ??
          e?.body?.error?.type ??
          (typeof e?.body === 'string' ? e.body : undefined) ??
          e?.message;
        const normalizedMessage = normalizeForecastPreviewErrorMessage(rawErrorMessage, {
          rangeMillis,
          promqlLookbackMillis,
        });
        return response.ok({
          body: {
            ok: false,
            message: normalizedMessage,
            details: normalizeForecastPreviewErrorDetails(
              e?.body?.error ?? e?.body ?? undefined,
              normalizedMessage
            ),
            meta: buildPreviewMeta({
              errorMessage: normalizedMessage,
              errorType: e?.body?.error?.type,
            }),
          },
        });
      } finally {
        // Best-effort cleanup
        try {
          await client.indices.delete({ index: tempIndex });
        } catch (e: any) {
          logger.debug(
            `Explore Forecast preview cleanup failed for ${tempIndex}: ${e?.message ?? e}`
          );
        }
      }
    }
  );
}
