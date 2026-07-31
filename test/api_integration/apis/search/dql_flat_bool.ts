/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import {
  fromKueryExpression,
  toOpenSearchQuery,
} from '../../../../src/plugins/data/common/opensearch_query/kuery';
import { FtrProviderContext } from '../../ftr_provider_context';

/**
 * Regression test for https://github.com/opensearch-project/OpenSearch-Dashboards/issues/12503
 *
 * The DQL parser previously built a right-recursive binary tree for OR/AND
 * expressions, causing the translated OpenSearch query to nest bool.should
 * clauses N-1 levels deep for N values.  OpenSearch 2.11+ enforces a default
 * Jackson nesting limit of 100, so any DQL query with 40+ OR values produced a
 * stream_constraints_exception.
 *
 * The fix changes the grammar to use iterative rules that emit a flat
 * bool.should / bool.filter array regardless of how many operands are used.
 * These tests send the translated query directly to OpenSearch to confirm the
 * cluster accepts it without error.
 */
export default function ({ getService }: FtrProviderContext) {
  const opensearchSupertest = getService('opensearchSupertest');

  describe('DQL flat bool query (regression for deep-nesting issue)', () => {
    // Build a query with 50 OR values — enough to exceed the old depth of 100
    // when wrapped in surrounding filter/bool layers.
    const VALUES_50 = Array.from({ length: 50 }, (_, i) => `"val${i}"`);

    function buildQuery(expression: string) {
      const node = fromKueryExpression(expression);
      return toOpenSearchQuery(node);
    }

    it('should accept a DQL OR query with 50 values without a nesting-depth error', async () => {
      const expression = `field:(${VALUES_50.join(' or ')})`;
      const query = buildQuery(expression);

      await opensearchSupertest.post('/_search').send({ query }).expect(200);
    });

    it('should accept a DQL top-level OR query with 50 terms without a nesting-depth error', async () => {
      const expression = VALUES_50.map((v) => `field:${v}`).join(' or ');
      const query = buildQuery(expression);

      await opensearchSupertest.post('/_search').send({ query }).expect(200);
    });

    it('should accept a DQL AND query with 50 terms without a nesting-depth error', async () => {
      const expression = VALUES_50.map((v) => `field${v}:*`).join(' and ');
      const query = buildQuery(expression);

      await opensearchSupertest.post('/_search').send({ query }).expect(200);
    });

    it('translated OR query for field shorthand should be a flat bool.should, not a nested tree', async () => {
      const expression = `field:(${VALUES_50.join(' or ')})`;
      const query = buildQuery(expression);

      // The top-level query must be a single bool with a flat should array of
      // 50 entries — no nested bool inside any of the should clauses.
      const should = (query as any)?.bool?.should as any[];
      if (!Array.isArray(should) || should.length !== 50) {
        throw new Error(
          `Expected flat bool.should with 50 entries, got: ${JSON.stringify(query, null, 2)}`
        );
      }
      should.forEach((clause, i) => {
        if (clause.bool) {
          throw new Error(
            `should[${i}] is itself a bool clause — nesting is not flat: ${JSON.stringify(clause)}`
          );
        }
      });
    });
  });
}
