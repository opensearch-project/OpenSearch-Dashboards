/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../../monaco';
import { diagnosticToMarker, LINT_MARKER_SOURCE } from '../diagnostic_to_marker';
import { Diagnostic } from '../diagnostic';

function makeDiagnostic(overrides: Partial<Diagnostic> = {}): Diagnostic {
  return {
    ruleId: 'rule',
    severity: 'error',
    message: 'msg',
    range: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 5 },
    ...overrides,
  };
}

describe('diagnosticToMarker', () => {
  it('shifts the 0-based ANTLR column to a 1-based Monaco column', () => {
    const marker = diagnosticToMarker(
      makeDiagnostic({ range: { startLine: 2, startColumn: 3, endLine: 2, endColumn: 8 } })
    );
    expect(marker.startColumn).toBe(4);
    expect(marker.endColumn).toBe(9);
  });

  it('clamps a line below one to one', () => {
    const marker = diagnosticToMarker(
      makeDiagnostic({ range: { startLine: 0, startColumn: 0, endLine: 0, endColumn: 1 } })
    );
    expect(marker.startLineNumber).toBe(1);
    expect(marker.endLineNumber).toBe(1);
  });

  it('clamps negative columns and keeps start <= end on the same line', () => {
    const marker = diagnosticToMarker(
      makeDiagnostic({ range: { startLine: 1, startColumn: -5, endLine: 1, endColumn: -10 } })
    );
    expect(marker.startColumn).toBeGreaterThanOrEqual(1);
    expect(marker.endColumn).toBeGreaterThanOrEqual(marker.startColumn);
  });

  it('sets the marker source to ppl-lint', () => {
    const marker = diagnosticToMarker(makeDiagnostic());
    expect(marker.source).toBe(LINT_MARKER_SOURCE);
  });

  it('maps severity', () => {
    expect(diagnosticToMarker(makeDiagnostic({ severity: 'error' })).severity).toBe(
      monaco.MarkerSeverity.Error
    );
    expect(diagnosticToMarker(makeDiagnostic({ severity: 'warning' })).severity).toBe(
      monaco.MarkerSeverity.Warning
    );
    expect(diagnosticToMarker(makeDiagnostic({ severity: 'info' })).severity).toBe(
      monaco.MarkerSeverity.Info
    );
  });

  it('sets code to the object form (value + target) when a doc URL is present', () => {
    const marker = diagnosticToMarker(makeDiagnostic({ docUrl: 'https://example.com/docs' }));
    expect(marker.code).toBeDefined();
    expect((marker.code as { value: string }).value).toBe('rule');
    expect((marker.code as { target: monaco.Uri }).target.toString()).toContain('example.com/docs');
  });

  it('still carries the ruleId on code (plain-string form) when no doc URL is present', () => {
    // ruleId must reach hover provider even without a doc link.
    const marker = diagnosticToMarker(makeDiagnostic({ docUrl: undefined }));
    expect(marker.code).toBe('rule');
  });
});
