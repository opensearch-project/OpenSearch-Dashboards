/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFormRow, EuiSuperSelect, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { PromQLResourceQuery } from '../../../../../variables/types';

/** Dropdown value for the free-text option, which has no `PromQLResourceQuery`. */
export const PROMQL_FREE_TEXT_OPTION = 'queryResult';

type PromqlQueryTypeOptionValue = PromQLResourceQuery['kind'] | typeof PROMQL_FREE_TEXT_OPTION;

interface PromqlQueryTypeOption {
  value: PromqlQueryTypeOptionValue;
  label: string;
  description: string;
}

const PROMQL_QUERY_TYPE_OPTION_DATA: PromqlQueryTypeOption[] = [
  {
    value: 'labelNames',
    label: i18n.translate('dashboard.variableQueryPanel.promQLResourceQuery.labelNames', {
      defaultMessage: 'Label names',
    }),
    description: i18n.translate(
      'dashboard.variableQueryPanel.promQLResourceQuery.labelNames.description',
      {
        defaultMessage: 'Returns the label names present across all metrics, or a matching subset.',
      }
    ),
  },
  {
    value: 'labelValues',
    label: i18n.translate('dashboard.variableQueryPanel.promQLResourceQuery.labelValues', {
      defaultMessage: 'Label values',
    }),
    description: i18n.translate(
      'dashboard.variableQueryPanel.promQLResourceQuery.labelValues.description',
      {
        defaultMessage:
          'Returns the values seen for a chosen label, optionally scoped to one metric.',
      }
    ),
  },
  {
    value: 'metrics',
    label: i18n.translate('dashboard.variableQueryPanel.promQLResourceQuery.metrics', {
      defaultMessage: 'Metrics',
    }),
    description: i18n.translate(
      'dashboard.variableQueryPanel.promQLResourceQuery.metrics.description',
      {
        defaultMessage: 'Returns metric names, optionally filtered by a regex.',
      }
    ),
  },
  {
    value: 'series',
    label: i18n.translate('dashboard.variableQueryPanel.promQLResourceQuery.series', {
      defaultMessage: 'Series query',
    }),
    description: i18n.translate(
      'dashboard.variableQueryPanel.promQLResourceQuery.series.description',
      {
        defaultMessage: 'Returns every time series matching a Prometheus series selector.',
      }
    ),
  },
  {
    value: 'queryResult',
    label: i18n.translate('dashboard.variableQueryPanel.promQLResourceQuery.queryResult', {
      defaultMessage: 'Query result (PromQL)',
    }),
    description: i18n.translate(
      'dashboard.variableQueryPanel.promQLResourceQuery.queryResult.description',
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

/** The default shape of a single, unfilled Label filter row. */
export const DEFAULT_PROMQL_LABEL_FILTER_ROW = { label: '', operator: '=' as const, value: '' };

/**
 * Builds a default-shaped query type for a selected dropdown value. Returns
 * `undefined` for the free-text option, which has no structured query type.
 */
export function createDefaultResourceQuery(
  value: PromqlQueryTypeOptionValue
): PromQLResourceQuery | undefined {
  switch (value) {
    case 'labelNames':
      return { kind: 'labelNames' };
    case 'labelValues':
      return { kind: 'labelValues', label: '', matchers: [{ ...DEFAULT_PROMQL_LABEL_FILTER_ROW }] };
    case 'metrics':
      return { kind: 'metrics' };
    case 'series':
      return { kind: 'series', matcher: '' };
    default:
      return undefined;
  }
}

/** Ensures a `labelValues` query type has at least one Label filter row. */
export function ensureResourceQueryHasDefaultMatcherRow(
  queryType: PromQLResourceQuery | undefined
): PromQLResourceQuery | undefined {
  if (queryType?.kind !== 'labelValues' || (queryType.matchers && queryType.matchers.length > 0)) {
    return queryType;
  }
  return { ...queryType, matchers: [{ ...DEFAULT_PROMQL_LABEL_FILTER_ROW }] };
}

export interface PromqlQueryTypeSelectorProps {
  /** `undefined` selects the free-text option. */
  queryType: PromQLResourceQuery | undefined;
  onChange: (queryType: PromQLResourceQuery | undefined) => void;
}

/** Query type selector for PromQL variables. */
export const PromqlQueryTypeSelector: React.FC<PromqlQueryTypeSelectorProps> = ({
  queryType,
  onChange,
}) => (
  <EuiFormRow
    label={i18n.translate('dashboard.variableQueryPanel.promQLResourceQueryLabel', {
      defaultMessage: 'Query type',
    })}
    display="rowCompressed"
  >
    <EuiSuperSelect
      options={PROMQL_QUERY_TYPE_SUPER_SELECT_OPTIONS}
      valueOfSelected={queryType?.kind ?? PROMQL_FREE_TEXT_OPTION}
      onChange={(kind) => onChange(createDefaultResourceQuery(kind))}
      data-test-subj="variableEditorPromqlQueryType"
      compressed
    />
  </EuiFormRow>
);
