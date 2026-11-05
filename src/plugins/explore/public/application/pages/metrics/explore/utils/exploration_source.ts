/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { ExploreFlavor } from '../../../../../../common';
import { getSourceTypeRegistry } from '../../../../../services/source_type_registry';
import type { ExplorationSource } from '../contexts/exploration_context';

/**
 * How the Metrics page names and introduces a dataset's source type when it has nothing to show:
 * its name as the source picker shows it, its advice for an empty result, and its PromQL samples
 * (the metric browser and its charts run PromQL whatever language the editor is on).
 */
export const getExplorationSource = (dataset?: { type?: string }): ExplorationSource => {
  const registry = getSourceTypeRegistry();
  const sourceType = registry.getForDataset(dataset);
  const promqlGuide = registry.getLanguageGuide('PROMQL', dataset);
  return {
    label: registry.getLabel(sourceType, ExploreFlavor.Metrics),
    emptyHint: sourceType.metricsEmptyHint,
    sampleQueries: promqlGuide.sampleQueries ?? [],
    codeLanguage: promqlGuide.codeLanguage,
  };
};

/** "No metrics found" text: a sentence naming the source, then the source's advice. */
export const getNoMetricsBody = (source?: ExplorationSource): string => {
  const sourceLabel = source?.label?.trim();
  const hint =
    source?.emptyHint?.trim() ||
    i18n.translate('explore.metricsExplore.emptyHint', {
      defaultMessage: 'Try adjusting the time range.',
    });
  return sourceLabel
    ? i18n.translate('explore.metricsExplore.emptyBodyWithSource', {
        defaultMessage:
          'The selected {sourceLabel} data source returned no metrics for the current time range. {hint}',
        values: { sourceLabel, hint },
      })
    : i18n.translate('explore.metricsExplore.emptyBodyGeneric', {
        defaultMessage:
          'The selected data source returned no metrics for the current time range. {hint}',
        values: { hint },
      });
};
