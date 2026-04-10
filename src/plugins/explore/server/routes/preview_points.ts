/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const MAX_PREVIEW_DATAPOINTS = 500;
const MIN_PROMETHEUS_STEP_SECONDS = 60;
const TARGET_PREVIEW_DATAPOINTS = 500;

export interface PreviewPoint {
  ts: number;
  value: number;
}

interface FetchPrometheusPreviewPointsArgs {
  client: any;
  promqlQuery: string;
  dataConnectionId: string;
  startTimeMs: number;
  endTimeMs: number;
  preferredSeries?: string;
  maxPoints?: number;
  stepSeconds?: number;
  targetDatapoints?: number;
}

interface FetchPrometheusPreviewPointsResult {
  points: PreviewPoint[];
  selectedSeries?: string;
  stepSeconds: number;
}

const toFiniteNumber = (value: unknown): number | undefined => {
  const normalized = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(normalized) ? normalized : undefined;
};

const downsamplePreviewPoints = (
  points: PreviewPoint[],
  maxPoints: number = MAX_PREVIEW_DATAPOINTS
): PreviewPoint[] => {
  if (points.length <= maxPoints) {
    return points;
  }

  const step = (points.length - 1) / (maxPoints - 1);
  const sampled = Array.from({ length: maxPoints }, (_, index) => {
    const pointIndex = Math.floor(index * step);
    return points[Math.min(pointIndex, points.length - 1)];
  });

  sampled[sampled.length - 1] = points[points.length - 1];
  return sampled;
};

const buildPrometheusStepSeconds = (
  startTimeMs: number,
  endTimeMs: number,
  targetDatapoints: number = TARGET_PREVIEW_DATAPOINTS
): number => {
  const rangeMillis = Math.max(0, endTimeMs - startTimeMs);
  const safeTarget = Math.max(1, Math.floor(targetDatapoints));
  const rawStepSeconds = Math.ceil(rangeMillis / safeTarget / 1000);
  return Math.max(MIN_PROMETHEUS_STEP_SECONDS, rawStepSeconds || MIN_PROMETHEUS_STEP_SECONDS);
};

const extractPayload = (response: any) => response?.body ?? response;

const normalizeSeriesToken = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/["']/g, '');

const buildMetricSeriesCandidates = (metric: Record<string, unknown>): string[] => {
  const entries = Object.entries(metric ?? {}).filter(
    ([key, value]) => key != null && value != null && String(value).trim() !== ''
  );
  if (entries.length === 0) {
    return [];
  }

  const sortedEntries = [...entries].sort(([leftKey], [rightKey]) =>
    leftKey.localeCompare(rightKey)
  );
  const quotedPairs = sortedEntries.map(([key, value]) => `${key}="${value}"`);
  const plainPairs = sortedEntries.map(([key, value]) => `${key}=${value}`);
  const metricName = metric.__name__ != null ? String(metric.__name__) : '';
  const labelsWithoutName = sortedEntries.filter(([key]) => key !== '__name__');
  const quotedLabelPairs = labelsWithoutName.map(([key, value]) => `${key}="${value}"`);

  return Array.from(
    new Set(
      [
        JSON.stringify(metric),
        plainPairs.join(','),
        quotedPairs.join(','),
        `{${quotedPairs.join(',')}}`,
        metricName && quotedLabelPairs.length > 0
          ? `${metricName}{${quotedLabelPairs.join(',')}}`
          : undefined,
        metricName || undefined,
      ].filter((candidate): candidate is string => Boolean(candidate && candidate.trim()))
    )
  );
};

const selectSeries = <T extends { candidates: string[]; points: PreviewPoint[]; label?: string }>(
  seriesList: T[],
  preferredSeries?: string
): T | undefined => {
  if (seriesList.length === 0) {
    return undefined;
  }

  if (preferredSeries) {
    const normalizedPreferred = normalizeSeriesToken(preferredSeries);
    const exactMatch = seriesList.find((series) =>
      series.candidates.some((candidate) => normalizeSeriesToken(candidate) === normalizedPreferred)
    );
    if (exactMatch) {
      return exactMatch;
    }
  }

  return seriesList.find((series) => series.points.length > 0) ?? seriesList[0];
};

const parsePrometheusMatrixOrVector = (
  payload: any,
  dataConnectionId: string,
  preferredSeries?: string,
  maxPoints: number = MAX_PREVIEW_DATAPOINTS
): FetchPrometheusPreviewPointsResult | undefined => {
  const results = payload?.results;
  if (!results || typeof results !== 'object') {
    return undefined;
  }

  const dataSourceResult =
    results?.[dataConnectionId] ??
    Object.values(results).find((candidate) => candidate && typeof candidate === 'object');
  const resultType = dataSourceResult?.resultType;
  const rawResult = Array.isArray(dataSourceResult?.result) ? dataSourceResult.result : undefined;

  if (!rawResult || (resultType !== 'matrix' && resultType !== 'vector')) {
    return undefined;
  }

  const seriesList = rawResult.map((series: any) => {
    const metric = series?.metric && typeof series.metric === 'object' ? series.metric : {};
    const candidates = buildMetricSeriesCandidates(metric);
    const rawValues =
      resultType === 'vector'
        ? series?.value != null
          ? [series.value]
          : []
        : Array.isArray(series?.values)
        ? series.values
        : [];
    const points = rawValues
      .map((valuePair: any) => {
        if (!Array.isArray(valuePair) || valuePair.length < 2) {
          return null;
        }
        const timestampSeconds = toFiniteNumber(valuePair[0]);
        const value = toFiniteNumber(valuePair[1]);
        if (timestampSeconds === undefined || value === undefined) {
          return null;
        }
        return {
          ts: timestampSeconds * 1000,
          value,
        };
      })
      .filter((point): point is PreviewPoint => Boolean(point))
      .sort((left, right) => left.ts - right.ts);

    return {
      label: candidates[0],
      candidates,
      points,
    };
  });

  const selectedSeries = selectSeries(seriesList, preferredSeries);
  if (!selectedSeries) {
    return { points: [], stepSeconds: 0 };
  }

  return {
    points: downsamplePreviewPoints(selectedSeries.points, maxPoints),
    selectedSeries: selectedSeries.label,
    stepSeconds: 0,
  };
};

const parseDataFrame = (
  payload: any,
  preferredSeries?: string,
  maxPoints: number = MAX_PREVIEW_DATAPOINTS
): FetchPrometheusPreviewPointsResult | undefined => {
  const fields = Array.isArray(payload?.fields) ? payload.fields : [];
  const size = Number(payload?.size ?? 0);

  if (fields.length === 0 || size <= 0) {
    return undefined;
  }

  const timeField =
    fields.find((field: any) => /^time$/i.test(field?.name ?? '')) ??
    fields.find((field: any) => /timestamp|date/i.test(field?.type ?? '')) ??
    fields[0];
  const valueField =
    fields.find((field: any) => /^value$/i.test(field?.name ?? '')) ??
    fields.find((field: any) => /number|double|long|integer|float/i.test(field?.type ?? ''));
  const seriesField = fields.find((field: any) => /^series$/i.test(field?.name ?? ''));

  if (!timeField || !valueField) {
    return undefined;
  }

  const rows = Array.from({ length: size }, (_, index) => ({
    time: timeField.values?.[index],
    value: valueField.values?.[index],
    series: seriesField?.values?.[index],
  }));

  const seriesList = Array.from(
    rows
      .reduce((accumulator, row) => {
        const seriesKey = String(row.series ?? '');
        const current = accumulator.get(seriesKey) ?? {
          label: seriesKey || undefined,
          candidates: seriesKey ? [seriesKey] : [],
          points: [] as PreviewPoint[],
        };

        const timestamp =
          typeof row.time === 'number'
            ? row.time
            : row.time
            ? new Date(String(row.time)).getTime()
            : NaN;
        const value = typeof row.value === 'number' ? row.value : Number(row.value);
        if (Number.isFinite(timestamp) && Number.isFinite(value)) {
          current.points.push({ ts: timestamp, value });
        }

        accumulator.set(seriesKey, current);
        return accumulator;
      }, new Map<string, { label?: string; candidates: string[]; points: PreviewPoint[] }>())
      .values()
  ).map((series) => ({
    ...series,
    points: series.points.sort((left, right) => left.ts - right.ts),
  }));

  const selectedSeries = selectSeries(seriesList, preferredSeries);
  if (!selectedSeries) {
    return undefined;
  }

  return {
    points: downsamplePreviewPoints(selectedSeries.points, maxPoints),
    selectedSeries: selectedSeries.label,
    stepSeconds: 0,
  };
};

export async function fetchPrometheusPreviewPoints({
  client,
  promqlQuery,
  dataConnectionId,
  startTimeMs,
  endTimeMs,
  preferredSeries,
  maxPoints = MAX_PREVIEW_DATAPOINTS,
  stepSeconds: requestedStepSeconds,
  targetDatapoints,
}: FetchPrometheusPreviewPointsArgs): Promise<FetchPrometheusPreviewPointsResult> {
  const stepSeconds =
    Number.isFinite(requestedStepSeconds) && requestedStepSeconds! > 0
      ? Math.max(MIN_PROMETHEUS_STEP_SECONDS, Math.floor(requestedStepSeconds!))
      : buildPrometheusStepSeconds(startTimeMs, endTimeMs, targetDatapoints);
  const response = await client.transport.request({
    method: 'POST',
    path: `/_plugins/_directquery/_query/${encodeURIComponent(dataConnectionId)}`,
    body: JSON.stringify({
      query: promqlQuery,
      language: 'PROMQL',
      options: {
        queryType: 'range',
        start: String(Math.floor(startTimeMs / 1000)),
        end: String(Math.ceil(endTimeMs / 1000)),
        step: String(stepSeconds),
      },
    }),
  });

  const payload = extractPayload(response);
  const nativePrometheusResult = parsePrometheusMatrixOrVector(
    payload,
    dataConnectionId,
    preferredSeries,
    maxPoints
  );
  if (nativePrometheusResult) {
    return {
      ...nativePrometheusResult,
      stepSeconds,
    };
  }

  const dataFrameResult = parseDataFrame(payload, preferredSeries, maxPoints);
  if (dataFrameResult) {
    return {
      ...dataFrameResult,
      stepSeconds,
    };
  }

  return { points: [], stepSeconds };
}
