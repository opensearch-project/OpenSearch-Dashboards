/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Variable } from './types';

/**
 * Variable value with metadata for interpolation
 */
export interface VariableValue {
  name: string;
  value: string;
  multi?: boolean;
  values?: string[];
}

/**
 * Service interface for variable interpolation
 * This service is responsible for replacing variable placeholders in queries
 * with their actual values.
 */
export interface IVariableInterpolationService {
  /**
   * Check if a query string contains variable placeholders
   * @param query - The query string to check
   * @returns true if the query contains variables ($var or ${var})
   */
  hasVariables(query: string): boolean;

  /**
   * Interpolate variables in a query string
   * @param query - The query string with variable placeholders
   * @param language - The query language (e.g., 'PPL', 'PROMQL') for formatting multi-select values
   * @returns The query string with variables replaced by their values
   */
  interpolate(query: string, language?: string): string;

  /**
   * Get current variable values as a key-value map
   * @returns Record of variable names to their current values
   */
  getCurrentValues(): Record<string, string>;

  /**
   * Get all variable values with metadata
   * @returns Array of variable values with metadata
   */
  getVariables(): VariableValue[];
}

/**
 * VariableInterpolationService - Replaces variable placeholders in queries
 *
 * Supports two syntaxes:
 * - Simple: $variableName
 * - Braced: ${variableName}
 */
export class VariableInterpolationService implements IVariableInterpolationService {
  // Regex to match variable syntax: $variable or ${variable}
  private static get VARIABLE_PATTERN() {
    return /\$\{(\w+)\}|\$(\w+)/g;
  }

  constructor(private readonly getVariablesFn: () => Variable[]) {}

  /**
   * Check if a query string contains variable placeholders
   */
  hasVariables(query: string): boolean {
    if (!query || typeof query !== 'string') {
      return false;
    }
    return VariableInterpolationService.VARIABLE_PATTERN.test(query);
  }

  /**
   * Interpolate variables in a query string
   *
   * @param query - The query string with variable placeholders
   * @param language - The query language for formatting multi-select values
   * @example
   * // Multi-select with PPL:
   * // Query: source=logs | where service IN $service
   * // Variables: [{ name: 'service', current: 'api,web', multi: true }]
   * // Result: source=logs | where service IN ('api', 'web')
   */
  interpolate(query: string, language?: string): string {
    if (!query || typeof query !== 'string') {
      return query;
    }

    const variables = this.getVariables();
    const valuesMap = new Map(variables.map((v) => [v.name, v]));
    const lang = (language || '').toUpperCase();

    return query.replace(
      VariableInterpolationService.VARIABLE_PATTERN,
      (match, bracedName, simpleName) => {
        const varName = bracedName || simpleName;
        const variable = valuesMap.get(varName);

        if (variable === undefined) {
          // Variable not found, keep original placeholder
          return match;
        }

        if (variable.multi) {
          return this.formatMultiValue(variable.values ?? [], lang);
        }

        return this.escapeForLanguage(variable.value, lang);
      }
    );
  }

  /**
   * Get current variable values as a key-value map
   */
  getCurrentValues(): Record<string, string> {
    const variables = this.getVariables();
    const result: Record<string, string> = {};

    for (const variable of variables) {
      result[variable.name] = variable.value;
    }

    return result;
  }

  /**
   * Get all variable values with metadata
   * Converts from Variable[] to VariableValue[]
   */
  getVariables(): VariableValue[] {
    const variables = this.getVariablesFn();

    return variables.map((v) => ({
      name: v.name,
      value: (v.current ?? []).join(','),
      multi: v.multi,
      values: v.multi ? v.current : undefined,
    }));
  }

  /**
   * Format multi-select values based on query language
   *
   * - PPL: ('value1', 'value2') — for use with IN operator
   * - PROMQL: (value1|value2)
   * - Default: value1, value2
   */
  private formatMultiValue(values: string[], language: string): string {
    if (values.length === 0) {
      switch (language) {
        case 'PPL':
          return "('')";
        case 'PROMQL':
          return '()';
        default:
          return '';
      }
    }

    switch (language) {
      case 'PPL': {
        const escaped = values.map((v) => this.escapeForLanguage(v, language));
        return `(${escaped.map((v) => `'${v}'`).join(', ')})`;
      }
      case 'PROMQL': {
        const escaped = values.map((v) => this.escapeForLanguage(v, language));
        return `(${escaped.join('|')})`;
      }
      default: {
        const escaped = values.map((v) => this.escapeForLanguage(v, language));
        return escaped.join(', ');
      }
    }
  }

  /**
   * Escape a value based on the query language.
   */
  private escapeForLanguage(value: string, language: string): string {
    if (!value || typeof value !== 'string') {
      return value;
    }
    switch (language) {
      case 'PPL':
        return this.escapePPL(value);
      case 'PROMQL':
        return this.escapePromQL(value);
      default:
        return this.escapePPL(value);
    }
  }

  /**
   * Escape a value for safe embedding in PPL string literals.
   * Doubles single quotes and escapes backslashes.
   */
  private escapePPL(value: string): string {
    if (!value || typeof value !== 'string') {
      return value;
    }
    return value.replace(/\\/g, '\\\\').replace(/'/g, "''");
  }

  /**
   * Escape a value for safe embedding in PromQL regex matchers.
   * Escapes regex-significant characters: \ . * + ? ^ $ | ( ) [ ] { }
   */
  private escapePromQL(value: string): string {
    if (!value || typeof value !== 'string') {
      return value;
    }
    // Prefix each regex-significant character with a backslash
    let result = '';
    for (const ch of value) {
      if ('\\.*+?^$|()[]{}'.includes(ch)) {
        result += '\\' + ch;
      } else {
        result += ch;
      }
    }
    return result;
  }
}

/**
 * Create a no-op implementation for when no variable service is configured
 */
export const createNoOpVariableInterpolationService = (): IVariableInterpolationService => ({
  hasVariables: () => false,
  interpolate: (query: string) => query,
  getCurrentValues: () => ({}),
  getVariables: () => [],
});
