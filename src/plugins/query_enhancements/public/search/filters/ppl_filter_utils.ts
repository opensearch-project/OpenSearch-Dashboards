/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Filter } from '../../../../data/common';
import { FilterUtils } from './filter_utils';

export class PPLFilterUtils extends FilterUtils {
  /**
   * Inserts a WHERE command into a PPL query string after the first command.
   *
   * @param query - The original PPL query string
   * @param whereCommand - The where command string to insert
   * @returns A new PPL query string with the WHERE command inserted
   */
  public static insertWhereCommand(query: string, whereCommand: string): string {
    if (!whereCommand) return query;

    const commands = query.split('|');
    commands.splice(1, 0, whereCommand);
    return commands.map((cmd) => cmd.trim()).join(' | ');
  }

  private static addFilterToQuery(query: string, filter: Filter): string {
    const predicate = PPLFilterUtils.toPredicate(filter);
    if (!predicate) return query;

    const whereCommand = 'WHERE ' + predicate;
    const negatedPredicate = PPLFilterUtils.toPredicate({
      ...filter,
      meta: { ...filter.meta, negate: !filter.meta.negate },
    });
    const commands = query.split('|').map((cmd) => cmd.trim());
    let filterExists = false;

    for (let i = 0; i < commands.length; i++) {
      const match = commands[i].match(/^where\s+(.*)$/is);
      if (match) {
        const existingPredicate = match[1];
        if (existingPredicate === predicate) {
          filterExists = true;
          break;
        }
        if (existingPredicate === negatedPredicate) {
          filterExists = true;
          commands[i] = whereCommand;
          break;
        }
      }
    }

    if (!filterExists) {
      commands.splice(1, 0, whereCommand);
    }

    return commands.join(' | ').trim();
  }

  /**
   * Inserts filters into a query string by converting them to PPL predicates
   * and adding WHERE clauses after the first command. If a matching filter
   * already exists, it won't be added again. If a negated version exists, it
   * will be replaced.
   *
   * @param query - The query string
   * @param filter - The Filter objects to insert into the query
   * @returns A new query string with the filters applied as WHERE clauses
   */
  public static addFiltersToQuery(query: string, filters: Filter[]): string {
    return filters.reduce(PPLFilterUtils.addFilterToQuery, query);
  }

  /**
   * Extracts the index named after the first `source=` in a PPL query, stripped of
   * surrounding backticks/quotes. Returns `undefined` when no `source=` is found.
   *
   * NOTE: intentionally simple — it matches the first `source=` token only and does
   * NOT resolve aliases, handle multi-source/subquery forms, or normalize index
   * patterns. It is isolated here as a pure function so the out-of-dataset heuristic
   * (see `sourceDiffersFromDataset`) can be revised in one place if this proves too
   * coarse. See REVIEW-GUIDE-urgent-bugfixes.md "Known gaps".
   *
   * @param queryString - The raw PPL query string
   * @returns The source index name, or `undefined`
   */
  public static extractSourceIndex(queryString: string): string | undefined {
    const match = /\bsource\s*=\s*([`'"]?)([^\s`'"|,]+)\1/i.exec(queryString);
    return match?.[2];
  }

  /**
   * True when the query's `source=` clearly names a different index than the given
   * dataset title. When they differ, the dataset's time field almost certainly does
   * not exist on the queried index, so callers skip time-filter injection and the
   * default time-sort to avoid a `field <timeField> not found` failure.
   *
   * Comparison is case-insensitive and ignores a single trailing `*` on the dataset
   * title (e.g. `request_logs*`). Returns `false` when either side is missing, so the
   * caller falls back to its normal (always-inject) behavior.
   *
   * @param queryString - The raw PPL query string
   * @param datasetTitle - The selected dataset's title (may be `undefined`)
   * @returns Whether the queried source differs from the dataset
   */
  public static sourceDiffersFromDataset(
    queryString: string,
    datasetTitle: string | undefined
  ): boolean {
    const source = PPLFilterUtils.extractSourceIndex(queryString);
    if (!source || !datasetTitle) return false;
    const normalize = (value: string) => value.toLowerCase().replace(/\*$/, '');
    return normalize(source) !== normalize(datasetTitle);
  }
}
