/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { normalizeSeverityText, SEVERITY_TEXT_FIELDS } from './severity_text';

describe('normalizeSeverityText', () => {
  it('maps mixed casing and synonyms to one label', () => {
    ['INFO', 'Info', 'info', 'Information', 'INFORMATIONAL', 'notice'].forEach((v) =>
      expect(normalizeSeverityText(v)).toBe('Info')
    );
    expect(normalizeSeverityText('WARNING')).toBe('Warn');
    expect(normalizeSeverityText('warn')).toBe('Warn');
    expect(normalizeSeverityText('ERR')).toBe('Error');
    expect(normalizeSeverityText('error')).toBe('Error');
    expect(normalizeSeverityText('DEBUG')).toBe('Debug');
    expect(normalizeSeverityText('TRACE')).toBe('Trace');
    expect(normalizeSeverityText('CRITICAL')).toBe('Fatal');
    expect(normalizeSeverityText('FATAL')).toBe('Fatal');
  });

  it('maps OpenTelemetry numbered names to their base name', () => {
    expect(normalizeSeverityText('INFO2')).toBe('Info');
    expect(normalizeSeverityText('WARN4')).toBe('Warn');
  });

  it('title-cases unknown values and skips empty or non-string ones', () => {
    expect(normalizeSeverityText('VERBOSE')).toBe('Verbose');
    expect(normalizeSeverityText('  ')).toBeUndefined();
    expect(normalizeSeverityText(undefined)).toBeUndefined();
    expect(normalizeSeverityText(9)).toBeUndefined();
  });

  it('covers the OpenTelemetry severity text field names', () => {
    expect(SEVERITY_TEXT_FIELDS.has('severityText')).toBe(true);
    expect(SEVERITY_TEXT_FIELDS.has('severity.text')).toBe(true);
  });
});
