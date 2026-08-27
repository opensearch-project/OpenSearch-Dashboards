/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiFormRow,
  EuiFieldText,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiSuperSelect,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSmallButtonEmpty,
  EuiSmallButtonIcon,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { PromQLLabelMatcher, PromQLResourceQuery } from '../../../../../variables/types';
import '../variable_query_panel.scss';

const PROMQL_MATCHER_OPERATORS: Array<PromQLLabelMatcher['operator']> = ['=', '!=', '=~', '!~'];
const PROMQL_MATCHER_OPERATOR_OPTIONS = PROMQL_MATCHER_OPERATORS.map((operator) => ({
  value: operator,
  inputDisplay: operator,
}));

const toComboBoxOptions = (values: string[]): EuiComboBoxOptionOption[] =>
  values.map((value) => ({ label: value }));

/**
 * Build combobox options with dashboard variable references (${name}).
 */
const toComboBoxOptionsWithVariables = (
  values: string[],
  variableNames: string[]
): EuiComboBoxOptionOption[] => [
  ...variableNames.map((name) => ({ label: `\${${name}}` })),
  ...toComboBoxOptions(values),
];

export interface PromqlQueryTypeFormsProps {
  queryType: PromQLResourceQuery;
  onChange: (queryType: PromQLResourceQuery) => void;
  promqlLabelNameOptions: string[];
  promqlLabelNamesLoading: boolean;
  loadLabelNames: () => void;
  promqlMetricNameOptions: string[];
  promqlMetricNamesLoading: boolean;
  loadMetricNames: () => void;
  getMatcherValueOptions: (index: number) => string[];
  loadMatcherValues: (index: number) => void;
  isMatcherValueLoading: (index: number) => boolean;
  promqlMatchers: PromQLLabelMatcher[];
  addPromqlMatcher: () => void;
  updatePromqlMatcherAt: (index: number, patch: Partial<PromQLLabelMatcher>) => void;
  removePromqlMatcherAt: (index: number) => void;
  onOpenMetricsExplorer: () => void;
  /** Names of other dashboard variables, offered as `$name` references in Label/Metric/filter fields. */
  existingVariableNames?: string[];
}

export const PromqlQueryTypeForms: React.FC<PromqlQueryTypeFormsProps> = ({
  queryType,
  onChange,
  promqlLabelNameOptions,
  promqlLabelNamesLoading,
  loadLabelNames,
  promqlMetricNameOptions,
  promqlMetricNamesLoading,
  loadMetricNames,
  getMatcherValueOptions,
  loadMatcherValues,
  isMatcherValueLoading,
  promqlMatchers,
  addPromqlMatcher,
  updatePromqlMatcherAt,
  removePromqlMatcherAt,
  onOpenMetricsExplorer,
  existingVariableNames = [],
}) => {
  if (queryType.kind === 'labelNames') {
    return (
      <EuiFormRow
        label={i18n.translate('dashboard.variableQueryPanel.promqlMetricLabel', {
          defaultMessage: 'Metric regex',
        })}
        helpText={i18n.translate('dashboard.variableQueryPanel.promqlMetricHelp', {
          defaultMessage:
            'Returns label names across all metrics, or only metrics matching this regex ' +
            '(e.g. node_.* to match names starting with "node_"). Supports {var} references to other variables.',
          values: { var: '${varName}' },
        })}
      >
        <EuiFieldText
          placeholder={i18n.translate('dashboard.variableQueryPanel.promqlMetricRegexPlaceholder', {
            defaultMessage: 'Metric regex',
          })}
          value={queryType.metricRegex ?? ''}
          onChange={(e) =>
            onChange({ kind: 'labelNames', metricRegex: e.target.value || undefined })
          }
          data-test-subj="variableEditorPromqlLabelNamesMetric"
          compressed
        />
      </EuiFormRow>
    );
  }

  if (queryType.kind === 'labelValues') {
    return (
      <>
        <EuiFormRow
          label={i18n.translate('dashboard.variableQueryPanel.promqlLabelLabel', {
            defaultMessage: 'Label',
          })}
          helpText={i18n.translate('dashboard.variableQueryPanel.promqlLabelLabelHelp', {
            defaultMessage:
              'Returns values for this label across all metrics, or only the metric selected below if specified.',
          })}
        >
          <EuiComboBox
            placeholder={i18n.translate(
              'dashboard.variableQueryPanel.promqlSelectLabelPlaceholder',
              { defaultMessage: 'Select label...' }
            )}
            singleSelection={{ asPlainText: true }}
            isLoading={promqlLabelNamesLoading}
            onFocus={() => loadLabelNames()}
            options={toComboBoxOptionsWithVariables(promqlLabelNameOptions, existingVariableNames)}
            selectedOptions={queryType.label ? [{ label: queryType.label }] : []}
            onChange={(selected) => {
              const label = selected[0]?.label || '';
              onChange({ ...queryType, label });
            }}
            onCreateOption={(value) => {
              const label = value.trim();
              if (label) {
                onChange({ ...queryType, label });
              }
            }}
            data-test-subj="variableEditorPromqlLabelValuesLabel"
            compressed
          />
        </EuiFormRow>
        <EuiFormRow
          label={i18n.translate('dashboard.variableQueryPanel.promqlLabelValuesMetricLabel', {
            defaultMessage: 'Metric',
          })}
          helpText={i18n.translate('dashboard.variableQueryPanel.promqlLabelValuesMetricHelp', {
            defaultMessage: 'Optional — scope the returned label values to this exact metric name.',
          })}
        >
          <EuiFlexGroup gutterSize="xs" responsive={false} alignItems="center">
            <EuiFlexItem>
              <EuiComboBox
                placeholder={i18n.translate(
                  'dashboard.variableQueryPanel.promqlSelectMetricPlaceholder',
                  { defaultMessage: 'Select metric...' }
                )}
                singleSelection={{ asPlainText: true }}
                isLoading={promqlMetricNamesLoading}
                onFocus={() => loadMetricNames()}
                options={toComboBoxOptionsWithVariables(
                  promqlMetricNameOptions,
                  existingVariableNames
                )}
                selectedOptions={queryType.metric ? [{ label: queryType.metric }] : []}
                onChange={(selected) =>
                  onChange({ ...queryType, metric: selected[0]?.label || undefined })
                }
                onCreateOption={(value) =>
                  onChange({ ...queryType, metric: value.trim() || undefined })
                }
                data-test-subj="variableEditorPromqlLabelValuesMetric"
                compressed
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiSmallButtonIcon
                iconType="documentation"
                display="base"
                aria-label={i18n.translate(
                  'dashboard.variableQueryPanel.metricsExplorerButtonAriaLabel',
                  { defaultMessage: 'Open metrics explorer' }
                )}
                onClick={() => onOpenMetricsExplorer()}
                data-test-subj="variableEditorOpenMetricsExplorer-labelValues"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFormRow>
        <EuiFormRow
          label={i18n.translate('dashboard.variableQueryPanel.promqlLabelFiltersLabel', {
            defaultMessage: 'Label filters',
          })}
          helpText={i18n.translate('dashboard.variableQueryPanel.promqlLabelFiltersHelp', {
            defaultMessage:
              'Optional — further scope the returned values by matching on additional labels.',
          })}
          fullWidth
        >
          <div style={{ maxWidth: '60%' }}>
            <EuiFlexGroup direction="column" gutterSize="s">
              {promqlMatchers.map((matcher, index) => (
                <EuiFlexItem key={index}>
                  <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                    <EuiFlexItem>
                      <EuiComboBox
                        placeholder={i18n.translate(
                          'dashboard.variableQueryPanel.promqlSelectLabelPlaceholder',
                          { defaultMessage: 'Select label...' }
                        )}
                        singleSelection={{ asPlainText: true }}
                        isLoading={promqlLabelNamesLoading}
                        onFocus={() => loadLabelNames()}
                        options={toComboBoxOptionsWithVariables(
                          promqlLabelNameOptions,
                          existingVariableNames
                        )}
                        selectedOptions={matcher.label ? [{ label: matcher.label }] : []}
                        onChange={(selected) => {
                          const label = selected[0]?.label || '';
                          updatePromqlMatcherAt(
                            index,
                            label === matcher.label ? { label } : { label, value: '' }
                          );
                        }}
                        onCreateOption={(value) => {
                          const label = value.trim();
                          if (label) {
                            updatePromqlMatcherAt(
                              index,
                              label === matcher.label ? { label } : { label, value: '' }
                            );
                          }
                        }}
                        data-test-subj={`variableEditorPromqlMatcherLabel-${index}`}
                        compressed
                        fullWidth
                      />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiSuperSelect
                        options={PROMQL_MATCHER_OPERATOR_OPTIONS}
                        valueOfSelected={matcher.operator}
                        onChange={(operator) => updatePromqlMatcherAt(index, { operator })}
                        popoverClassName="variablePromqlOperatorPopover"
                        data-test-subj={`variableEditorPromqlMatcherOperator-${index}`}
                        compressed
                        fullWidth
                      />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiComboBox
                        placeholder={i18n.translate(
                          'dashboard.variableQueryPanel.promqlSelectValuePlaceholder',
                          { defaultMessage: 'Select value...' }
                        )}
                        singleSelection={{ asPlainText: true }}
                        isLoading={isMatcherValueLoading(index)}
                        onFocus={() => loadMatcherValues(index)}
                        options={toComboBoxOptionsWithVariables(
                          getMatcherValueOptions(index),
                          existingVariableNames
                        )}
                        selectedOptions={matcher.value ? [{ label: matcher.value }] : []}
                        onChange={(selected) =>
                          updatePromqlMatcherAt(index, { value: selected[0]?.label || '' })
                        }
                        onCreateOption={(value) =>
                          updatePromqlMatcherAt(index, { value: value.trim() })
                        }
                        data-test-subj={`variableEditorPromqlMatcherValue-${index}`}
                        compressed
                        fullWidth
                      />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiSmallButtonIcon
                        iconType="trash"
                        color="danger"
                        aria-label={i18n.translate(
                          'dashboard.variableQueryPanel.promqlRemoveMatcherAriaLabel',
                          { defaultMessage: 'Remove label filter' }
                        )}
                        onClick={() => removePromqlMatcherAt(index)}
                        data-test-subj={`variableEditorPromqlRemoveMatcher-${index}`}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              ))}
              <EuiFlexItem grow={false}>
                <EuiSmallButtonEmpty
                  iconType="plusInCircle"
                  onClick={addPromqlMatcher}
                  data-test-subj="variableEditorPromqlAddMatcher"
                >
                  {i18n.translate('dashboard.variableQueryPanel.promqlAddLabelFilter', {
                    defaultMessage: 'Add label filter',
                  })}
                </EuiSmallButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        </EuiFormRow>
      </>
    );
  }

  if (queryType.kind === 'metrics') {
    return (
      <EuiFormRow
        label={i18n.translate('dashboard.variableQueryPanel.promqlMetricRegexLabel', {
          defaultMessage: 'Metric regex',
        })}
        helpText={i18n.translate('dashboard.variableQueryPanel.promqlMetricRegexHelp', {
          defaultMessage:
            'Returns all metric names, or only names matching this regex ' +
            '(e.g. node_.* to match names starting with "node_"). Supports {var} references to other variables.',
          values: { var: '${varName}' },
        })}
      >
        <EuiFieldText
          value={queryType.metricRegex ?? ''}
          onChange={(e) => onChange({ kind: 'metrics', metricRegex: e.target.value || undefined })}
          placeholder="Metric regex"
          data-test-subj="variableEditorPromqlMetricsRegex"
          compressed
        />
      </EuiFormRow>
    );
  }

  if (queryType.kind === 'series') {
    return (
      <EuiFormRow
        label={i18n.translate('dashboard.variableQueryPanel.promqlMatcherLabel', {
          defaultMessage: 'Series Query',
        })}
        helpText={i18n.translate('dashboard.variableQueryPanel.promqlMatcherHelp', {
          defaultMessage:
            'A Prometheus series selector — returns every time series matching it. Examples: {example}. ' +
            'Supports {var} references to other variables.',
          values: {
            example: 'go_info{app="prometheus"}, go_info, {app="prometheus"}',
            var: '${varName}',
          },
        })}
        fullWidth
      >
        <EuiFieldText
          value={queryType.matcher}
          onChange={(e) => onChange({ kind: 'series', matcher: e.target.value })}
          placeholder="Series Query"
          data-test-subj="variableEditorPromqlSeriesMatcher"
          fullWidth
          compressed
        />
      </EuiFormRow>
    );
  }

  return null;
};
