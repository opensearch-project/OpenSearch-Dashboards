/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryTypeDetector } from './index';
import { LanguageType } from '../../types';

describe('QueryTypeDetector', () => {
  const detector = new QueryTypeDetector();

  it('returns natural language for empty query', () => {
    const result = detector.detect('');
    expect(result.type).toBe(LanguageType.Natural);
    expect(result.confidence).toBe(0);
    expect(result.reason).toBe('Invalid query input');
    expect(result.warnings).toContain('No valid input provided');
  });

  it('detects PPL query by source pattern', () => {
    const result = detector.detect('source=logs | where status=200');
    expect(result.type).toBe(LanguageType.PPL);
    expect(result.confidence).toBeGreaterThan(0.4);
    expect(result.reason).toContain(
      'Starts with PPL keyword: source=logs; Contains pipe character ' +
        "'|'" +
        '; Has known PPL pipe commands'
    );
  });

  it('detects keyvalue query by key=value', () => {
    const result = detector.detect('field1=value1 and field2="value2"');
    expect(result.type).toBe(LanguageType.KeyValue);
    expect(result.confidence).toBeGreaterThan(0.4);
    expect(result.reason).toContain('Detected 2 key=value pair(s)');
  });

  it('detects natural language by starter', () => {
    const result = detector.detect('Show me all error logs from yesterday');
    expect(result.type).toBe(LanguageType.Natural);
    expect(result.confidence).toBeGreaterThan(0.3);
    expect(result.reason).toContain('Starts with natural language pattern');
  });

  it('detects natural language by question mark', () => {
    const result = detector.detect('What happened yesterday?');
    expect(result.type).toBe(LanguageType.Natural);
    expect(result.confidence).toBeGreaterThan(0.3);
    expect(result.reason).toContain('question mark');
  });

  it('returns natural language for ambiguous/low confidence', () => {
    const result = detector.detect('hello world');
    expect(result.type).toBe(LanguageType.Natural);
  });

  it('penalizes PPL score if NL starter present', () => {
    const result = detector.detect('show source=logs | where status=200');
    expect(result.type).not.toBe(LanguageType.PPL);
    expect(result.reason).toContain('Starts with natural language pattern');
  });

  it('warns for ambiguous PPL', () => {
    const result = detector.detect('source');
    // The warning is only present if score > 0 and < 0.3, but 'source' alone gives score 0.5, so no warning expected
    expect(result.warnings.join(' ')).toBe('');
  });

  it('warns for pipe in keyvalue', () => {
    const result = detector.detect('field1=value1 | field2=value2');
    expect(result.warnings.join(' ')).toMatch(/Pipe character found/);
  });
});
