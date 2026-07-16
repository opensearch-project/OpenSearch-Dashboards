/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart, Query } from '../../../data/public';
import { NormalizedVariableOption, VariableQueryParams, VariableOptionType } from './types';

export interface VariableQueryResult {
  rows: Array<Record<string, unknown>>;
  fields: string[];
  fieldTypes: Record<string, VariableOptionType>;
}

export interface VariableOptionsResult {
  options: NormalizedVariableOption[];
  optionType?: VariableOptionType;
}

function parseVariableRegex(regex?: string): RegExp | undefined {
  if (!regex) return undefined;

  const match = regex.match(/^\/(.+)\/([gimsuy]*)$/);
  return match ? new RegExp(match[1], match[2]) : new RegExp(regex);
}

/**
 * Adds "source = <dataset>" clause to PPL query if not present.
 * Handles backtick escaping for INDEXES and INDEX_PATTERN dataset types.
 */
function addPPLSourceClause(query: Query): Query {
  const queryString = typeof query.query === 'string' ? query.query : '';
  const lowerCaseQuery = queryString.toLowerCase();
  const hasSource = /^[^|]*\bsource\s*=/.test(lowerCaseQuery);
  const hasDescribe = /^\s*describe\s+/.test(lowerCaseQuery);
  const hasShow = /^\s*show\s+/.test(lowerCaseQuery);

  // Add backticks to dataset type INDEXES or INDEX_PATTERNS
  let datasetTitle: string;
  if (query.dataset && ['INDEXES', 'INDEX_PATTERN'].includes(query.dataset.type)) {
    if (hasSource) {
      // Replace source=anything with source=`anything`
      const updatedQuery = queryString.replace(/(\bsource\s*=\s*)([^`\s][^\s|]*)/gi, '$1`$2`');
      return { ...query, query: updatedQuery };
    }
    datasetTitle = `\`${query.dataset.title}\``;
  } else {
    datasetTitle = query.dataset?.title || '';
  }

  if (hasSource || hasDescribe || hasShow) {
    return { ...query, query: queryString };
  }

  let queryStringWithSource: string;
  if (queryString.trim() === '') {
    queryStringWithSource = `source = ${datasetTitle}`;
  } else {
    queryStringWithSource = `source = ${datasetTitle} ${queryString}`;
  }

  return {
    ...query,
    query: queryStringWithSource,
  };
}

/**
 * Convert a raw field value to string.
 */
function extractValues(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractValues(item));
  }

  if (typeof value === 'string') {
    return [value];
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return [String(value)];
  }

  return [];
}

function getScalarLabel(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const label = String(value).trim();
    return label || undefined;
  }

  return undefined;
}

function getFirstTypedValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    for (const item of value) {
      const firstTypedValue = getFirstTypedValue(item);
      if (firstTypedValue !== undefined) {
        return firstTypedValue;
      }
    }
    return undefined;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  return undefined;
}

function getValueType(value: unknown): VariableOptionType | undefined {
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (typeof value === 'string') {
    return 'string';
  }
}

/**
 * Parse search response into neutral row metadata.
 *
 * Response structure:
 * {
 *   hits: {
 *     hits: [
 *       { _source: { field: value } },
 *       { _source: { field: value } },
 *       ...
 *     ]
 *   }
 * }
 */
export function parseResponseToQueryResult(response: any): VariableQueryResult {
  const rows: Array<Record<string, unknown>> = [];
  const fields: string[] = [];
  const fieldsSet = new Set<string>();
  const fieldTypes: Record<string, VariableOptionType> = {};
  const hits = response?.hits?.hits;

  if (!Array.isArray(hits)) {
    return { rows, fields, fieldTypes };
  }

  hits.forEach((hit: any) => {
    const source = hit?._source;
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
      return;
    }

    rows.push(source);
    Object.keys(source).forEach((field) => {
      if (!fieldsSet.has(field)) {
        fieldsSet.add(field);
        fields.push(field);
      }

      if (!fieldTypes[field]) {
        const fieldType = getValueType(getFirstTypedValue(source[field]));
        if (fieldType) {
          fieldTypes[field] = fieldType;
        }
      }
    });
  });

  return { rows, fields, fieldTypes };
}

export function buildVariableOptionsFromQueryResult(
  result: VariableQueryResult,
  {
    valueField,
    labelField,
  }: {
    valueField?: string;
    labelField?: string;
  } = {}
): VariableOptionsResult {
  const selectedValueField = valueField || result.fields[0];

  if (!selectedValueField || !result.fields.includes(selectedValueField)) {
    return { options: [], optionType: undefined };
  }

  const selectedLabelField =
    labelField && result.fields.includes(labelField) ? labelField : undefined;
  const optionMap = new Map<string, NormalizedVariableOption>();

  result.rows.forEach((row) => {
    const rawValue = row[selectedValueField];
    const values = extractValues(rawValue);
    const label =
      !Array.isArray(rawValue) && selectedLabelField
        ? getScalarLabel(row[selectedLabelField])
        : undefined;

    values.forEach((value) => {
      const existing = optionMap.get(value);
      if (!existing) {
        optionMap.set(value, {
          value,
          ...(label ? { label } : {}),
        });
      } else if (!existing.label && label) {
        optionMap.set(value, { ...existing, label });
      }
    });
  });

  return {
    options: Array.from(optionMap.values()),
    optionType: result.fieldTypes[selectedValueField],
  };
}

/**
 * Execute a variable query and return neutral result metadata.
 *
 * @param dataPlugin - The data plugin instance for creating search sources
 * @param params - Query parameters (query string, language, dataset)
 * @param useTimeFilter - Whether to apply time filter to the query (default: false)
 * @returns Rows, available fields, and detected field types from the response
 */
export async function executeVariableQuery(
  dataPlugin: DataPublicPluginStart,
  params: VariableQueryParams,
  signal?: AbortSignal,
  useTimeFilter: boolean = false
): Promise<VariableQueryResult> {
  if (!params.query) {
    return { rows: [], fields: [], fieldTypes: {} };
  }

  const searchSource = await dataPlugin.search.searchSource.create();

  // Prepare query for language (adds source clause for PPL if missing)
  let queryObject: Query = {
    query: params.query,
    language: params.language,
    dataset: params.dataset,
  };

  if (params.language === 'PPL' && params.dataset) {
    queryObject = addPPLSourceClause(queryObject);
  }

  searchSource.setField('query', queryObject);

  // Skip dashboard filters for variable queries — variable options should
  // not be narrowed by the current dashboard filter state.
  searchSource.setField('skipFilters', true);

  // By default, skip time filter to get all options across all time ranges.
  // Only apply time filter if explicitly enabled by the variable configuration.
  if (!useTimeFilter) {
    searchSource.setField('skipTimeFilter', true);
  }

  const response = await searchSource.fetch({ abortSignal: signal });
  return parseResponseToQueryResult(response);
}

function getNonEmptyCapture(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  return value.trim() ? value : undefined;
}

function getNonEmptyLabelCapture(value: unknown): string | undefined {
  return getNonEmptyCapture(value)?.trim();
}

function buildRegexOption(
  option: NormalizedVariableOption,
  match: RegExpExecArray
): NormalizedVariableOption | undefined {
  const groups = match.groups;

  if (groups?.value !== undefined || groups?.label !== undefined || groups?.text !== undefined) {
    const value = getNonEmptyCapture(groups.value) ?? option.value;
    const label =
      getNonEmptyLabelCapture(groups.label) ?? getNonEmptyLabelCapture(groups.text) ?? option.label;

    return {
      value,
      ...(label ? { label } : {}),
    };
  }

  const capturedValue = getNonEmptyCapture(match[1]);
  if (!capturedValue) {
    return option;
  }

  const capturedLabel = getNonEmptyLabelCapture(match[2]) ?? option.label;

  return {
    value: capturedValue,
    ...(capturedLabel ? { label: capturedLabel } : {}),
  };
}

export function applyRegexToVariableOptions(
  options: NormalizedVariableOption[],
  regex?: string
): NormalizedVariableOption[] {
  if (!regex) return options;
  try {
    const pattern = parseVariableRegex(regex);
    if (!pattern) return options;

    const optionMap = new Map<string, NormalizedVariableOption>();

    options.forEach((option) => {
      pattern.lastIndex = 0;
      const match = pattern.exec(option.value);
      if (!match) {
        return;
      }

      const nextOption = buildRegexOption(option, match);
      if (!nextOption) {
        return;
      }

      const existingOption = optionMap.get(nextOption.value);
      if (!existingOption) {
        optionMap.set(nextOption.value, nextOption);
      } else if (!existingOption.label && nextOption.label) {
        optionMap.set(nextOption.value, { ...existingOption, label: nextOption.label });
      }
    });

    return Array.from(optionMap.values());
  } catch {
    return options;
  }
}

export const filterVariableOptionsByRegex = applyRegexToVariableOptions;
