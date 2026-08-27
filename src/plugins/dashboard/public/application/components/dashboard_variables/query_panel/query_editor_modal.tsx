/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
  EuiText,
  EuiSpacer,
  EuiPanel,
  EuiFormRow,
  EuiFieldText,
  EuiComboBox,
  EuiHorizontalRule,
  EuiResizableContainer,
  EuiCallOut,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DashboardServices } from '../../../../types';
import { IVariableInterpolationService } from '../../../../variables/variable_interpolation_service';
import { NormalizedVariableOption, PromQLResourceQuery } from '../../../../variables/types';
import { LanguageToggle } from './language_toggle';
import { DatasetSelectWidget } from './dataset_select_widget';
import { MetricsExplorerModal } from './promql/metrics_explorer_modal';
import {
  PromqlQueryTypeSelector,
  DEFAULT_PROMQL_LABEL_FILTER_ROW,
  ensureResourceQueryHasDefaultMatcherRow,
} from './promql/promql_query_type_selector';
import { PromqlQueryTypeForms } from './promql/promql_query_type_forms';
import { usePromqlDropdownData } from './promql/use_promql_dropdown_data';
import { useVariableQueryPreview } from './use_variable_query_preview';
import { VariableQueryCodeEditor } from './variable_query_code_editor';
import { Dataset } from '../../../../../../data/common';

const getPreviewOptionDisplayText = (option: NormalizedVariableOption): string =>
  option.label ? `${option.label} (${option.value})` : option.value;

// Build EuiComboBox options from the query's available fields, always including the
// currently-selected field even if it isn't among the loaded fields yet.
const buildFieldOptions = (
  availableFields: string[],
  selected: string
): Array<{ label: string }> => {
  const fields = new Set(availableFields);
  if (selected) fields.add(selected);
  return Array.from(fields).map((field) => ({ label: field }));
};

export interface QueryEditorModalApplyResult {
  query: string;
  language: string;
  dataset: Dataset | undefined;
  valueField: string;
  labelField: string;
  regex: string;
  promQLResourceQuery: PromQLResourceQuery | undefined;
}

export interface QueryEditorModalProps {
  query: string;
  language: string;
  dataset: Dataset | undefined;
  existingVariableNames?: string[];
  interpolationService?: IVariableInterpolationService;
  regex?: string;
  useTimeFilter?: boolean;
  valueField?: string;
  labelField?: string;
  currentVariableName?: string;
  promQLResourceQuery: PromQLResourceQuery | undefined;
  /** Called when the user applies the changes made inside the modal. */
  onApply: (result: QueryEditorModalApplyResult) => void;
  /** Called when the user discards changes made inside the modal. */
  onDiscard: () => void;
}

export const QueryEditorModal: React.FC<QueryEditorModalProps> = ({
  query: initialQuery,
  language: initialLanguage,
  dataset: initialDataset,
  existingVariableNames = [],
  interpolationService,
  regex: initialRegex = '',
  useTimeFilter = false,
  valueField: initialValueField = '',
  labelField: initialLabelField = '',
  currentVariableName,
  promQLResourceQuery: initialResourceQuery,
  onApply,
  onDiscard,
}) => {
  const { services } = useOpenSearchDashboards<DashboardServices>();
  const { data } = services;

  // Local draft state — only committed to the parent on "Apply".
  const [query, setQuery] = useState(initialQuery);
  const [language, setLanguage] = useState(initialLanguage);
  const [dataset, setDataset] = useState(initialDataset);
  const [regex, setRegex] = useState(initialRegex);
  const [valueField, setValueField] = useState(initialValueField);
  const [labelField, setLabelField] = useState(initialLabelField);
  const [promQLResourceQuery, setResourceQueryState] = useState(
    ensureResourceQueryHasDefaultMatcherRow(initialResourceQuery)
  );

  const [applyError, setApplyError] = useState<string | null>(null);

  const isPromqlLanguage = language.toUpperCase() === 'PROMQL';
  const isPrometheusResource = isPromqlLanguage && promQLResourceQuery !== undefined;

  const [isMetricsExplorerOpen, setIsMetricsExplorerOpen] = useState(false);

  const resetFreeTextFields = useCallback((opts: { query?: boolean; regex?: boolean } = {}) => {
    setValueField('');
    setLabelField('');
    if (opts.query) setQuery('');
    if (opts.regex) setRegex('');
  }, []);

  // Switching the query TYPE (via the selector) resets the free-text query-result fields.
  const handleResourceQuerySelect = useCallback(
    (next: PromQLResourceQuery | undefined) => {
      resetFreeTextFields({ query: true });
      setResourceQueryState(next);
    },
    [resetFreeTextFields]
  );

  // When language changes between PPL and PROMQL, clear the dataset since
  // dataset types are incompatible (INDEX/INDEX_PATTERN vs PROMETHEUS).
  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      const wasPromQL = language.toUpperCase() === 'PROMQL';
      const isPromQL = newLanguage.toUpperCase() === 'PROMQL';
      if (wasPromQL !== isPromQL) {
        setDataset(undefined);
        setQuery('');
        setResourceQueryState(undefined);
      }
      resetFreeTextFields({ regex: true });
      setLanguage(newLanguage);
    },
    [language, resetFreeTextFields]
  );

  const handleDatasetChange = useCallback(
    (newDataset: Dataset | undefined) => {
      resetFreeTextFields({ query: true, regex: true });
      setResourceQueryState((prev) => {
        switch (prev?.kind) {
          case 'labelNames':
          case 'metrics':
            return { kind: prev.kind, metricRegex: undefined };
          case 'labelValues':
            return {
              kind: 'labelValues',
              label: '',
              metric: undefined,
              matchers: [{ ...DEFAULT_PROMQL_LABEL_FILTER_ROW }],
            };
          case 'series':
            return { kind: 'series', matcher: '' };
          default:
            return prev;
        }
      });
      setDataset(newDataset);
    },
    [resetFreeTextFields]
  );

  const {
    promqlLabelNameOptions,
    promqlMetricNameOptions,
    promqlMatcherValueOptions,
    promqlMatchers,
    addPromqlMatcher,
    updatePromqlMatcherAt,
    removePromqlMatcherAt,
  } = usePromqlDropdownData({
    data,
    dataset,
    useTimeFilter,
    isPrometheusResource,
    promQLResourceQuery,
    onResourceQueryChange: setResourceQueryState,
  });

  const {
    isLoading,
    availableFields,
    filteredPreviewOptions,
    previewOptions,
    isTruncated,
    previewError,
    canApply,
    selectedValueField,
    handleRunFreeTextQuery,
    handleRunResourceQuery,
  } = useVariableQueryPreview({
    data,
    query,
    language,
    dataset,
    useTimeFilter,
    valueField,
    labelField,
    regex,
    interpolationService,
    currentVariableName,
    isPrometheusResource,
    promQLResourceQuery,
  });

  // Clear the "must preview" error as soon as the preview becomes valid.
  useEffect(() => {
    if (canApply) {
      setApplyError(null);
    }
  }, [canApply]);

  // Auto-run Preview once when the modal opens with a pre-existing
  useEffect(() => {
    const hasExistingFreeTextQuery = !isPrometheusResource && initialQuery.trim() && initialDataset;
    const hasExistingResourceQuery = isPrometheusResource && initialDataset;
    if (hasExistingFreeTextQuery) {
      handleRunFreeTextQuery();
    } else if (hasExistingResourceQuery) {
      handleRunResourceQuery();
    }
    // Intentionally run only once, on mount — this mirrors the pre-refactor
    // auto-preview behavior and must not re-fire on every draft edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const valueFieldOptions = useMemo(
    () => buildFieldOptions(availableFields, valueField),
    [availableFields, valueField]
  );

  const labelFieldOptions = useMemo(
    () => buildFieldOptions(availableFields, labelField),
    [availableFields, labelField]
  );

  const handleApply = useCallback(() => {
    if (!canApply) {
      setApplyError(
        i18n.translate('dashboard.variableQueryPanel.previewRequired', {
          defaultMessage: 'You must preview the query successfully before applying',
        })
      );
      return;
    }
    setApplyError(null);

    const resourceQueryToApply =
      promQLResourceQuery?.kind === 'labelValues' && promQLResourceQuery.matchers
        ? {
            ...promQLResourceQuery,
            matchers: promQLResourceQuery.matchers.filter(
              (matcher) => matcher.label.trim() || matcher.value.trim()
            ),
          }
        : promQLResourceQuery;
    onApply({
      query: isPrometheusResource ? '' : query,
      language,
      dataset,
      valueField: isPrometheusResource ? '' : (selectedValueField ?? ''),
      labelField: isPrometheusResource ? '' : labelField,
      regex,
      promQLResourceQuery: resourceQueryToApply,
    });
  }, [
    canApply,
    onApply,
    query,
    language,
    dataset,
    selectedValueField,
    labelField,
    regex,
    promQLResourceQuery,
    isPrometheusResource,
  ]);

  return (
    <EuiModal onClose={onDiscard} maxWidth={false} data-test-subj="queryEditorModal">
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {i18n.translate('dashboard.variableQueryPanel.queryEditorModalTitle', {
            defaultMessage: 'Query variable',
          })}
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody
        style={{
          width: '80vw',
          height: '85vh',
        }}
      >
        {applyError && (
          <>
            <EuiCallOut
              title={applyError}
              color="danger"
              iconType="alert"
              size="s"
              data-test-subj="queryEditorModalApplyError"
            />
            <EuiSpacer size="s" />
          </>
        )}
        <EuiResizableContainer direction="vertical" style={{ height: '100%' }}>
          {(EuiResizablePanel, EuiResizableButton) => (
            <>
              <EuiResizablePanel
                initialSize={15}
                minSize="15%"
                paddingSize="none"
                data-test-subj="queryEditorModalPreviewPanel"
              >
                {/* Preview pinned at the top so it never gets pushed out of view by a long form. */}
                <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false}>
                  <EuiFlexItem>
                    <EuiText size="s">
                      <strong>
                        {isTruncated
                          ? i18n.translate('dashboard.variableQueryPanel.previewTitleTruncated', {
                              defaultMessage: 'Preview of values ({count}, showing first {max})',
                              values: { count: filteredPreviewOptions.length, max: 100 },
                            })
                          : i18n.translate('dashboard.variableQueryPanel.previewTitle', {
                              defaultMessage: 'Preview of values ({count})',
                              values: { count: filteredPreviewOptions.length },
                            })}
                      </strong>
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiSmallButtonEmpty
                      onClick={
                        isPrometheusResource ? handleRunResourceQuery : handleRunFreeTextQuery
                      }
                      data-test-subj="queryEditorModalRunQuery"
                      isLoading={isLoading}
                    >
                      {i18n.translate('dashboard.variableQueryPanel.runQuery', {
                        defaultMessage: 'Preview',
                      })}
                    </EuiSmallButtonEmpty>
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer size="s" />
                <EuiPanel
                  paddingSize="s"
                  color="subdued"
                  hasBorder={false}
                  style={{ height: 'calc(100% - 40px)', overflowY: 'auto' }}
                >
                  {previewError ? (
                    <EuiText size="xs" color="danger">
                      {previewError}
                    </EuiText>
                  ) : previewOptions.length > 0 ? (
                    <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
                      {previewOptions.map((option) => (
                        <EuiFlexItem key={option.value} grow={false}>
                          <EuiBadge color="hollow">{getPreviewOptionDisplayText(option)}</EuiBadge>
                        </EuiFlexItem>
                      ))}
                    </EuiFlexGroup>
                  ) : (
                    <EuiText size="xs" color="subdued">
                      {i18n.translate('dashboard.variableQueryPanel.previewEmpty', {
                        defaultMessage: 'No values yet — run Preview to see results.',
                      })}
                    </EuiText>
                  )}
                </EuiPanel>
              </EuiResizablePanel>

              <EuiResizableButton data-test-subj="queryEditorModalResizeHandle" />

              <EuiResizablePanel
                initialSize={85}
                minSize="200px"
                paddingSize="none"
                scrollable
                data-test-subj="queryEditorModalFormPanel"
              >
                <EuiSpacer size="m" />
                {/* Language + dataset picker */}
                <EuiFlexGroup gutterSize="none" alignItems="center">
                  <EuiFlexItem grow={false}>
                    <LanguageToggle language={language} onLanguageChange={handleLanguageChange} />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <DatasetSelectWidget
                      selectedDataset={dataset}
                      onDatasetChange={handleDatasetChange}
                      language={language}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>

                <EuiSpacer size="m" />

                {isPromqlLanguage && (
                  <>
                    <PromqlQueryTypeSelector
                      queryType={promQLResourceQuery}
                      onChange={handleResourceQuerySelect}
                    />
                    <EuiSpacer size="m" />
                  </>
                )}

                {isPromqlLanguage && promQLResourceQuery && (
                  <PromqlQueryTypeForms
                    queryType={promQLResourceQuery}
                    onChange={setResourceQueryState}
                    promqlLabelNameOptions={promqlLabelNameOptions}
                    promqlMetricNameOptions={promqlMetricNameOptions}
                    promqlMatcherValueOptions={promqlMatcherValueOptions}
                    promqlMatchers={promqlMatchers}
                    addPromqlMatcher={addPromqlMatcher}
                    updatePromqlMatcherAt={updatePromqlMatcherAt}
                    removePromqlMatcherAt={removePromqlMatcherAt}
                    onOpenMetricsExplorer={() => setIsMetricsExplorerOpen(true)}
                    existingVariableNames={existingVariableNames}
                  />
                )}

                {!isPrometheusResource && (
                  <VariableQueryCodeEditor
                    language={language}
                    query={query}
                    onQueryChange={setQuery}
                    dataset={dataset}
                    existingVariableNames={existingVariableNames}
                    onRunQuery={handleRunFreeTextQuery}
                    data={data}
                    services={services}
                  />
                )}

                <div style={{ maxWidth: 640 }}>
                  {!isPrometheusResource && (
                    <>
                      <EuiSpacer size="m" />
                      <EuiFlexGroup gutterSize="s">
                        <EuiFlexItem>
                          <EuiFormRow
                            label={i18n.translate('dashboard.variableQueryPanel.valueFieldLabel', {
                              defaultMessage: 'Value field',
                            })}
                            helpText={i18n.translate(
                              'dashboard.variableQueryPanel.valueFieldHelp',
                              {
                                defaultMessage: 'Field used as the stored variable value.',
                              }
                            )}
                          >
                            <EuiComboBox
                              placeholder={i18n.translate(
                                'dashboard.variableQueryPanel.selectValueFieldPlaceholder',
                                { defaultMessage: 'Run preview to load fields' }
                              )}
                              singleSelection={{ asPlainText: true }}
                              isClearable={false}
                              options={valueFieldOptions}
                              selectedOptions={
                                valueField || availableFields[0]
                                  ? [{ label: valueField || availableFields[0] }]
                                  : []
                              }
                              onChange={(selected) => setValueField(selected[0]?.label || '')}
                              onCreateOption={(value) => {
                                const field = value.trim();
                                if (field) setValueField(field);
                              }}
                              isDisabled={availableFields.length === 0 && !valueField}
                              data-test-subj="variableEditorValueField"
                              compressed
                            />
                          </EuiFormRow>
                        </EuiFlexItem>
                        <EuiFlexItem>
                          <EuiFormRow
                            label={i18n.translate('dashboard.variableQueryPanel.labelFieldLabel', {
                              defaultMessage: 'Label field',
                            })}
                            helpText={i18n.translate(
                              'dashboard.variableQueryPanel.labelFieldHelp',
                              {
                                defaultMessage: 'Optional field used as the display label.',
                              }
                            )}
                          >
                            <EuiComboBox
                              placeholder={i18n.translate(
                                'dashboard.variableQueryPanel.selectLabelFieldPlaceholder',
                                { defaultMessage: 'None' }
                              )}
                              singleSelection={{ asPlainText: true }}
                              options={labelFieldOptions}
                              selectedOptions={labelField ? [{ label: labelField }] : []}
                              onChange={(selected) => setLabelField(selected[0]?.label || '')}
                              onCreateOption={(value) => {
                                const field = value.trim();
                                if (field) setLabelField(field);
                              }}
                              isDisabled={availableFields.length === 0 && !labelField}
                              data-test-subj="variableEditorLabelField"
                              compressed
                            />
                          </EuiFormRow>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </>
                  )}

                  <EuiSpacer size="m" />
                  <EuiFormRow
                    label={i18n.translate('dashboard.variableQueryPanel.regexLabel', {
                      defaultMessage: 'Regex',
                    })}
                    helpText={i18n.translate('dashboard.variableQueryPanel.regexHelp', {
                      defaultMessage:
                        'Optional regex to filter options or extract values with capture groups.',
                    })}
                  >
                    <EuiFieldText
                      value={regex}
                      onChange={(e) => setRegex(e.target.value)}
                      placeholder="/^env=(?<value>[^,]+),label=(?<label>.+)$/"
                      data-test-subj="variableEditorRegex"
                      compressed
                    />
                  </EuiFormRow>
                </div>
              </EuiResizablePanel>
            </>
          )}
        </EuiResizableContainer>
      </EuiModalBody>
      <EuiHorizontalRule margin="none" />
      <EuiModalFooter>
        <EuiSmallButtonEmpty onClick={onDiscard} data-test-subj="queryEditorModalDiscard">
          {i18n.translate('dashboard.variableQueryPanel.discard', { defaultMessage: 'Discard' })}
        </EuiSmallButtonEmpty>
        <EuiSmallButton onClick={handleApply} fill data-test-subj="queryEditorModalApply">
          {i18n.translate('dashboard.variableQueryPanel.apply', { defaultMessage: 'Apply' })}
        </EuiSmallButton>
      </EuiModalFooter>
      {isMetricsExplorerOpen && (
        <MetricsExplorerModal
          data={data}
          dataConnectionId={dataset?.id}
          onClose={() => setIsMetricsExplorerOpen(false)}
          onSelectMetric={(metric) => {
            if (promQLResourceQuery?.kind === 'labelValues') {
              setResourceQueryState({ ...promQLResourceQuery, metric });
            }
            setIsMetricsExplorerOpen(false);
          }}
        />
      )}
    </EuiModal>
  );
};
