/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import { gunzipSync } from 'zlib';
import { ecommerceSpecProvider, flightsSpecProvider, logsSpecProvider } from './index';
import { otelSpecProvider } from './otel';
import { getNestedField } from './util';

// Time series backends (for example OpenSearch Serverless time series collections) require
// every document to contain the `@timestamp` field. Each sample index exposes it, usually as
// an alias to the dataset's own time field, so the sample data installs on those backends too.
const getMapping = (fields: any, path: string): any =>
  path.split('.').reduce((m: any, key) => m?.properties?.[key] ?? m?.[key], { properties: fields });

const dataIndices = [
  ecommerceSpecProvider(),
  flightsSpecProvider(),
  logsSpecProvider(),
  otelSpecProvider(),
].flatMap((dataset) => dataset.dataIndices.map((dataIndex) => [dataIndex.id, dataIndex] as const));

describe('sample data @timestamp field', () => {
  it.each(dataIndices)('%s maps @timestamp to a date field present in every document', (_, d) => {
    const mapping = (d.fields as any)['@timestamp'];
    expect(mapping).toBeDefined();

    const timeField = mapping.type === 'alias' ? mapping.path : '@timestamp';
    expect(['date', 'date_nanos']).toContain(getMapping(d.fields, timeField)?.type);

    const docs = gunzipSync(fs.readFileSync(d.dataPath))
      .toString('utf8')
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line));
    expect(docs.length).toBeGreaterThan(0);
    expect(docs.filter((doc) => getNestedField(doc, timeField) === undefined)).toHaveLength(0);
  });
});
