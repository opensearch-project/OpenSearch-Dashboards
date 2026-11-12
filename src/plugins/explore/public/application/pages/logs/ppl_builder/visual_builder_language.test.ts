/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreFlavor } from '../../../../../common';
import {
  SourceTypeRegistryService,
  setSourceTypeRegistry,
} from '../../../../services/source_type_registry';
import type { SourceTypeVisualBuilder } from '../../../../services/source_type_registry';
import { AGG_FUNCTIONS } from './operations';
import { OPERATOR_DEFS } from './where_operators';
import { emptyState } from './types';
import {
  aggregationsFor,
  filterOperatorsFor,
  pplVisualBuilder,
  resolveVisualBuilder,
} from './visual_builder_language';

const translation: SourceTypeVisualBuilder = {
  build: () => '',
  parse: () => ({ canBuild: false, state: emptyState() }),
  aggregationColumn: () => null,
  filterText: () => null,
};

describe('visual builder languages', () => {
  afterEach(() => setSourceTypeRegistry(new SourceTypeRegistryService()));

  describe('resolveVisualBuilder', () => {
    beforeEach(() => {
      const registry = new SourceTypeRegistryService();
      registry.register({
        id: 'fake',
        label: 'Fake',
        datasetTypes: ['FAKE'],
        flavors: [ExploreFlavor.Logs],
        resolveDefaultDataset: async () => undefined,
        languageSettings: {
          OwnQL: { visualBuilder: translation },
          CodeQL: {},
          PPL: { supportsVisualBuilder: true },
        },
      });
      setSourceTypeRegistry(registry);
    });

    it('uses PPL for the built-in languages', () => {
      expect(resolveVisualBuilder('PPL', { type: 'INDEX_PATTERN' })).toBe(pplVisualBuilder);
    });

    it("uses a source's own translation for its language", () => {
      expect(resolveVisualBuilder('OwnQL', { type: 'FAKE' })).toBe(translation);
    });

    it('uses PPL for a source language that opts into the builder without a translation', () => {
      expect(resolveVisualBuilder('PPL', { type: 'FAKE' })).toBe(pplVisualBuilder);
    });

    it('offers no builder for a code-only language', () => {
      expect(resolveVisualBuilder('CodeQL', { type: 'FAKE' })).toBeUndefined();
    });
  });

  it('lists all aggregations and operators unless the language narrows them', () => {
    expect(aggregationsFor(translation)).toEqual(AGG_FUNCTIONS);
    expect(filterOperatorsFor(translation)).toEqual(OPERATOR_DEFS);
  });

  it("keeps Explore's menu order for a narrowed list", () => {
    const narrowed = {
      ...translation,
      aggregations: ['max', 'count'],
      filterOperators: ['exists', 'is'],
    } as SourceTypeVisualBuilder;
    expect(aggregationsFor(narrowed).map((def) => def.id)).toEqual(['count', 'max']);
    expect(filterOperatorsFor(narrowed).map((def) => def.value)).toEqual(['is', 'exists']);
  });

  it('describes a PPL filter as its where command, and an unfinished one as null', () => {
    expect(
      pplVisualBuilder.filterText({ id: 'f', field: 'service', operator: 'is', values: ['web'] })
    ).toBe("where `service` = 'web'");
    expect(
      pplVisualBuilder.filterText({ id: 'f', field: 'service', operator: 'is', values: [] })
    ).toBeNull();
  });
});
