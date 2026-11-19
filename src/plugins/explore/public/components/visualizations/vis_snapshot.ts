/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChartConfig } from './visualization_builder.types';
import { UrlTransformationState } from '../data_transformations/types';
import { normalizeMapping } from './visualization_builder_utils';

export type VisSnapshot = Record<string, unknown>;

// Drops undefined values (and keys), so a missing field and an undefined one compare equal.
const dropUndefined = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const toVisSnapshot = ({
  config,
  dataTransformations,
}: {
  config?: ChartConfig;
  dataTransformations?: UrlTransformationState[];
}): VisSnapshot =>
  dropUndefined({
    title: config?.title || undefined,
    description: config?.description || undefined,
    params: config?.styles,
    splitField: config?.splitField,
    splitLayout: config?.splitLayout,
    showSplitLabel: config?.showSplitLabel,
    chartType: config?.type,
    // A single field and a one-item multi-field list are the same mapping.
    axesMapping: normalizeMapping(config?.axesMapping),
    dataTransformations: dataTransformations?.length ? dataTransformations : undefined,
  });
