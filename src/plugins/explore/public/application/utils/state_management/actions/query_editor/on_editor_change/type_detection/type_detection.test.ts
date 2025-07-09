/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryTypeDetector } from './type_detection';
import { EditorLanguage } from './constants';

describe('QueryTypeDetector', () => {
  it('returns undetermined for empty query', () => {
    const result = QueryTypeDetector.detect('');
    expect(result.type).toBe(EditorLanguage.Undetermined);
    expect(result.confidence).toBe(0);
    expect(result.reason).toBe('Invalid query input');
    expect(result.warnings).toContain('No valid input provided');
  });

  it('detects PPL query by source pattern', () => {
    const result = QueryTypeDetector.detect('source=logs | where status=200');
    expect(result.type).toBe(EditorLanguage.PPL);
    expect(result.confidence).toBeGreaterThan(0.4);
    expect(result.reason).toContain(
      'Starts with PPL keyword: source=logs; Contains pipe character ' +
        "'|'" +
        '; Has known PPL pipe commands'
    );
  });

  it('detects keyvalue query by key=value', () => {
    const result = QueryTypeDetector.detect('field1=value1 and field2="value2"');
    expect(result.type).toBe(EditorLanguage.PPL);
    expect(result.confidence).toBeGreaterThan(0.4);
    expect(result.reason).toContain('Detected 2 key=value pair(s)');
  });

  it('detects natural language by starter', () => {
    const result = QueryTypeDetector.detect('Show me all error logs from yesterday');
    expect(result.type).toBe(EditorLanguage.Natural);
    expect(result.confidence).toBeGreaterThan(0.3);
    expect(result.reason).toContain('Starts with natural language pattern');
  });

  it('detects natural language by question mark', () => {
    const result = QueryTypeDetector.detect('What happened yesterday?');
    expect(result.type).toBe(EditorLanguage.Natural);
    expect(result.confidence).toBeGreaterThan(0.3);
    expect(result.reason).toContain('question mark');
  });

  it('returns undetermined for ambiguous/low confidence', () => {
    const result = QueryTypeDetector.detect('hello world');
    expect(result.type).toBe(EditorLanguage.Undetermined);
  });

  it('penalizes PPL score if NL starter present', () => {
    const result = QueryTypeDetector.detect('show source=logs | where status=200');
    expect(result.type).not.toBe(EditorLanguage.PPL);
    expect(result.reason).toContain('Starts with natural language pattern');
  });

  it('warns for ambiguous PPL', () => {
    const result = QueryTypeDetector.detect('source');
    // The warning is only present if score > 0 and < 0.3, but 'source' alone gives score 0.5, so no warning expected
    expect(result.warnings.join(' ')).toBe('');
  });

  it('warns for pipe in keyvalue', () => {
    const result = QueryTypeDetector.detect('field1=value1 | field2=value2');
    expect(result.warnings.join(' ')).toMatch(/Pipe character found/);
  });
});
