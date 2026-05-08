/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Options for terminology conversion
 */
export interface ConvertTerminologyOptions {
  /**
   * Whether to replace all occurrences or just the first one
   * @default true
   */
  replaceAll?: boolean;
}

/**
 * Enum for case styles
 */
enum CaseStyle {
  TITLE_CASE = 'title',
  UPPER_CASE = 'upper',
  LOWER_CASE = 'lower',
}

/**
 * Detects the case style of a string
 * @param str - The string to analyze
 * @returns The detected case style
 */
function detectCaseStyle(str: string): CaseStyle {
  // Remove spaces and special characters for case detection
  const alphaOnly = str.replace(/[^a-zA-Z]/g, '');

  if (!alphaOnly) {
    return CaseStyle.LOWER_CASE; // Default fallback
  }

  const isAllUpper = alphaOnly === alphaOnly.toUpperCase();
  const isAllLower = alphaOnly === alphaOnly.toLowerCase();

  if (isAllUpper) {
    return CaseStyle.UPPER_CASE;
  } else if (isAllLower) {
    return CaseStyle.LOWER_CASE;
  }

  // Check for Title Case (including multi-word like "Index Patterns")
  // Split by word boundaries and check if each word starts with uppercase
  const words = str.split(/\s+/);
  const isEveryWordTitleCase = words.every((word) => {
    const firstLetter = word.charAt(0);
    const restOfWord = word.slice(1);
    // Word must start with uppercase and rest must be lowercase (or empty)
    return (
      firstLetter === firstLetter.toUpperCase() &&
      (restOfWord === '' || restOfWord === restOfWord.toLowerCase())
    );
  });

  if (isEveryWordTitleCase && words.length > 0) {
    return CaseStyle.TITLE_CASE;
  }

  // Mixed case - fall back to lower case
  return CaseStyle.LOWER_CASE;
}

/**
 * Applies the case style to a string
 * @param str - The string to transform
 * @param caseStyle - The case style to apply
 * @returns The transformed string
 */
function applyCaseStyle(str: string, caseStyle: CaseStyle): string {
  switch (caseStyle) {
    case CaseStyle.UPPER_CASE:
      return str.toUpperCase();
    case CaseStyle.TITLE_CASE:
      // Handle multi-word strings by capitalizing each word
      return str
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    case CaseStyle.LOWER_CASE:
    default:
      return str.toLowerCase();
  }
}

/**
 * Converts "index pattern" terminology to "dataset" terminology in a string.
 *
 * This function helps maintain consistent terminology across the OpenSearch Dashboards UI
 * based on whether dataset management is enabled. It preserves the case style of the original
 * text (Title Case, UPPER CASE, or lower case).
 *
 * @param input - The string to convert
 * @param isDatasetManagementEnabled - Whether dataset management is enabled
 * @param options - Conversion options
 * @returns The converted string, or original string if dataset management is disabled
 *
 * @example
 * ```typescript
 * // Dataset management enabled
 * convertIndexPatternTerminology('Index Pattern', true)
 * // Returns: 'Dataset'
 *
 * convertIndexPatternTerminology('INDEX PATTERNS', true)
 * // Returns: 'DATASETS'
 *
 * convertIndexPatternTerminology('index pattern', true)
 * // Returns: 'dataset'
 *
 * // Dataset management disabled
 * convertIndexPatternTerminology('Index Pattern', false)
 * // Returns: 'Index Pattern' (unchanged)
 *
 * // Replace only first occurrence
 * convertIndexPatternTerminology(
 *   'Index Pattern and index patterns',
 *   true,
 *   { replaceAll: false }
 * )
 * // Returns: 'Dataset and index patterns'
 * ```
 */
export function convertIndexPatternTerminology(
  input: string,
  isDatasetManagementEnabled: boolean,
  options: ConvertTerminologyOptions = {}
): string {
  // If dataset management is disabled, return the original string
  if (!isDatasetManagementEnabled) {
    return input;
  }

  const { replaceAll = true } = options;

  // Define the patterns to replace
  const patterns = [
    { from: 'index-patterns', to: 'datasets' },
    { from: 'index-pattern', to: 'dataset' },
    { from: 'index patterns', to: 'datasets' },
    { from: 'index pattern', to: 'dataset' },
    { from: 'indexpatterns', to: 'datasets' },
    { from: 'indexpattern', to: 'dataset' },
  ];

  let result = input;

  // Process each pattern
  for (const pattern of patterns) {
    // Create a regex to find the pattern (case-insensitive)
    const regex = new RegExp(pattern.from, replaceAll ? 'gi' : 'i');

    // Replace using a function to preserve case
    result = result.replace(regex, (match) => {
      const caseStyle = detectCaseStyle(match);
      return applyCaseStyle(pattern.to, caseStyle);
    });
  }

  return result;
}
