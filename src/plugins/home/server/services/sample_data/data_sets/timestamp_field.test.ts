/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import { gunzipSync } from 'zlib';
import { ecommerceSpecProvider, flightsSpecProvider, logsSpecProvider } from './index';
import { otelSpecProvider } from './otel';
import { getNestedField } from './util';
import { TIMESTAMP_FIELD, withTimestampAlias } from '../lib/serverless_time_series';

// Serverless time series collections require `@timestamp` in every document. On those
// collections the install adds `@timestamp` as an alias to the first entry of `timeFields`, so
// that entry must be a date field that every document contains.
interface FieldMapping {
  type?: string;
  path?: string;
  properties?: Record<string, FieldMapping>;
}

const getMapping = (fields: Record<string, FieldMapping>, path: string) =>
  path.split('.').reduce<FieldMapping | undefined>((mapping, key) => mapping?.properties?.[key], {
    properties: fields,
  });

const dataIndices = [
  ecommerceSpecProvider(),
  flightsSpecProvider(),
  logsSpecProvider(),
  otelSpecProvider(),
].flatMap((dataset) => dataset.dataIndices.map((dataIndex) => [dataIndex.id, dataIndex] as const));

describe('sample data @timestamp on Serverless time series collections', () => {
  it.each(dataIndices)('%s resolves @timestamp to a date in every document', (_, dataIndex) => {
    const fields = withTimestampAlias(
      dataIndex.fields as Record<string, FieldMapping>,
      dataIndex.timeFields
    ) as Record<string, FieldMapping>;
    const timestamp = fields[TIMESTAMP_FIELD];
    expect(timestamp).toBeDefined();

    const timeField = timestamp.type === 'alias' ? (timestamp.path as string) : TIMESTAMP_FIELD;
    expect(['date', 'date_nanos']).toContain(getMapping(fields, timeField)?.type);

    const docs = gunzipSync(fs.readFileSync(dataIndex.dataPath))
      .toString('utf8')
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line));
    expect(docs.length).toBeGreaterThan(0);
    expect(docs.filter((doc) => getNestedField(doc, timeField) === undefined)).toHaveLength(0);
  });
});
