/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream } from 'antlr4ng';
import { OpenSearchSQLLexer, OpenSearchSQLParser } from '@osd/antlr-grammar';
import { Filter } from '../../../../data/common';
import { FilterUtils } from './filter_utils';

export class SQLFilterUtils extends FilterUtils {
  private static insertWhereClause(sql: string, whereClause: string): string {
    const inputStream = CharStream.fromString(sql);
    const lexer = new OpenSearchSQLLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new OpenSearchSQLParser(tokenStream);
    parser.removeErrorListeners();

    const tree = parser.root();
    const selectStmt = tree.sqlStatement()?.dmlStatement()?.selectStatement();
    if (!selectStmt) return `${sql} WHERE ${whereClause}`;

    const querySpec = (selectStmt as any).querySpecification?.();
    if (!querySpec) return `${sql} WHERE ${whereClause}`;

    const fromClause = querySpec.fromClause?.();
    if (!fromClause) return `${sql} WHERE ${whereClause}`;

    const existingWhere = fromClause.whereClause?.();
    if (existingWhere) {
      const whereToken = existingWhere.start!;
      const insertPos = whereToken.stop! + 1;
      return sql.slice(0, insertPos) + ` ${whereClause} AND` + sql.slice(insertPos);
    }

    const relation = fromClause.relation();
    const insertPos = relation.stop!.stop! + 1;
    return sql.slice(0, insertPos) + ` WHERE ${whereClause}` + sql.slice(insertPos);
  }

  private static addFilterToQuery(query: string, filter: Filter): string {
    const predicate = SQLFilterUtils.toPredicate(filter);
    if (!predicate) return query;
    return SQLFilterUtils.insertWhereClause(query, predicate);
  }

  public static addFiltersToQuery(query: string, filters: Filter[]): string {
    return filters.reduce(SQLFilterUtils.addFilterToQuery, query);
  }
}
