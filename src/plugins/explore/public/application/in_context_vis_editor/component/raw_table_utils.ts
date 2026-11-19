/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { normalizeResultRows } from '../../../components/visualizations/utils/normalize_result_rows';
import type { RawTableStage } from '../../../components/visualizations/visualization_builder';
import type { VisData } from '../../../components/visualizations/visualization_builder.types';
import type { VisColumn } from '../../../components/visualizations/types';
import type { FinalPipelineSeriesResult } from '../../../components/data_transformations/types';
import { RAW_TABLE_FINAL } from '../multi_query_builder/utils';
import type { SeriesResult } from '../multi_query_builder/types';

export interface RawTable {
  rows: Array<Record<string, unknown>>;
  columns: VisColumn[];
}

const toTable = (
  rows: SeriesResult['rows'],
  fieldSchema: SeriesResult['fieldSchema']
): RawTable => {
  const normalized = normalizeResultRows(rows, fieldSchema);
  return {
    rows: normalized.transformedData,
    columns: [
      ...normalized.numericalColumns,
      ...normalized.categoricalColumns,
      ...normalized.dateColumns,
      ...normalized.unknownColumns,
    ],
  };
};

/**
 * What the raw table shows. Final: the data the vis draws. A query, before: its own result. A
 * query, after: its series after the last step; once merged by a step there's none (undefined).
 */
export const resolveRawTable = ({
  series,
  refId,
  stage,
  pipelineResult,
  visData,
}: {
  series: SeriesResult[];
  refId: string | undefined;
  stage: RawTableStage;
  pipelineResult?: FinalPipelineSeriesResult;
  visData?: VisData;
}): RawTable | undefined => {
  if (refId === RAW_TABLE_FINAL) {
    if (!visData) return undefined;
    return {
      rows: visData.transformedData,
      columns: [
        ...visData.numericalColumns,
        ...visData.categoricalColumns,
        ...visData.dateColumns,
        ...visData.unknownColumns,
      ],
    };
  }
  if (stage === 'after') {
    const transformed = pipelineResult?.series.find((s) => s.refId === refId);
    return transformed ? toTable(transformed.rows, transformed.fieldSchema) : undefined;
  }
  const own = series.find((s) => s.refId === refId);
  return own ? toTable(own.rows, own.fieldSchema) : undefined;
};
