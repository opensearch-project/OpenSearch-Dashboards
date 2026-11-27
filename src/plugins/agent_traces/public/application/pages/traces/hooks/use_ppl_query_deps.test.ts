/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataView } from '../../../../../../data/common';
import { buildPPLDatasetParam } from './use_ppl_query_deps';

describe('buildPPLDatasetParam', () => {
  it('preserves schema mappings for downstream PPL requests', () => {
    const schemaMappings = {
      otelTraces: { traceId: 'traceId' },
    };
    const dataset = {
      id: 'traces-dataset',
      title: 'otel-v1-apm-span-*',
      type: 'INDEX_PATTERN',
      timeFieldName: 'startTime',
      schemaMappings,
    } as DataView;

    expect(buildPPLDatasetParam(dataset)).toEqual(expect.objectContaining({ schemaMappings }));
  });

  it('returns null without a selected data view', () => {
    expect(buildPPLDatasetParam(undefined)).toBeNull();
  });
});
