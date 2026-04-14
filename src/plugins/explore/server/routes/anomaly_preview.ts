/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import type { Logger, IRouter } from '../../../../core/server';
import { fetchPrometheusPreviewPoints } from './preview_points';

const DEFAULT_BUCKET_MILLIS = 60_000; // 1 minute buckets (AD requires minute-level interval)
const DEFAULT_SHINGLE_SIZE = 8;
const EXPLORE_MIN_PREVIEW_SIZE = 200;
const MAX_BUCKETS_TARGET = 10_000;
const TARGET_BUCKETS = 5_000;
const BUCKET_CANDIDATES_MILLIS = [
  60_000, // 1m
  5 * 60_000, // 5m
  15 * 60_000, // 15m
  60 * 60_000, // 1h
  6 * 60 * 60_000, // 6h
  24 * 60 * 60_000, // 1d
];

function createTempIndexName() {
  // Hidden/system-ish index name. Using timestamp + random suffix to avoid collisions.
  const suffix = Math.random().toString(16).slice(2, 10);
  return `.explore-ad-preview-${Date.now()}-${suffix}`;
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
  const docs = Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([timestamp, agg]) => ({
      timestamp,
      value: agg.count > 0 ? agg.sum / agg.count : null,
    }))
    .filter((d) => d.value !== null) as Array<{ timestamp: number; value: number }>;

  return docs;
}

function pickBucketMillis(rangeMillis: number) {
  if (!Number.isFinite(rangeMillis) || rangeMillis <= 0) return DEFAULT_BUCKET_MILLIS;
  const raw = Math.ceil(rangeMillis / TARGET_BUCKETS);
  // pick smallest candidate >= raw
  for (const c of BUCKET_CANDIDATES_MILLIS) {
    if (c >= raw) return c;
  }
  return BUCKET_CANDIDATES_MILLIS[BUCKET_CANDIDATES_MILLIS.length - 1];
}

function bucketMillisToPeriod(
  bucketMillis: number
): { interval: number; unit: 'Minutes' | 'Hours' | 'Days' } {
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  if (bucketMillis % DAY === 0)
    return { interval: Math.max(1, Math.floor(bucketMillis / DAY)), unit: 'Days' };
  if (bucketMillis % HOUR === 0)
    return { interval: Math.max(1, Math.floor(bucketMillis / HOUR)), unit: 'Hours' };
  return { interval: Math.max(1, Math.floor(bucketMillis / MIN)), unit: 'Minutes' };
}

const toFiniteNumber = (value: unknown): number | undefined => {
  const normalized = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(normalized) ? normalized : undefined;
};

export function registerAnomalyPreviewRoutes({
  router,
  logger,
}: {
  router: IRouter;
  logger: Logger;
}) {
  const callAdPreview = async (client: any, body: any) => {
    const payload = JSON.stringify(body);
    const previewPath = `/_plugins/_anomaly_detection/detectors/_preview?min_preview_size=${EXPLORE_MIN_PREVIEW_SIZE}`;
    const legacyPreviewPath = `/_opendistro/_anomaly_detection/detectors/_preview?min_preview_size=${EXPLORE_MIN_PREVIEW_SIZE}`;
    // OpenSearch AD plugin path (current)
    try {
      return await client.transport.request({
        method: 'POST',
        path: previewPath,
        body: payload,
      });
    } catch (e: any) {
      // Some older clusters (Open Distro) use "/_opendistro/_anomaly_detection".
      // Always try the legacy path if the primary fails (regardless of error shape).
      try {
        return await client.transport.request({
          method: 'POST',
          path: legacyPreviewPath,
          body: payload,
        });
      } catch (e2: any) {
        // throw the original error by default; outer handler will format it.
        throw e;
      }
    }
  };

  router.post(
    {
      path: '/api/explore/anomaly_preview',
      validate: {
        query: schema.object({
          dataSourceId: schema.maybe(schema.string()),
        }),
        body: schema.object({
          // input points are epoch millis timestamps
          points: schema.arrayOf(
            schema.object({
              ts: schema.number(),
              value: schema.number(),
            })
          ),
          // optional preview range (epoch millis). If omitted, inferred from points.
          startTime: schema.maybe(schema.number()),
          endTime: schema.maybe(schema.number()),
          // bucket size used before indexing (seconds). Defaults to 60.
          bucketSizeSeconds: schema.maybe(schema.number()),
          shingleSize: schema.maybe(schema.number()),
          promqlQuery: schema.maybe(schema.string()),
          dataConnectionId: schema.maybe(schema.string()),
          seriesValue: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      const dataSourceId = String(
        (request.query as { dataSourceId?: string })?.dataSourceId || ''
      ).trim();
      const client = dataSourceId
        ? await context.dataSource.opensearch.getClient(dataSourceId)
        : context.core.opensearch.client.asCurrentUser;

      const {
        points,
        startTime,
        endTime,
        bucketSizeSeconds,
        shingleSize = DEFAULT_SHINGLE_SIZE,
        promqlQuery,
        dataConnectionId,
        seriesValue,
      } = request.body as {
        points: Array<{ ts: number; value: number }>;
        startTime?: number;
        endTime?: number;
        bucketSizeSeconds?: number;
        shingleSize?: number;
        promqlQuery?: string;
        dataConnectionId?: string;
        seriesValue?: string;
      };

      if (!points?.length) {
        return response.badRequest({ body: { message: 'points must be a non-empty array' } });
      }

      // Determine preview time range (prefer request range; fall back to point bounds).
      const ptsSorted = [...points].sort((a, b) => a.ts - b.ts);
      const ptsStart = ptsSorted[0]?.ts;
      const ptsEnd = ptsSorted[ptsSorted.length - 1]?.ts;
      const periodStart = Number.isFinite(startTime as number) ? (startTime as number) : ptsStart;
      const periodEnd = Number.isFinite(endTime as number) ? (endTime as number) : ptsEnd;
      const rangeMillis =
        Number.isFinite(periodStart) && Number.isFinite(periodEnd) && periodEnd > periodStart
          ? periodEnd - periodStart
          : 0;

      // Compute adaptive bucket size unless explicitly provided.
      let effectiveBucketMillis = pickBucketMillis(rangeMillis);
      if (Number.isFinite(bucketSizeSeconds) && (bucketSizeSeconds as number) > 0) {
        effectiveBucketMillis = Math.max(
          DEFAULT_BUCKET_MILLIS,
          Math.floor((bucketSizeSeconds as number) * 1000)
        );
      }

      let effectivePoints = points;
      let prometheusStepSeconds: number | undefined;
      let pointSource = 'request_points';

      if (
        promqlQuery &&
        dataConnectionId &&
        Number.isFinite(periodStart) &&
        Number.isFinite(periodEnd) &&
        periodEnd > periodStart
      ) {
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
          }
        } catch (error: any) {
          logger.warn(
            `Explore AD preview dense Prometheus fetch failed, falling back to rendered points: ${
              error?.message ?? error
            }`
          );
          pointSource = 'request_points_fallback';
        }
      }

      if (Number.isFinite(prometheusStepSeconds) && prometheusStepSeconds! > 0) {
        effectiveBucketMillis = Math.max(
          effectiveBucketMillis,
          Math.floor(prometheusStepSeconds! * 1000)
        );
      }

      // Bucketize; if still too many buckets, bump up to larger candidates.
      let docs = bucketize(effectivePoints, effectiveBucketMillis);
      if (!docs.length) {
        return response.badRequest({
          body: { message: 'No valid points to preview after bucketing' },
        });
      }
      while (docs.length > MAX_BUCKETS_TARGET) {
        const next = BUCKET_CANDIDATES_MILLIS.find((c) => c > effectiveBucketMillis);
        if (!next) break;
        effectiveBucketMillis = next;
        docs = bucketize(effectivePoints, effectiveBucketMillis);
      }

      const tempIndex = createTempIndexName();

      try {
        // Create a small hidden index to hold the time-series for preview.
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

        // Call AD Preview Detector API against the temporary index.
        // See: https://docs.opensearch.org/latest/observing-your-data/ad/api/#preview-detector
        const previewRequestBody = {
          period_start: periodStart,
          period_end: periodEnd,
          detector: {
            name: 'explore_ad_preview',
            description: 'AD preview from Explore Metrics',
            time_field: 'timestamp',
            indices: [tempIndex],
            shingle_size: shingleSize,
            detection_interval: { period: bucketMillisToPeriod(effectiveBucketMillis) },
            window_delay: { period: { interval: 0, unit: 'Minutes' } },
            feature_attributes: [
              {
                feature_name: 'value_avg',
                feature_enabled: true,
                aggregation_query: {
                  value_avg: { avg: { field: 'value' } },
                },
              },
            ],
          },
        };

        const previewResp = await callAdPreview(client, previewRequestBody);
        const previewBody = previewResp?.body ?? previewResp;
        const anomalies = Array.isArray(previewBody?.anomaly_result)
          ? previewBody.anomaly_result
          : Array.isArray(previewBody?.anomalies)
          ? previewBody.anomalies
          : [];
        const positiveAnomalyGrades = anomalies
          .map((anomaly: any) => toFiniteNumber(anomaly?.anomaly_grade) ?? 0)
          .filter((grade) => grade > 0);
        const maxAnomalyGrade =
          positiveAnomalyGrades.length > 0
            ? Math.max(...positiveAnomalyGrades)
            : anomalies.length > 0
            ? Math.max(
                ...anomalies.map((anomaly: any) => toFiniteNumber(anomaly?.anomaly_grade) ?? 0)
              )
            : 0;
        const anomalyStatus =
          anomalies.length === 0
            ? 'empty_preview_rows'
            : positiveAnomalyGrades.length === 0
            ? 'no_positive_anomalies'
            : 'positive_anomalies_found';

        return response.ok({
          body: {
            ok: true,
            response: previewBody,
            meta: {
              bucketSizeMillis: effectiveBucketMillis,
              pointsIn: effectivePoints.length,
              pointsBucketed: docs.length,
              pointSource,
              prometheusStepSeconds,
              anomalyResultCount: anomalies.length,
              positiveAnomalyCount: positiveAnomalyGrades.length,
              maxAnomalyGrade,
              anomalyStatus,
              minPreviewSize: EXPLORE_MIN_PREVIEW_SIZE,
              // helpful for client-side tooltip bucketing
              detectionInterval: bucketMillisToPeriod(effectiveBucketMillis),
            },
          },
        });
      } catch (e: any) {
        logger.error(`Explore AD preview failed: ${e?.message ?? e}`);
        // Return 200 with ok:false so the UI can display the detailed AD error message
        // without the HTTP client throwing a generic "Response Error".
        const errBody = e?.body;
        const errBodyStr =
          typeof errBody === 'string' ? errBody : errBody ? JSON.stringify(errBody) : '';
        const errMsg =
          e?.body?.error?.reason ??
          e?.body?.error?.root_cause?.[0]?.reason ??
          e?.body?.error?.type ??
          (errBodyStr || undefined) ??
          e?.message ??
          'Failed to preview anomalies';
        const looksLikeNoHandler =
          (typeof errMsg === 'string' &&
            (errMsg.includes('no handler found for uri') || errMsg.includes('no handler found'))) ||
          (typeof errBodyStr === 'string' &&
            (errBodyStr.includes('no handler found for uri') ||
              errBodyStr.includes('no handler found')));

        return response.ok({
          body: {
            ok: false,
            message: looksLikeNoHandler
              ? 'Anomaly Detection plugin endpoint not found on this OpenSearch cluster. Ensure the AD plugin is installed/enabled.'
              : errMsg,
            details: e?.body?.error ?? e?.body ?? undefined,
          },
        });
      } finally {
        try {
          await client.indices.delete({ index: tempIndex });
        } catch (e: any) {
          // Best-effort cleanup
          logger.debug(`Explore AD preview cleanup failed for ${tempIndex}: ${e?.message ?? e}`);
        }
      }
    }
  );
}
