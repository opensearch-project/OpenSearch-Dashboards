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
  onAdd: (fn: AggFn) => void;
  hasMetrics?: boolean;
  dataTestSubj?: string;
}

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
        dataTestSubj: `pplBuilderAddAggregationOption-${agg.id}`,
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
