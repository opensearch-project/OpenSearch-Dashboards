/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../../monaco';
import {
  registerPPLDiagnosticActionContributor,
  collectPPLDiagnosticActions,
  DiagnosticActionContext,
} from '../diagnostic_action';

const ctx: DiagnosticActionContext = {
  marker: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 } as monaco.editor.IMarker,
  model: {} as monaco.editor.ITextModel,
  ruleId: 'agg-on-text',
  aiFixable: true,
};

describe('PPL diagnostic-action contributor registry', () => {
  it('returns no actions when nothing is registered', () => {
    expect(collectPPLDiagnosticActions(ctx)).toEqual([]);
  });

  it('collects actions from a registered contributor', () => {
    const dispose = registerPPLDiagnosticActionContributor((c) =>
      c.aiFixable ? [{ title: 'Ask Olly to fix', commandId: 'ppl.aiFix', args: [c.ruleId] }] : []
    );

    expect(collectPPLDiagnosticActions(ctx)).toEqual([
      { title: 'Ask Olly to fix', commandId: 'ppl.aiFix', args: ['agg-on-text'] },
    ]);

    dispose();
    expect(collectPPLDiagnosticActions(ctx)).toEqual([]);
  });

  it('lets a contributor opt out based on context (not aiFixable)', () => {
    const dispose = registerPPLDiagnosticActionContributor((c) =>
      c.aiFixable ? [{ title: 'x', commandId: 'y' }] : []
    );

    expect(collectPPLDiagnosticActions({ ...ctx, aiFixable: false })).toEqual([]);
    dispose();
  });

  it('merges actions from multiple contributors', () => {
    const d1 = registerPPLDiagnosticActionContributor(() => [{ title: 'a', commandId: 'c1' }]);
    const d2 = registerPPLDiagnosticActionContributor(() => [{ title: 'b', commandId: 'c2' }]);

    const titles = collectPPLDiagnosticActions(ctx).map((a) => a.title).sort();
    expect(titles).toEqual(['a', 'b']);

    d1();
    d2();
  });

  it('isolates a throwing contributor from the others', () => {
    const dThrow = registerPPLDiagnosticActionContributor(() => {
      throw new Error('bad contributor');
    });
    const dGood = registerPPLDiagnosticActionContributor(() => [{ title: 'ok', commandId: 'c' }]);

    expect(collectPPLDiagnosticActions(ctx)).toEqual([{ title: 'ok', commandId: 'c' }]);

    dThrow();
    dGood();
  });
});
