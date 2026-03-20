/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { parseHighlightedValue, getDisplayValue } from './highlight_display';

const PRE = '@opensearch-dashboards-highlighted-field@';
const POST = '@/opensearch-dashboards-highlighted-field@';

describe('parseHighlightedValue', () => {
  it('returns plain string when no highlight tags present', () => {
    expect(parseHighlightedValue('plain text')).toBe('plain text');
  });

  it('returns non-string values as-is', () => {
    expect(parseHighlightedValue(123 as any)).toBe(123);
  });

  it('parses single highlight tag into mark element', () => {
    const result = parseHighlightedValue(`${PRE}Holmes${POST}`);
    const { container } = render(<span>{result}</span>);
    const mark = container.querySelector('mark');
    expect(mark).toBeTruthy();
    expect(mark!.textContent).toBe('Holmes');
  });

  it('parses multiple highlight tags', () => {
    const result = parseHighlightedValue(`${PRE}Holmes${POST} and ${PRE}Bond${POST}`);
    const { container } = render(<span>{result}</span>);
    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBe(2);
    expect(marks[0].textContent).toBe('Holmes');
    expect(marks[1].textContent).toBe('Bond');
  });

  it('preserves text around highlight tags', () => {
    const result = parseHighlightedValue(`before ${PRE}match${POST} after`);
    const { container } = render(<span>{result}</span>);
    expect(container.textContent).toBe('before match after');
    expect(container.querySelector('mark')!.textContent).toBe('match');
  });
});

describe('getDisplayValue', () => {
  it('returns formatted value when no highlight exists', () => {
    expect(getDisplayValue('field1', 'plain value')).toBe('plain value');
  });

  it('returns formatted value when highlight object is undefined', () => {
    expect(getDisplayValue('field1', 'plain value', undefined)).toBe('plain value');
  });

  it('returns formatted value when field has no highlight entry', () => {
    expect(getDisplayValue('field1', 'plain value', { other: ['x'] })).toBe('plain value');
  });

  it('returns highlighted React nodes when field has highlight fragments', () => {
    const highlight = { firstname: [`${PRE}Holmes${POST}`] };
    const result = getDisplayValue('firstname', 'Holmes', highlight);
    const { container } = render(<span>{result}</span>);
    expect(container.querySelector('mark')!.textContent).toBe('Holmes');
  });

  it('joins multiple highlight fragments', () => {
    const highlight = { firstname: [`${PRE}Holmes${POST}`, `${PRE}Bond${POST}`] };
    const result = getDisplayValue('firstname', 'Holmes Bond', highlight);
    const { container } = render(<span>{result}</span>);
    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBe(2);
  });
});
