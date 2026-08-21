/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import { DataPublicPluginStart } from '../../../../../../data/public';
import {
  buildVariableOptionsFromQueryResult,
  executeVariableQuery,
  applyRegexToVariableOptions,
  VariableQueryResult,
} from '../../../../variables/variable_query_utils';
import {
  executePromQLResourceQuery,
  buildPromQLVariableOptions,
  interpolatePromqlQueryType,
  hasValidLabelValuesSelector,
} from '../../../../variables/promql_variable_query_utils';
import { IVariableInterpolationService } from '../../../../variables/variable_interpolation_service';
import { NormalizedVariableOption, PromQLVariableQueryType } from '../../../../variables/types';

const MAX_PREVIEW_OPTIONS = 100;
const EMPTY_FIELDS: string[] = [];

export interface UseVariableQueryPreviewArgs {
  data: DataPublicPluginStart;
  query: string;
  language: string;
  dataset: any;
  useTimeFilter: boolean;
  valueField: string;
  labelField: string;
  regex: string;
  interpolationService?: IVariableInterpolationService;
  currentVariableName?: string;
  isPromqlFillInBlank: boolean;
  promqlQueryType: PromQLVariableQueryType;
}

/**
 * Owns query execution (free-text via executeVariableQuery, or PromQL
 * fill-in-the-blank via executePromQLResourceQuery) and the derived preview
 * option list / error state shared by both modes.
 */
export function useVariableQueryPreview({
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
  isPromqlFillInBlank,
  promqlQueryType,
}: UseVariableQueryPreviewArgs) {
  const [isLoading, setIsLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<VariableQueryResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [promqlOptions, setPromqlOptions] = useState<NormalizedVariableOption[] | null>(null);

  useEffect(() => {
    setQueryResult(null);
    setPromqlOptions(null);
    setExecutionError(null);
  }, [query, dataset, language, promqlQueryType]);

  const availableFields = queryResult?.fields ?? EMPTY_FIELDS;

  const previewOptionsResult = useMemo(() => {
    // Fill-in-the-blank PromQL query types return plain value lists directly —
    // there's no tabular result to pick a value/label field from.
    if (isPromqlFillInBlank) {
      return { options: promqlOptions ?? ([] as NormalizedVariableOption[]) };
    }

    if (!queryResult) {
      return { options: [] as NormalizedVariableOption[] };
    }

    return buildVariableOptionsFromQueryResult(queryResult, {
      valueField: valueField || undefined,
      labelField: labelField || undefined,
    });
  }, [isPromqlFillInBlank, promqlOptions, queryResult, valueField, labelField]);

  const filteredPreviewOptions = useMemo(
    () => applyRegexToVariableOptions(previewOptionsResult.options, regex),
    [previewOptionsResult.options, regex]
  );

  const previewOptions = useMemo(
    () => filteredPreviewOptions.slice(0, MAX_PREVIEW_OPTIONS),
    [filteredPreviewOptions]
  );

  const isTruncated = filteredPreviewOptions.length > MAX_PREVIEW_OPTIONS;
  const selectedValueField = valueField || availableFields[0];

  // Single classification of the preview outcome for BOTH the displayed message and Apply gating.
  const previewResult = useMemo<{ message: string | null; blocking: boolean }>(() => {
    if (isPromqlFillInBlank) {
      if (promqlOptions === null || filteredPreviewOptions.length > 0) {
        return { message: null, blocking: false };
      }
      if (promqlOptions.length === 0) {
        return {
          message: i18n.translate('dashboard.variableQueryPanel.promqlNoResults', {
            defaultMessage: 'Query returned no results',
          }),
          blocking: false,
        };
      }
      return {
        message: i18n.translate('dashboard.variableQueryPanel.noRegexMatches', {
          defaultMessage: 'No options match the regex',
        }),
        blocking: false,
      };
    }

    if (!queryResult || filteredPreviewOptions.length > 0) {
      return { message: null, blocking: false };
    }

    if (queryResult.rows.length === 0) {
      return {
        message: i18n.translate('dashboard.variableQueryPanel.noResults', {
          defaultMessage: 'Query returned no results',
        }),
        blocking: false,
      };
    }

    if (!selectedValueField) {
      return {
        message: i18n.translate('dashboard.variableQueryPanel.noValueField', {
          defaultMessage: 'Query returned results, but no fields are available for variable values',
        }),
        blocking: true,
      };
    }

    if (!availableFields.includes(selectedValueField)) {
      return {
        message: i18n.translate('dashboard.variableQueryPanel.valueFieldMissing', {
          defaultMessage: 'Selected value field was not found in query results',
        }),
        blocking: true,
      };
    }

    if (previewOptionsResult.options.length === 0) {
      return {
        message: i18n.translate('dashboard.variableQueryPanel.noScalarValues', {
          defaultMessage:
            'Query returned results, but the selected value field does not contain string, number, or boolean values',
        }),
        blocking: true,
      };
    }

    return {
      message: i18n.translate('dashboard.variableQueryPanel.noRegexMatches', {
        defaultMessage: 'No options match the regex',
      }),
      blocking: false,
    };
  }, [
    isPromqlFillInBlank,
    promqlOptions,
    availableFields,
    filteredPreviewOptions.length,
    previewOptionsResult.options.length,
    queryResult,
    selectedValueField,
  ]);

  const previewError = executionError || previewResult.message;

  const hasCompletedQuery = isPromqlFillInBlank ? promqlOptions !== null : queryResult !== null;

  // Valid once a query has executed since the last edit and there is no blocking error.
  const canApply = hasCompletedQuery && !executionError && !previewResult.blocking;

  const handleRunPromqlResourceQuery = useCallback(async () => {
    if (promqlQueryType.kind === 'queryResult') {
      return;
    }

    if (promqlQueryType.kind === 'labelValues' && !promqlQueryType.label.trim()) {
      setExecutionError(
        i18n.translate('dashboard.variableQueryPanel.promqlLabelEmpty', {
          defaultMessage: 'Label is required',
        })
      );
      return;
    }

    if (
      promqlQueryType.kind === 'labelValues' &&
      !hasValidLabelValuesSelector(promqlQueryType.metric, promqlQueryType.matchers ?? [])
    ) {
      setExecutionError(
        i18n.translate('dashboard.variableQueryPanel.promqlNegativeOnlySelector', {
          defaultMessage:
            'Add a Metric, or an "=" / "=~" label filter — a selector made only of "!=" / "!~" ' +
            'filters is not valid in PromQL.',
        })
      );
      return;
    }

    if (promqlQueryType.kind === 'series' && !promqlQueryType.matcher.trim()) {
      setExecutionError(
        i18n.translate('dashboard.variableQueryPanel.promqlMatcherEmpty', {
          defaultMessage: 'Series selector is required',
        })
      );
      return;
    }

    setIsLoading(true);
    setExecutionError(null);

    try {
      let queryTypeToExecute: PromQLVariableQueryType = promqlQueryType;
      if (interpolationService) {
        queryTypeToExecute = interpolatePromqlQueryType(promqlQueryType, (value) =>
          interpolationService.hasVariables(value)
            ? interpolationService.interpolate(value, language, currentVariableName)
            : value
        );
      }

      const timeRange = useTimeFilter ? data.query.timefilter.timefilter.getTime() : undefined;
      const values = await executePromQLResourceQuery(
        data,
        dataset?.id,
        queryTypeToExecute,
        timeRange
      );
      // Regex filtering/extraction is applied once, downstream, by
      // filteredPreviewOptions (same as the free-text query flow) — dedupe here only.
      setPromqlOptions(buildPromQLVariableOptions(values));
    } catch (err: any) {
      setPromqlOptions(null);
      setExecutionError(
        err.message ||
          i18n.translate('dashboard.variableQueryPanel.executionFailed', {
            defaultMessage: 'Failed to execute query',
          })
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    promqlQueryType,
    useTimeFilter,
    data,
    dataset,
    interpolationService,
    language,
    currentVariableName,
  ]);

  const handleRunQuery = useCallback(async () => {
    if (!query.trim()) {
      setExecutionError(
        i18n.translate('dashboard.variableQueryPanel.queryEmpty', {
          defaultMessage: 'Query is empty',
        })
      );
      return;
    }

    setIsLoading(true);
    setExecutionError(null);

    try {
      // Interpolate variable references before executing the preview query
      let queryToExecute = query.trim();
      if (interpolationService && interpolationService.hasVariables(queryToExecute)) {
        queryToExecute = interpolationService.interpolate(
          queryToExecute,
          language,
          currentVariableName
        );
      }

      const result = await executeVariableQuery(
        data,
        {
          query: queryToExecute,
          language,
          dataset: dataset || undefined,
        },
        undefined,
        useTimeFilter
      );

      setQueryResult(result);
    } catch (err: any) {
      setQueryResult(null);
      setExecutionError(
        err.message ||
          i18n.translate('dashboard.variableQueryPanel.executionFailed', {
            defaultMessage: 'Failed to execute query',
          })
      );
    } finally {
      setIsLoading(false);
    }
  }, [query, interpolationService, data, language, dataset, useTimeFilter, currentVariableName]);

  return {
    isLoading,
    availableFields,
    filteredPreviewOptions,
    previewOptions,
    isTruncated,
    previewError,
    canApply,
    selectedValueField,
    handleRunQuery,
    handleRunPromqlResourceQuery,
  };
}
