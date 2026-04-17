/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiSpacer,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { PrometheusClient } from '../explore/services/prometheus_client';
import { BuilderAction } from './build_promql';
import { LabelFilter } from './promql_parser';

interface LabelBadgesProps {
  metric: string;
  labelCardinality: Record<string, number>;
  labelFilters: LabelFilter[];
  client: PrometheusClient;
  dispatch: React.Dispatch<BuilderAction>;
}

const QUICK_AGGS = [
  {
    id: 'sum',
    label: i18n.translate('explore.promqlBuilder.sumBy', { defaultMessage: 'Sum by' }),
  },
  {
    id: 'count',
    label: i18n.translate('explore.promqlBuilder.countBy', { defaultMessage: 'Count by' }),
  },
  {
    id: 'avg',
    label: i18n.translate('explore.promqlBuilder.avgBy', { defaultMessage: 'Avg by' }),
  },
  {
    id: 'max',
    label: i18n.translate('explore.promqlBuilder.maxBy', { defaultMessage: 'Max by' }),
  },
];

const MAX_VISIBLE = 3;

export const LabelBadges: React.FC<LabelBadgesProps> = ({
  metric,
  labelCardinality,
  labelFilters,
  client,
  dispatch,
}) => {
  const [labelPopover, setLabelPopover] = useState<string | null>(null);
  const [labelPopoverValues, setLabelPopoverValues] = useState<string[]>([]);
  const [labelsExpanded, setLabelsExpanded] = useState(false);

  const onLabelBadgeClick = useCallback(
    (labelName: string) => {
      setLabelPopover(labelName);
      client
        .getLabelValues(labelName, metric)
        .then((values) => setLabelPopoverValues(values))
        .catch(() => setLabelPopoverValues([]));
    },
    [client, metric]
  );

  const addAggregationByLabel = useCallback(
    (aggId: string, aggName: string, labelName: string) => {
      dispatch({
        type: 'ADD_OPERATION',
        operation: {
          id: aggId,
          name: aggName,
          params: [],
          grouping:
            aggId === 'group'
              ? { mode: 'without', labels: [labelName] }
              : { mode: 'by', labels: [labelName] },
        },
      });
      setLabelPopover(null);
    },
    [dispatch]
  );

  if (!metric || Object.keys(labelCardinality).length === 0) return null;

  const labels = Object.entries(labelCardinality);
  const visible = labelsExpanded ? labels : labels.slice(0, MAX_VISIBLE);
  const overflow = labels.length - MAX_VISIBLE;

  return (
    <>
      {visible.map(([label, count]) => (
        <EuiFlexItem grow={false} key={label}>
          <EuiPopover
            button={
              <EuiBadge
                color="hollow"
                onClick={() => onLabelBadgeClick(label)}
                onClickAriaLabel={i18n.translate('explore.promqlBuilder.showLabelValues', {
                  defaultMessage: 'Show values for {label}',
                  values: { label },
                })}
              >
                {label} ({count})
              </EuiBadge>
            }
            isOpen={labelPopover === label}
            closePopover={() => setLabelPopover(null)}
            panelPaddingSize="s"
            anchorPosition="downCenter"
          >
            <div className="pqbLabelPopover">
              <EuiText size="s">
                <strong>{label}</strong>
              </EuiText>
              <EuiSpacer size="xs" />
              <div className="pqbLabelPopoverValues">
                {labelPopoverValues.map((v) => (
                  <div key={v} className="pqbLabelValueRow">
                    <EuiText size="xs">{v}</EuiText>
                    <EuiButtonIcon
                      iconType="plusInCircle"
                      size="s"
                      aria-label={i18n.translate('explore.promqlBuilder.addLabelValueFilter', {
                        defaultMessage: 'Add {label}={value} filter',
                        values: { label, value: v },
                      })}
                      onClick={() => {
                        dispatch({ type: 'ADD_LABEL_FILTER' });
                        const filterIdx = labelFilters.length;
                        setTimeout(() => {
                          dispatch({
                            type: 'SET_LABEL_FILTER',
                            index: filterIdx,
                            filter: { label, value: v },
                          });
                        }, 0);
                        setLabelPopover(null);
                      }}
                    />
                  </div>
                ))}
              </div>
              <EuiSpacer size="xs" />
              <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
                {QUICK_AGGS.map((agg) => (
                  <EuiFlexItem grow={false} key={agg.id}>
                    <EuiButtonEmpty
                      size="xs"
                      iconType="tableDensityNormal"
                      onClick={() => addAggregationByLabel(agg.id, agg.id, label)}
                    >
                      {agg.label}
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
              <EuiSpacer size="xs" />
              <EuiButtonEmpty
                size="xs"
                iconType="cross"
                onClick={() => addAggregationByLabel('group', 'group', label)}
              >
                {i18n.translate('explore.promqlBuilder.groupWithout', {
                  defaultMessage: 'Group without',
                })}
              </EuiButtonEmpty>
            </div>
          </EuiPopover>
        </EuiFlexItem>
      ))}
      {overflow > 0 && !labelsExpanded && (
        <EuiFlexItem grow={false}>
          <EuiToolTip
            content={labels
              .slice(MAX_VISIBLE)
              .map(([l]) => l)
              .join(', ')}
          >
            <EuiBadge
              color="hollow"
              onClick={() => setLabelsExpanded(true)}
              onClickAriaLabel={i18n.translate('explore.promqlBuilder.showMoreLabels', {
                defaultMessage: 'Show {overflow} more labels',
                values: { overflow },
              })}
            >
              (+{overflow})
            </EuiBadge>
          </EuiToolTip>
        </EuiFlexItem>
      )}
      {labelsExpanded && overflow > 0 && (
        <EuiFlexItem grow={false}>
          <EuiBadge
            color="hollow"
            iconType="minimize"
            iconSide="right"
            onClick={() => setLabelsExpanded(false)}
            onClickAriaLabel={i18n.translate('explore.promqlBuilder.collapseLabels', {
              defaultMessage: 'Collapse labels',
            })}
          />
        </EuiFlexItem>
      )}
    </>
  );
};
