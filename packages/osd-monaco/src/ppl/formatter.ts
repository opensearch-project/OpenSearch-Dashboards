/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function formatPPLQuery(query: string): string {
  // Split by pipes and trim each segment
  const segments = query.split('|').map((seg) => seg.replace(/\s+/g, ' ').trim());

  // Rejoin with pipes at column 0
  return segments.join('\n| ');
}

export const pplRangeFormatProvider = {
  provideDocumentRangeFormattingEdits(model: any, range: any) {
    const text = model.getValueInRange(range);
    const formatted = formatPPLQuery(text);
    return [
      {
        text: formatted,
        range,
      },
    ];
  },
};

export const pplOnTypeFormatProvider = {
  autoFormatTriggerCharacters: ['|'],
  provideOnTypeFormattingEdits(model: any) {
    const fullRange = model.getFullModelRange();
    const text = model.getValue();
    const formatted = formatPPLQuery(text);

    return [
      {
        range: fullRange,
        text: formatted,
      },
    ];
  },
};
