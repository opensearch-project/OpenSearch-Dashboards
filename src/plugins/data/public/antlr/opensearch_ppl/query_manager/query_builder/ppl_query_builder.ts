/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLSyntaxParser } from '../antlr/ppl_syntax_parser';
import { StatsBuilder } from '../ast/builder/stats_builder';
import { StatsAstVisitor } from '../ast/builder/stats_ast_visitor';

export class PPLQueryBuilder {
  parser: PPLSyntaxParser | null = null;

  build(query: string, pplTokens: any) {
    this.parser = new PPLSyntaxParser().parse(query);
    return this.buildStats(query, pplTokens);
  }

  buildStats(query: string, statsTokens: any) {
    const statsTree = new StatsAstVisitor().visitRoot(this.parser!.root());
    const newStatsAstTree = new StatsBuilder(statsTokens).build();
    if (typeof statsTree.getStartEndIndicesOfOriginQuery !== 'function') {
      return query + ' | ' + newStatsAstTree.toString();
    }

    const indices = statsTree.getStartEndIndicesOfOriginQuery();

    if (indices.start !== -1 && indices.end !== -1) {
      return (
        query.substring(0, indices.start) +
        newStatsAstTree.toString() +
        query.substring(indices.end + 1, query.length)
      );
    } else if (indices && newStatsAstTree) {
      return query + ' | ' + newStatsAstTree.toString();
    }

    return '';
  }

  buildTimeRange(query: string, timeRangeTokens: any) {
    return query;
  }
}
