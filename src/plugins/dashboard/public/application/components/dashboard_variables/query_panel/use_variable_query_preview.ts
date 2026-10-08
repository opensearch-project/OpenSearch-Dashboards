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
  interpolateResourceQuery,
} from '../../../../variables/promql_variable_query_utils';
import { IVariableInterpolationService } from '../../../../variables/variable_interpolation_service';
import { NormalizedVariableOption, PromQLResourceQuery } from '../../../../variables/types';
import { Dataset } from '../../../../../../data/common';

const MAX_PREVIEW_OPTIONS = 100;
const EMPTY_FIELDS: string[] = [];

export interface UseVariableQueryPreviewArgs {
  data: DataPublicPluginStart;
  query: string;
  language: string;
  dataset: Dataset | undefined;
  useTimeFilter: boolean;
  valueField: string;
  labelField: string;
  regex: string;
  interpolationService?: IVariableInterpolationService;
  currentVariableName?: string;
  isPrometheusResource: boolean;
  promQLResourceQuery: PromQLResourceQuery | undefined;
}

/**
 * Owns query execution (free-text via executeVariableQuery, or PromQL
 * resource lookups via executePromQLResourceQuery) and the derived preview
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
  isPrometheusResource,
  promQLResourceQuery,
}: UseVariableQueryPreviewArgs) {
  const [isLoading, setIsLoading] = useState(false);
  const [freeTextResult, setFreeTextResult] = useState<VariableQueryResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [resourceOptions, setResourceOptions] = useState<NormalizedVariableOption[] | null>(null);

  useEffect(() => {
    setFreeTextResult(null);
    setResourceOptions(null);
    setExecutionError(null);
  }, [query, dataset, language, promQLResourceQuery]);

  const availableFields = freeTextResult?.fields ?? EMPTY_FIELDS;

  const previewOptionsResult = useMemo(() => {
    // Resource query types return plain value lists directly —
    // there's no tabular result to pick a value/label field from.
    if (isPrometheusResource) {
      return { options: resourceOptions ?? ([] as NormalizedVariableOption[]) };
    }

    if (!freeTextResult) {
      return { options: [] as NormalizedVariableOption[] };
    }

    return buildVariableOptionsFromQueryResult(freeTextResult, {
      valueField: valueField || undefined,
      labelField: labelField || undefined,
    });
  }, [isPrometheusResource, resourceOptions, freeTextResult, valueField, labelField]);

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
  const previewValidation = useMemo<{ message: string | null; blocking: boolean }>(() => {
    if (isPrometheusResource) {
      if (resourceOptions === null || filteredPreviewOptions.length > 0) {
        return { message: null, blocking: false };
      }
      if (resourceOptions.length === 0) {
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

    if (!freeTextResult || filteredPreviewOptions.length > 0) {
      return { message: null, blocking: false };
    }

    if (freeTextResult.rows.length === 0) {
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
    isPrometheusResource,
    resourceOptions,
    availableFields,
    filteredPreviewOptions.length,
    previewOptionsResult.options.length,
    freeTextResult,
    selectedValueField,
  ]);

  const previewError = executionError || previewValidation.message;

  const hasCompletedQuery = isPrometheusResource
    ? resourceOptions !== null
    : freeTextResult !== null;

  // Valid once a query has executed since the last edit and there is no blocking error.
  const canApply = hasCompletedQuery && !executionError && !previewValidation.blocking;

  const handleRunResourceQuery = useCallback(async () => {
    if (!promQLResourceQuery) {
      return;
    }

    if (promQLResourceQuery.kind === 'labelValues' && !promQLResourceQuery.label.trim()) {
      setExecutionError(
        i18n.translate('dashboard.variableQueryPanel.promqlLabelEmpty', {
          defaultMessage: 'Label is required',
        })
      );
      return;
    }

    if (promQLResourceQuery.kind === 'series' && !promQLResourceQuery.matcher.trim()) {
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
      let queryTypeToExecute: PromQLResourceQuery = promQLResourceQuery;
      if (interpolationService) {
        queryTypeToExecute = interpolateResourceQuery(promQLResourceQuery, (value) =>
          interpolationService.hasVariables(value)
            ? interpolationService.interpolate(value, language, currentVariableName, true)
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
      setResourceOptions(buildPromQLVariableOptions(values));
    } catch (err: any) {
      setResourceOptions(null);
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
    promQLResourceQuery,
    useTimeFilter,
    data,
    dataset,
    interpolationService,
    language,
    currentVariableName,
  ]);

  const handleRunFreeTextQuery = useCallback(async () => {
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

      setFreeTextResult(result);
    } catch (err: any) {
      setFreeTextResult(null);
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
    handleRunFreeTextQuery,
    handleRunResourceQuery,
  };
}
