/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Converts PascalCase/TitleCase strings to sentence case with intelligent spacing
 *
 * @param input - The PascalCase string to convert
 * @param exceptions - Array of words that should remain unchanged
 * @returns Converted string with proper spacing
 *
 * @example
 * titleCaseToSentenceCase('LoadBalancer') // → 'Load Balancer'
 * titleCaseToSentenceCase('TargetGroup') // → 'Target Group'
 * titleCaseToSentenceCase('APIGateway') // → 'API Gateway'
 * titleCaseToSentenceCase('AWS') // → 'AWS'
 * titleCaseToSentenceCase('CloudWatch', ['CloudWatch']) // → 'CloudWatch'
 * titleCaseToSentenceCase('CloudWatchMetrics', ['CloudWatch']) // → 'CloudWatch Metrics'
 * titleCaseToSentenceCase('AWSCloudWatchMetrics', ['AWS', 'CloudWatch']) // → 'AWS CloudWatch Metrics'
 */
export function titleCaseToSentenceCase(input: string, exceptions: string[] = []): string {
  // Handle special cases
  const specialCaseResult = processSpecialCases(input, exceptions);
  if (specialCaseResult !== null) {
    return specialCaseResult;
  }

  // Process exceptions first
  const processedExceptions = exceptions.map(processException);

  // Process the input string
  const processedSegments = applyExceptions(
    mergeAcronyms(splitAtCapitals(input)),
    processedExceptions
  );

  // Join the segments with spaces
  return processedSegments.join(' ');
}

/**
 * Determines if character is upper case
 */
const isUpperCase = (char?: string): boolean => !!char && /^[A-Z]$/.test(char);

/**
 * Determines if character is lowercase
 */
const isLowerCase = (char?: string): boolean => !!char && /^[a-z]$/.test(char);

/**
 * Determines if string contains only uppercase letters
 *
 * @example
 * isStringAllUpperCase('AWS')  // true
 * isStringAllUpperCase('Api')  // false
 * isStringAllUpperCase('API2')  // false
 */
const isStringAllUpperCase = (str: string): boolean => /^[A-Z]+$/.test(str);

/**
 * Determines if string contains only lowercase letters
 *
 * @example
 * isStringAllLowerCase('aws')  // true
 * isStringAllLowerCase('Api')  // false
 * isStringAllLowerCase('api2')  // false
 */
const isStringAllLowerCase = (str: string): boolean => /^[a-z]+$/.test(str);

/**
 * Determines if a character represents the start of a new word
 *
 * @param char - Current character to check
 * @param prevChar - Previous character
 * @param nextChar - Next character
 * @param index - Current index
 * @returns Whether this character starts a new word
 *
 * @example
 * // Case 1: Standard PascalCase boundary (lowercase to uppercase)
 * isWordBoundary('B', 'a', 'c', 1)  // true - 'aB' as in 'LoadBalancer'
 *
 * @example
 * // Case 2: Acronym-to-word transition (uppercase to uppercase with lowercase next)
 * isWordBoundary('G', 'I', 'a', 2)  // true - 'IG' as in 'APIGateway'
 *
 * @example
 * // Not a boundary: First character
 * isWordBoundary('L', undefined, 'o', 0)  // false - 'L' in 'Load'
 *
 * @example
 * // Not a boundary: Inside acronym
 * isWordBoundary('P', 'A', 'I', 2)  // false - 'AP' in 'API'
 */
function isWordBoundary(char: string, prevChar?: string, nextChar?: string, index = 0): boolean {
  // Must be uppercase to be a word boundary
  if (!isUpperCase(char)) return false;

  // No previous character - not a boundary (first character of string)
  if (!prevChar) return false;

  // Case 1: Previous char is lowercase (standard PascalCase boundary)
  if (isLowerCase(prevChar)) return true;

  // Case 2: In acronym with transition to word (like "API" to "Gateway")
  // Current char is uppercase, prev char is uppercase, and next char is lowercase
  return isUpperCase(prevChar) && isLowerCase(nextChar) && index > 1;
}

/**
 * Splits a string at capital letter boundaries
 *
 * @param input - String to split
 * @returns Array of segments
 *
 * @example
 * splitAtCapitals('LoadBalancer')  // ['Load', 'Balancer']
 * splitAtCapitals('APIGateway')    // ['A', 'P', 'I', 'Gateway']
 * splitAtCapitals('AWS')           // ['A', 'W', 'S']
 * splitAtCapitals('')              // []
 */
function splitAtCapitals(input: string): string[] {
  if (!input) return [];

  // Start with the first character
  const result: string[] = [];
  let currentWord = input[0] || '';

  // Process each character after the first one
  for (let i = 1; i < input.length; i++) {
    const char = input[i];
    const prevChar = input[i - 1];
    const nextChar = i < input.length - 1 ? input[i + 1] : undefined;

    if (isWordBoundary(char, prevChar, nextChar, i)) {
      result.push(currentWord);
      currentWord = char;
    } else {
      currentWord += char;
    }
  }

  // Add the last word
  if (currentWord) {
    result.push(currentWord);
  }

  return result;
}

/**
 * Determines if a segment is a single capital letter
 *
 * @example
 * isSingleCapitalLetter('A')  // true
 * isSingleCapitalLetter('a')  // false
 * isSingleCapitalLetter('AB') // false
 */
const isSingleCapitalLetter = (segment: string): boolean =>
  segment.length === 1 && isUpperCase(segment);

/**
 * Merges consecutive capital letter segments into acronyms
 *
 * @param segments - Array of segments to process
 * @returns Processed array with merged acronyms
 *
 * @example
 * mergeAcronyms(['A', 'P', 'I', 'Gateway'])  // ['API', 'Gateway']
 * mergeAcronyms(['Load', 'Balancer'])        // ['Load', 'Balancer']
 * mergeAcronyms(['A', 'W', 'S', 'Cloud', 'Watch', 'Metrics'])  // ['AWS', 'Cloud', 'Watch', 'Metrics']
 */
function mergeAcronyms(segments: string[]): string[] {
  // Early return for empty input
  if (!segments.length) return [];

  const result: string[] = [];
  let currentAcronym = '';

  for (const segment of segments) {
    if (isSingleCapitalLetter(segment)) {
      currentAcronym += segment;
    } else {
      // If we have collected an acronym, add it before adding this segment
      if (currentAcronym) {
        result.push(currentAcronym);
        currentAcronym = '';
      }
      result.push(segment);
    }
  }

  // Add any remaining acronym
  if (currentAcronym) {
    result.push(currentAcronym);
  }

  return result;
}

/**
 * Represents a processed exception pattern to look for in segments
 */
interface ProcessedException {
  original: string;
  segments: string[];
}

/**
 * Checks if segments at a position match an exception pattern
 *
 * @example
 * matchesPattern(['A', 'P', 'I', 'Gateway'], 0, ['A', 'P', 'I'])  // true
 * matchesPattern(['Cloud', 'Watch', 'Metrics'], 0, ['Cloud', 'Watch'])  // true
 * matchesPattern(['Cloud', 'Watch', 'Metrics'], 1, ['Watch', 'Metrics'])  // true
 * matchesPattern(['Cloud', 'Watch', 'Metrics'], 0, ['Watch'])  // false
 * matchesPattern(['Cloud', 'Watch'], 0, ['Cloud', 'Watch', 'Metrics'])  // false - pattern is too long
 */
function matchesPattern(segments: string[], startIndex: number, pattern: string[]): boolean {
  if (startIndex + pattern.length > segments.length) return false;

  return pattern.every((patternSegment, i) => segments[startIndex + i] === patternSegment);
}

/**
 * Replaces matching pattern with an exception in the segments array
 *
 * @example
 * replacePattern(['Cloud', 'Watch', 'Metrics'], 0, 2, 'CloudWatch')
 * // ['CloudWatch', 'Metrics']
 *
 * @example
 * replacePattern(['A', 'P', 'I', 'Gateway'], 0, 3, 'API')
 * // ['API', 'Gateway']
 */
function replacePattern(
  segments: string[],
  startIndex: number,
  patternLength: number,
  replacement: string
): string[] {
  return [
    ...segments.slice(0, startIndex),
    replacement,
    ...segments.slice(startIndex + patternLength),
  ];
}

/**
 * Processes segments against exceptions, finding and merging matches
 *
 * @param segments - Array of segments from the input string
 * @param exceptions - Array of processed exception segments
 * @returns Processed segments with exceptions merged
 *
 * @example
 * // With CloudWatch as an exception:
 * applyExceptions(
 *   ['Cloud', 'Watch', 'Metrics'],
 *   [{ original: 'CloudWatch', segments: ['Cloud', 'Watch'] }]
 * )
 * // ['CloudWatch', 'Metrics']
 *
 * @example
 * // With multiple exceptions:
 * applyExceptions(
 *   ['A', 'W', 'S', 'Cloud', 'Watch', 'Metrics'],
 *   [
 *     { original: 'AWS', segments: ['A', 'W', 'S'] },
 *     { original: 'CloudWatch', segments: ['Cloud', 'Watch'] }
 *   ]
 * )
 * // ['AWS', 'CloudWatch', 'Metrics']
 */
function applyExceptions(segments: string[], exceptions: ProcessedException[]): string[] {
  if (!exceptions.length || !segments.length) return segments;

  let result = [...segments];

  for (const { original, segments: pattern } of exceptions) {
    if (!pattern.length) continue;

    let startIndex = 0;
    while (startIndex <= result.length - pattern.length) {
      if (matchesPattern(result, startIndex, pattern)) {
        result = replacePattern(result, startIndex, pattern.length, original);
        // We'll start over from the beginning since the array has changed
        startIndex = 0;
      } else {
        startIndex += 1;
      }
    }
  }

  return result;
}

/**
 * Processes the exceptional cases where no transformation is needed
 *
 * @param input - The input string
 * @param exceptions - Array of exceptions
 * @returns The original string if it's a special case, or null if processing should continue
 *
 * @example
 * processSpecialCases('AWS')  // 'AWS' - all uppercase, no transformation needed
 * processSpecialCases('aws')  // 'aws' - all lowercase, no transformation needed
 * processSpecialCases('CloudWatch', ['CloudWatch'])  // 'CloudWatch' - exact match in exceptions
 * processSpecialCases('')  // '' - empty string
 * processSpecialCases('APIGateway')  // null - needs further processing
 */
function processSpecialCases(input: string, exceptions: string[] = []): string | null {
  // Handle empty or invalid input
  if (!input || typeof input !== 'string') {
    return input || '';
  }

  // If the entire input is in exceptions, return it unchanged
  if (exceptions.includes(input)) {
    return input;
  }

  // All lowercase words don't need processing
  if (isStringAllLowerCase(input)) {
    return input;
  }

  // All uppercase words (acronyms) don't need processing
  if (isStringAllUpperCase(input)) {
    return input;
  }

  return null; // Not a special case, continue with normal processing
}

/**
 * Process an exception string to prepare it for pattern matching
 *
 * @example
 * processException('CloudWatch')
 * // { original: 'CloudWatch', segments: ['Cloud', 'Watch'] }
 *
 * @example
 * processException('AWS')
 * // { original: 'AWS', segments: ['AWS'] }
 */
function processException(exception: string): ProcessedException {
  return {
    original: exception,
    segments: mergeAcronyms(splitAtCapitals(exception)),
  };
}
