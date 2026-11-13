/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { v4 as uuidv4 } from 'uuid';
import { EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  MultiSeriesTransformationInstance,
  SeriesExecutionResult,
  TransformationConfigSchema,
  TransformationDefinition,
} from '../types';
// import type { SeriesResult } from '../../../application/in_context_vis_editor/multi_query_builder/utils';
import type { SeriesResult } from '../../../application/in_context_vis_editor/multi_query_builder/types';
import { mergeSeries } from '../merge_series';

// No settings: every query's series is merged.
type MergeSeriesConfig = Record<string, never>;

const MergeSeriesEditor = () => (
  <EuiText size="s" color="subdued" data-test-subj="mergeSeriesTransformationHelp">
    {i18n.translate('explore.transformations.mergeSeries.help', {
      defaultMessage: 'Merge series will be applied automatically to your data.',
    })}
  </EuiText>
);

/**
 * Merges every query's series into one here, instead of at the pipeline's end. With one series
 * there's nothing to merge: the step is skipped, without an issue.
 */
export const mergeSeriesMethod = (series: SeriesResult[]): SeriesExecutionResult => {
  if (series.length <= 1) {
    return { series, status: 'skipped', issues: [] };
  }
  // mergeSeries also returns its queryField; the series keeps only the series fields.
  const { refId, rows, fieldSchema, seriesDisplayNames } = mergeSeries(series);
  return {
    series: [{ refId, rows, fieldSchema, seriesDisplayNames }],
    status: 'applied',
    issues: [],
  };
};

export function createMergeSeriesTransformation(): MultiSeriesTransformationInstance<MergeSeriesConfig> {
  return {
    instance_id: uuidv4(),
    definition_id: 'merge_series',
    config: {},
    hide: false,
    seriesMethod: mergeSeriesMethod,
    Editor: MergeSeriesEditor,
  };
}

export const mergeSeriesTransformationDefinition: TransformationDefinition<MergeSeriesConfig> = {
  id: 'merge_series',
  type: 'combine',
  label: i18n.translate('explore.transformations.mergeSeries.label', {
    defaultMessage: 'Merge series',
  }),
  description: i18n.translate('explore.transformations.mergeSeries.description', {
    defaultMessage:
      "Merge every query's result into one series here, with a Query column naming each row's query.",
  }),
  iconType: 'merge',
  createInstance: createMergeSeriesTransformation,
};

export const mergeSeriesConfigSchema: TransformationConfigSchema = {};
