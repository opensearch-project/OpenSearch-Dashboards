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
    const negatedWhereCommand =
      'WHERE ' +
      PPLFilterUtils.toPredicate({
        ...filter,
        meta: { ...filter.meta, negate: !filter.meta.negate },
      });
    const commands = query.split('|').map((cmd) => cmd.trim());
    let filterExists = false;

    for (let i = 0; i < commands.length; i++) {
      if (commands[i].startsWith('WHERE ')) {
        if (commands[i] === whereCommand) {
          filterExists = true;
          break;
        }
        if (commands[i] === negatedWhereCommand) {
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
}
