/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { highlightTags } from './highlight_tags';

const highlightRegex = new RegExp(`${highlightTags.pre}(.*?)${highlightTags.post}`, 'g');

/**
 * Parse a string containing highlight custom tags into React nodes with <mark> elements.
 * Returns the original string if no highlight tags are found.
 */
export const parseHighlightedValue = (value: string): React.ReactNode => {
  if (typeof value !== 'string') return value;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  highlightRegex.lastIndex = 0;
  while ((match = highlightRegex.exec(value)) !== null) {
    if (match.index > lastIndex) {
      parts.push(value.substring(lastIndex, match.index));
    }
    parts.push(<mark key={match.index}>{match[1]}</mark>);
    lastIndex = highlightRegex.lastIndex;
  }

  if (parts.length === 0) return value;

  if (lastIndex < value.length) {
    parts.push(value.substring(lastIndex));
  }

  return parts;
};

/**
 * Get the display value for a field, using highlight fragments if available,
 * otherwise falling back to the formatted text value.
 */
export const getDisplayValue = (
  fieldName: string,
  formattedValue: string,
  highlight?: Record<string, string[]>
): React.ReactNode => {
  if (highlight && highlight[fieldName] && highlight[fieldName].length > 0) {
    return parseHighlightedValue(highlight[fieldName].join(' '));
  }
  return formattedValue;
};
