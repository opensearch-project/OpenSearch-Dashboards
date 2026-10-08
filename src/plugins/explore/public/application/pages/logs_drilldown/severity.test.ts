/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { detectSeverityField, normalizeSeverity, pickTimeField } from './severity';

describe('detectSeverityField', () => {
  it('prefers severityText, then severity, then level', () => {
    expect(detectSeverityField(['message', 'severityText', 'level'])).toBe('severityText');
    expect(detectSeverityField(['message', 'severity', 'level'])).toBe('severity');
    expect(detectSeverityField(['message', 'level'])).toBe('level');
  });

  it('falls back to severityNumber for numeric-only OTel indexes (text fields win when present)', () => {
    // No text field → use severityNumber (the OTel numeric field).
    expect(detectSeverityField(['message', 'severityNumber', '@timestamp'])).toBe('severityNumber');
    // A text field is preferred over severityNumber when both exist.
    expect(detectSeverityField(['severityNumber', 'severityText'])).toBe('severityText');
    expect(detectSeverityField(['severityNumber', 'level'])).toBe('level');
  });

  it('returns undefined when no severity field exists', () => {
    expect(detectSeverityField(['message', 'user_id', '@timestamp'])).toBeUndefined();
  });
});

describe('pickTimeField', () => {
  it('prefers the canonical OTel/PPL order (@timestamp → time → … → observedTimestamp)', () => {
    expect(pickTimeField(['observedTimestamp', 'time', '@timestamp'])).toBe('@timestamp');
    expect(pickTimeField(['observedTimestamp', 'time'])).toBe('time');
    expect(pickTimeField(['observedTimestamp', 'endTime'])).toBe('endTime');
  });

  it('falls back to the first date field when none match the canonical list', () => {
    expect(pickTimeField(['event.ingested', 'created_on'])).toBe('event.ingested');
  });

  it('returns undefined for no date fields', () => {
    expect(pickTimeField([])).toBeUndefined();
  });
});

describe('normalizeSeverity', () => {
  it('buckets textual levels', () => {
    expect(normalizeSeverity('INFO')).toBe('info');
    expect(normalizeSeverity('Information')).toBe('info');
    expect(normalizeSeverity('WARN')).toBe('warn');
    expect(normalizeSeverity('warning')).toBe('warn');
    expect(normalizeSeverity('ERROR')).toBe('error');
    expect(normalizeSeverity('fatal')).toBe('error');
    expect(normalizeSeverity('debug')).toBe('debug');
    expect(normalizeSeverity('trace')).toBe('debug');
  });

  it('buckets OTel severityNumber ranges', () => {
    expect(normalizeSeverity('9')).toBe('info');
    expect(normalizeSeverity('13')).toBe('warn');
    expect(normalizeSeverity('17')).toBe('error');
    expect(normalizeSeverity('5')).toBe('debug');
  });

  it('returns unknown for empty/unrecognized values', () => {
    expect(normalizeSeverity(undefined)).toBe('unknown');
    expect(normalizeSeverity('')).toBe('unknown');
    expect(normalizeSeverity('banana')).toBe('unknown');
  });
});
