/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from 'opensearch-dashboards/server';

/**
 * Normalize the time string to the format of "yyyy-MM-dd HH:mm:ss"
 * @param timeString - The time string to normalize
 * @returns The normalized time string or null if the time string is invalid
 */
export function normTimeString(timeString: string): string | null {
  if (!timeString) {
    return null;
  }

  const date = new Date(timeString);

  if (isNaN(date.getTime())) {
    return null;
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const YYYY = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const DD = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
}

/**
 * Parses time range data from XML format
 * Handles various edge cases and validates the time range values
 *
 * @param inputString - The string containing time range data (XML)
 * @param logger - Logger instance for error reporting
 * @returns The parsed time range object with formatted time strings or null if parsing fails
 */
export function parseTimeRangeXML(
  inputString: string,
  logger: Logger
): { start: string; end: string } | null {
  if (!inputString) {
    logger.debug('Empty time range input string provided');
    return null;
  }

  try {
    // Extract start tag content
    const startTagMatch = inputString.match(/<start>(.*?)<\/start>/s);
    const startValue = startTagMatch ? startTagMatch[1].trim() : null;

    // Extract end tag content
    const endTagMatch = inputString.match(/<end>(.*?)<\/end>/s);
    const endValue = endTagMatch ? endTagMatch[1].trim() : null;

    if (!startValue || !endValue) {
      logger.warn('No start or end tags found in XML time range');
      return null;
    }

    const startDate = normTimeString(startValue);
    const endDate = normTimeString(endValue);

    if (!startDate || !endDate) {
      return null;
    }

    if (startDate >= endDate) {
      return null;
    }

    return { start: startDate, end: endDate };
  } catch (error) {
    logger.error(`Error parsing time range input: ${error}`);
    return null;
  }
}