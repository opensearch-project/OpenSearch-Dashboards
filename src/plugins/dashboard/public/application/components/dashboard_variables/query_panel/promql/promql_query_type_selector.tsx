/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFormRow, EuiSuperSelect, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { PromQLVariableQueryType } from '../../../../../variables/types';

interface PromqlQueryTypeOption {
  value: PromQLVariableQueryType['kind'];
  label: string;
  description: string;
}

const PROMQL_QUERY_TYPE_OPTION_DATA: PromqlQueryTypeOption[] = [
  {
    value: 'labelNames',
    label: i18n.translate('dashboard.variableQueryPanel.promqlQueryType.labelNames', {
      defaultMessage: 'Label names',
    }),
    description: i18n.translate(
      'dashboard.variableQueryPanel.promqlQueryType.labelNames.description',
      {
        defaultMessage: 'Returns the label names present across all metrics, or a matching subset.',
      }
    ),
  },
  {
    value: 'labelValues',
    label: i18n.translate('dashboard.variableQueryPanel.promqlQueryType.labelValues', {
      defaultMessage: 'Label values',
    }),
    description: i18n.translate(
      'dashboard.variableQueryPanel.promqlQueryType.labelValues.description',
      {
        defaultMessage:
          'Returns the values seen for a chosen label, optionally scoped to one metric.',
      }
    ),
  },
  {
    value: 'metrics',
    label: i18n.translate('dashboard.variableQueryPanel.promqlQueryType.metrics', {
      defaultMessage: 'Metrics',
    }),
    description: i18n.translate(
      'dashboard.variableQueryPanel.promqlQueryType.metrics.description',
      {
        defaultMessage: 'Returns metric names, optionally filtered by a regex.',
      }
    ),
  },
  {
    value: 'series',
    label: i18n.translate('dashboard.variableQueryPanel.promqlQueryType.series', {
      defaultMessage: 'Series query',
    }),
    description: i18n.translate('dashboard.variableQueryPanel.promqlQueryType.series.description', {
      defaultMessage: 'Returns every time series matching a Prometheus series selector.',
    }),
  },
  {
    value: 'queryResult',
    label: i18n.translate('dashboard.variableQueryPanel.promqlQueryType.queryResult', {
      defaultMessage: 'Query result (PromQL)',
    }),
    description: i18n.translate(
      'dashboard.variableQueryPanel.promqlQueryType.queryResult.description',
      {
        defaultMessage: 'Runs a full PromQL expression and extracts values from the result.',
      }
    ),
  },
];

export const PROMQL_QUERY_TYPE_SUPER_SELECT_OPTIONS = PROMQL_QUERY_TYPE_OPTION_DATA.map(
  ({ value, label, description }) => ({
    value,
    inputDisplay: label,
    dropdownDisplay: (
      <>
        <strong>{label}</strong>
        <EuiText size="s" color="subdued">
          <p className="ouiTextColor--subdued">{description}</p>
        </EuiText>
      </>
    ),
  })
);

/** Build a default-shaped query type object for a given selected kind. */
export function createDefaultPromqlQueryType(
  kind: PromQLVariableQueryType['kind']
): PromQLVariableQueryType {
  switch (kind) {
    case 'labelNames':
      return { kind: 'labelNames' };
    case 'labelValues':
      return { kind: 'labelValues', label: '' };
    case 'metrics':
      return { kind: 'metrics' };
    case 'series':
      return { kind: 'series', matcher: '' };
    case 'queryResult':
    default:
      return { kind: 'queryResult' };
  }
}

export interface PromqlQueryTypeSelectorProps {
  queryType: PromQLVariableQueryType;
  onChange: (queryType: PromQLVariableQueryType) => void;
}

/**
 * Query Type selector for PromQL variables
 */
export const PromqlQueryTypeSelector: React.FC<PromqlQueryTypeSelectorProps> = ({
  queryType,
  onChange,
}) => (
  <EuiFormRow
    label={i18n.translate('dashboard.variableQueryPanel.promqlQueryTypeLabel', {
      defaultMessage: 'Query type',
    })}
    display="rowCompressed"
  >
    <EuiSuperSelect
      options={PROMQL_QUERY_TYPE_SUPER_SELECT_OPTIONS}
      valueOfSelected={queryType.kind}
      onChange={(kind) => onChange(createDefaultPromqlQueryType(kind))}
      data-test-subj="variableEditorPromqlQueryType"
      compressed
    />
  </EuiFormRow>
);
