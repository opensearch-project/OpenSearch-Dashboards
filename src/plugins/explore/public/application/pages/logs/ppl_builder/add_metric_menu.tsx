/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { AggFn } from './types';
import { AGG_FUNCTIONS } from './operations';
import { CategoryFunctionMenu } from '../../../components/query_builder';

interface AddMetricMenuProps {
  /** Called with the chosen aggregation when the user adds a metric. */
  onAdd: (fn: AggFn) => void;
  /**
   * Whether any metric already exists. When false the affordance shows its text
   * label ("＋ Add aggregation") since the row is sparse and labels teach; once a
   * metric exists it collapses to an icon-only dashed ＋ to keep the row dense.
   */
  hasMetrics?: boolean;
  dataTestSubj?: string;
}

/**
 * "Add aggregation" affordance: opens a popover of aggregations and appends a new
 * metric using the chosen one. This is the single place a metric is *created*
 * (and its aggregation picked); the aggregation stays editable afterward via the
 * row's "Show" dropdown, and scalar functions via its `ƒx` menu. Renders as a
 * labelled dashed button when the row is empty (labels teach) and collapses to an
 * icon-only dashed ＋ once a metric exists (icons keep the populated row dense).
 */
export const AddMetricMenu: React.FC<AddMetricMenuProps> = ({
  onAdd,
  hasMetrics,
  dataTestSubj,
}) => {
  const addMetricLabel = i18n.translate('explore.pplBuilder.addMetric', {
    defaultMessage: 'Add aggregation',
  });

  const rootItems = useMemo(
    () =>
      AGG_FUNCTIONS.map((agg) => ({
        name: agg.label,
        description: agg.description,
        onClick: () => onAdd(agg.id),
      })),
    [onAdd]
  );

  return (
    <CategoryFunctionMenu
      categories={[]}
      onSelect={() => {}}
      extraRootItems={rootItems}
      trigger={
        hasMetrics
          ? {
              kind: 'icon',
              iconType: 'plus',
              className: 'plqIconBtn plqIconBtn--ghost',
              color: 'text',
              ariaLabel: addMetricLabel,
            }
          : { kind: 'empty', label: addMetricLabel, iconType: 'plus', className: 'plqGhostAdd' }
      }
      rootTitle={i18n.translate('explore.pplBuilder.addMetricTitle', {
        defaultMessage: 'Select aggregation',
      })}
      anchorPosition="downLeft"
      panelClassName="cfmMenuPanel"
      dataTestSubj={dataTestSubj}
    />
  );
};
