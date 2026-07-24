/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLWorkerImpl } from './ppl.worker';
import type { SerializableLintContext } from '../lint/types';

// The compiled worker receives a structured-clone-safe context (Sets/Maps
// flattened to arrays/objects by language.ts) and must rebuild the Sets/Maps
// before running the analyzer. These tests drive PPLWorkerImpl.lint directly to
// lock in that hydration for the typeMap the type-aware rules depend on.

describe('PPLWorkerImpl typeMap hydration', () => {
  const worker = new PPLWorkerImpl();

  it('rebuilds typeMap from the flattened record and fires a type-aware rule', async () => {
    const context: SerializableLintContext = {
      typeMap: { name: 'text' },
    };
    const { diagnostics } = await worker.lint('search t | stats avg(name)', context);
    expect(diagnostics.map((d) => d.ruleId)).toContain('agg-on-text');
  });

  it('does not fire the type-aware rule for a numeric field', async () => {
    const context: SerializableLintContext = {
      typeMap: { age: 'long' },
    };
    const { diagnostics } = await worker.lint('search t | stats avg(age)', context);
    expect(diagnostics.map((d) => d.ruleId)).not.toContain('agg-on-text');
  });

  it('rebuilds a dotted-key typeMap (Object.entries preserves the dotted name)', async () => {
    // flat-object-subfield is gated to Calcite >= 3.8; declare that surface so the
    // test exercises typeMap hydration rather than the version filter.
    const context: SerializableLintContext = {
      dataSourceVersion: '3.8.0',
      isCalcite: true,
      typeMap: { attributes: 'flat_object' },
    };
    const { diagnostics } = await worker.lint('search t | fields attributes.http', context);
    expect(diagnostics.map((d) => d.ruleId)).toContain('flat-object-subfield');
  });

  it('self-suppresses the type-aware rules when no context is passed', async () => {
    const { diagnostics } = await worker.lint('search t | stats avg(name)');
    expect(diagnostics.map((d) => d.ruleId)).not.toContain('agg-on-text');
  });

  it('self-suppresses when the flattened typeMap is absent', async () => {
    const context: SerializableLintContext = { fields: ['name'] };
    const { diagnostics } = await worker.lint('search t | stats avg(name)', context);
    expect(diagnostics.map((d) => d.ruleId)).not.toContain('agg-on-text');
  });
});
